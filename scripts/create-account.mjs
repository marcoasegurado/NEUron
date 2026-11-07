import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { stdin, stdout } from 'node:process'
import { pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const wranglerBin = join(
  dirname(require.resolve('wrangler/package.json')),
  'bin',
  'wrangler.js',
)

const PASSWORD_ALGORITHM = 'pbkdf2-sha256'
const PASSWORD_ITERATIONS = 10_000
const SALT_BYTES = 16
const HASH_BYTES = 32
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_PATTERN = /^[a-z0-9._-]{3,32}$/

function usage() {
  stdout.write(
    [
      'Usage:',
      '  npm run cf:account:create -- --email <email> --username <username> --name <display name> [--local]',
      '',
      'The password is requested interactively and is never passed as an argument.',
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
    if (arg === '--email' || arg === '--username' || arg === '--name') {
      const value = argv[index + 1]
      if (!value) {
        throw new Error(`Missing value for ${arg}.`)
      }
      args[arg.slice(2)] = value
      index += 1
      continue
    }
    throw new Error(`Unknown argument: ${arg}`)
  }
  return args
}

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function normalizeUsername(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function normalizeDisplayName(value) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''
}

function requireEmail(value) {
  const email = normalizeEmail(value)
  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    throw new Error('Enter a valid email address.')
  }
  return email
}

function requireUsername(value) {
  const username = normalizeUsername(value)
  if (!USERNAME_PATTERN.test(username)) {
    throw new Error(
      'Username must be 3-32 characters and use only letters, numbers, dots, underscores, or hyphens.',
    )
  }
  return username
}

function requireDisplayName(value) {
  const displayName = normalizeDisplayName(value)
  if (!displayName || displayName.length > 80) {
    throw new Error('Display name must be 1-80 characters.')
  }
  return displayName
}

function requirePassword(value) {
  if (value.length < 8) {
    throw new Error('Password must be at least 8 characters.')
  }
  if (value.length > 128) {
    throw new Error('Password must be 128 characters or fewer.')
  }
  return value
}

function readPassword(label) {
  return new Promise((resolve, reject) => {
    if (!stdin.isTTY) {
      reject(new Error('Run this command in an interactive terminal.'))
      return
    }

    const wasRaw = stdin.isRaw
    let value = ''

    const cleanup = () => {
      stdin.off('data', onData)
      stdin.setRawMode(Boolean(wasRaw))
      stdin.pause()
    }

    const onData = (chunk) => {
      for (const character of chunk) {
        if (character === '\u0003') {
          cleanup()
          stdout.write('\n')
          reject(new Error('Cancelled.'))
          return
        }
        if (character === '\r' || character === '\n') {
          cleanup()
          stdout.write('\n')
          resolve(value)
          return
        }
        if (character === '\u007f' || character === '\b') {
          if (value) {
            value = value.slice(0, -1)
            stdout.write('\b \b')
          }
          continue
        }
        if (character >= ' ') {
          value += character
          stdout.write('*')
        }
      }
    }

    stdin.setRawMode(true)
    stdin.resume()
    stdin.setEncoding('utf8')
    stdin.on('data', onData)
    stdout.write(label)
  })
}

function bytesToBase64(bytes) {
  return Buffer.from(bytes).toString('base64')
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PASSWORD_ITERATIONS,
      hash: 'SHA-256',
    },
    key,
    HASH_BYTES * 8,
  )
  return [
    PASSWORD_ALGORITHM,
    String(PASSWORD_ITERATIONS),
    bytesToBase64(salt),
    bytesToBase64(new Uint8Array(bits)),
  ].join('$')
}

function sqlString(value) {
  return `'${value.replace(/'/g, "''")}'`
}

function runSql(sql, local) {
  const args = [
    wranglerBin,
    'd1',
    'execute',
    'neuron',
    local ? '--local' : '--remote',
    '--command',
    sql,
  ]
  const result = spawnSync(process.execPath, args, {
    stdio: 'inherit',
    shell: false,
  })
  if (result.error) {
    throw result.error
  }
  if (result.status !== 0) {
    throw new Error('D1 write failed.')
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    usage()
    return
  }

  const email = requireEmail(args.email)
  const username = requireUsername(args.username)
  const displayName = requireDisplayName(args.name)
  const password = requirePassword(await readPassword('Password: '))
  const confirmPassword = await readPassword('Confirm password: ')

  if (password !== confirmPassword) {
    throw new Error('Passwords do not match.')
  }

  const passwordHash = await hashPassword(password)
  const now = new Date().toISOString()
  const id = crypto.randomUUID()
  const sql = `INSERT INTO users (id, email, username, display_name, password_hash, created_at, updated_at) VALUES (${[
    id,
    email,
    username,
    displayName,
    passwordHash,
    now,
    now,
  ]
    .map(sqlString)
    .join(', ')});`

  runSql(sql, args.local)
  stdout.write(
    `Created account ${username} (${email}) in ${args.local ? 'local' : 'remote'} D1.\n`,
  )
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
