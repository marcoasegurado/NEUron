import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { stdout } from 'node:process'
import { pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const wranglerBin = join(
  dirname(require.resolve('wrangler/package.json')),
  'bin',
  'wrangler.js',
)

const MIN_GRADE = 1
const MAX_GRADE = 5
const MIN_PERCENTAGE = 0
const MAX_PERCENTAGE = 100

function usage() {
  stdout.write(
    [
      'Usage:',
      '  npm run cf:conversion:load -- --file <path.json> [--apply] [--local]',
      '',
      'Loads the single application-wide percentage-to-grade table.',
      '',
      'Options:',
      '  --file <path>  JSON file containing the approved rows.',
      '  --apply        Write the rows. Without this flag the command is a dry run.',
      '  --local        Target the local D1 database instead of remote.',
      '',
      'File format (either shape is accepted):',
      '  [ { "minimumPercentage": 0, "grade": 5.0 } ]',
      '  { "rows": [ { "minimumPercentage": 0, "grade": 5.0 } ] }',
      '',
      'Rules enforced before any write:',
      '  - at least one row, and a row with minimumPercentage 0',
      '  - every percentage is between 0 and 100',
      '  - every grade is between 1.00 and 5.00',
      '  - thresholds are unique',
      '',
      'The table is shared by every account and semester, so loading it changes',
      'existing grades and GWA. The dry run prints how many are affected.',
      'Only load thresholds that have been verified against an official NEU source.',
      '',
    ].join('\n'),
  )
}

function parseArgs(argv) {
  const args = { apply: false, local: false }
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--apply') {
      args.apply = true
      continue
    }
    if (arg === '--local') {
      args.local = true
      continue
    }
    if (arg === '--help' || arg === '-h') {
      args.help = true
      continue
    }
    if (arg === '--file') {
      const value = argv[index + 1]
      if (!value) {
        throw new Error('Missing value for --file.')
      }
      args.file = value
      index += 1
      continue
    }
    throw new Error(`Unknown argument: ${arg}`)
  }
  return args
}

function readRowsFile(path) {
  let parsed
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    throw new Error(`Could not read ${path}: ${error.message}`)
  }

  const rows = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.rows)
      ? parsed.rows
      : null

  if (!rows) {
    throw new Error(
      'The file must be a JSON array of rows or an object with a rows array.',
    )
  }

  return rows
}

function validateRows(rows) {
  const errors = []

  if (rows.length === 0) {
    errors.push('The table needs at least one row.')
    return errors
  }

  const seen = new Set()

  rows.forEach((row, index) => {
    const position = `Row ${index + 1}`
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      errors.push(`${position} must be an object.`)
      return
    }

    const percentage = row.minimumPercentage
    const grade = row.grade

    if (
      typeof percentage !== 'number' ||
      !Number.isFinite(percentage) ||
      percentage < MIN_PERCENTAGE ||
      percentage > MAX_PERCENTAGE
    ) {
      errors.push(
        `${position} needs a numeric minimumPercentage between 0 and 100.`,
      )
    } else if (seen.has(percentage)) {
      errors.push(`${position} repeats the ${percentage}% threshold.`)
    } else {
      seen.add(percentage)
    }

    if (
      typeof grade !== 'number' ||
      !Number.isFinite(grade) ||
      grade < MIN_GRADE ||
      grade > MAX_GRADE
    ) {
      errors.push(`${position} needs a numeric grade between 1.00 and 5.00.`)
    }
  })

  if (!seen.has(0)) {
    errors.push('A 0% threshold is required so the table covers every grade.')
  }

  return errors
}

function sortedRows(rows) {
  return [...rows].sort((a, b) => a.minimumPercentage - b.minimumPercentage)
}

function formatRow(row) {
  return `  >= ${row.minimumPercentage.toFixed(2)}%  ->  ${row.grade.toFixed(2)}`
}

function wranglerArgs(local, extra) {
  return [
    wranglerBin,
    'd1',
    'execute',
    'neuron',
    local ? '--local' : '--remote',
    ...extra,
  ]
}

function queryJson(sql, local) {
  const result = spawnSync(
    process.execPath,
    wranglerArgs(local, ['--json', '--command', sql]),
    { encoding: 'utf8', shell: false },
  )

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    throw new Error(
      `D1 query failed.\n${result.stderr ?? ''}`.trim(),
    )
  }

  let parsed
  try {
    parsed = JSON.parse(result.stdout)
  } catch {
    throw new Error('Could not parse the D1 query response.')
  }

  return parsed
}

function scalarCount(sql, local) {
  const parsed = queryJson(sql, local)
  const first = Array.isArray(parsed) ? parsed[0] : null
  const row = first?.results?.[0]
  const value = row ? Object.values(row)[0] : 0
  return typeof value === 'number' ? value : Number(value) || 0
}

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`
}

function buildSql(rows) {
  const now = new Date().toISOString()
  const values = rows
    .map((row) => {
      return `(${[
        crypto.randomUUID(),
        row.minimumPercentage,
        row.grade,
        now,
        now,
      ]
        .map((value) =>
          typeof value === 'number' ? String(value) : sqlString(value),
        )
        .join(', ')})`
    })
    .join(',\n    ')

  return [
    'BEGIN;',
    'DELETE FROM conversion_rows;',
    `INSERT INTO conversion_rows
    (id, minimum_percentage, grade, created_at, updated_at)
  VALUES
    ${values};`,
    'COMMIT;',
    '',
  ].join('\n')
}

function applySql(sql, local) {
  const directory = mkdtempSync(join(tmpdir(), 'neuron-conversion-'))
  const file = join(directory, 'load.sql')
  try {
    writeFileSync(file, sql)
    const result = spawnSync(
      process.execPath,
      wranglerArgs(local, ['--file', file]),
      { stdio: 'inherit', shell: false },
    )
    if (result.error) {
      throw result.error
    }
    if (result.status !== 0) {
      throw new Error('D1 write failed.')
    }
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    usage()
    return
  }

  if (!args.file) {
    usage()
    throw new Error('Missing --file.')
  }

  const rows = readRowsFile(args.file)
  const errors = validateRows(rows)

  if (errors.length > 0) {
    throw new Error(`The table is not valid:\n- ${errors.join('\n- ')}`)
  }

  const ordered = sortedRows(rows)
  const target = args.local ? 'local' : 'remote'

  stdout.write(`Conversion table (${target}), ${ordered.length} rows:\n`)
  stdout.write(`${ordered.map(formatRow).join('\n')}\n`)

  const semesters = scalarCount('SELECT COUNT(*) AS total FROM semesters', args.local)
  const subjects = scalarCount('SELECT COUNT(*) AS total FROM subjects', args.local)
  stdout.write(
    `\nThis table is shared by every account and semester. Loading it recalculates grades and GWA for ${semesters} semester(s) and ${subjects} subject(s).\n`,
  )

  if (!args.apply) {
    stdout.write('\nDry run only. Re-run with --apply to write these rows.\n')
    return
  }

  applySql(buildSql(ordered), args.local)

  const stored = scalarCount(
    'SELECT COUNT(*) AS total FROM conversion_rows',
    args.local,
  )
  stdout.write(`\nApplied. conversion_rows now contains ${stored} row(s).\n`)
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    main()
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
