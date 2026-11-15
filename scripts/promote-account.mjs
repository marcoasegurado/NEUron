import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { stdout } from 'node:process'
import { pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const wranglerBin = join(
  dirname(require.resolve('wrangler/package.json')),
  'bin',
  'wrangler.js',
)

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_PATTERN = /^[a-z0-9._-]{3,32}$/

function usage() {
  stdout.write(
    [
      'Usage:',
      '  npm run cf:account:promote -- --identifier <email|username> [--local]',
      '',
      'Gives an existing account the owner role and makes sure it is active.',
      'The owner role unlocks the in-app Account requests card in Settings.',
      '',
      'Options:',
      '  --local  Target the local D1 database instead of remote.',
      '',
    ].join('\n'),
  )
}

function parseArgs(argv) {
  const args = { local: false }
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--local') {
      args.local = true
      continue
    }
    if (arg === '--help' || arg === '-h') {
      args.help = true
      continue
    }
    if (arg === '--identifier') {
      const value = argv[index + 1]
      if (!value) {
        throw new Error('Missing value for --identifier.')
      }
      args.identifier = value
      index += 1
      continue
    }
    throw new Error(`Unknown argument: ${arg}`)
  }
  return args
}

function normalizeIdentifier(value) {
  const identifier = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (!identifier) {
    throw new Error('Enter an email or username.')
  }
  if (identifier.includes('@')) {
    if (!EMAIL_PATTERN.test(identifier)) {
      throw new Error('Enter a valid email address.')
    }
  } else if (!USERNAME_PATTERN.test(identifier)) {
    throw new Error(
      'Username must be 3-32 characters and use only letters, numbers, dots, underscores, or hyphens.',
    )
  }
  return identifier
}

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    usage()
    return
  }

  const identifier = normalizeIdentifier(args.identifier)
  const now = new Date().toISOString()
  const sql = `UPDATE users
SET role = 'owner', status = 'active', updated_at = ${sqlString(now)}
WHERE is_demo = 0
  AND (email = ${sqlString(identifier)} OR username = ${sqlString(identifier)})
RETURNING email, username;`

  const result = spawnSync(
    process.execPath,
    [
      wranglerBin,
      'd1',
      'execute',
      'neuron',
      args.local ? '--local' : '--remote',
      '--json',
      '--command',
      sql,
    ],
    { encoding: 'utf8', shell: false },
  )

  if (result.error) {
    throw result.error
  }
  if (result.status !== 0) {
    throw new Error(`D1 write failed.\n${result.stderr ?? ''}`.trim())
  }

  let parsed
  try {
    parsed = JSON.parse(result.stdout)
  } catch {
    throw new Error('Could not parse the D1 response.')
  }

  const first = Array.isArray(parsed) ? parsed[0] : parsed
  const row = first?.results?.[0]
  if (!row) {
    throw new Error(
      `No account matched "${identifier}". Check the email or username.`,
    )
  }

  stdout.write(
    `Promoted ${row.username ?? identifier} (${row.email}) to owner in ${args.local ? 'local' : 'remote'} D1.\n`,
  )
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
