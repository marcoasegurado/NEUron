const PASSWORD_ALGORITHM = 'pbkdf2-sha256'
export const PASSWORD_ITERATIONS = 10_000
const SALT_BYTES = 16
const HASH_BYTES = 32
const TOKEN_BYTES = 32

const encoder = new TextEncoder()

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length))
}

function base64ToBase64Url(value: string): string {
  return value.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

async function derivePasswordHash(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: new Uint8Array(salt).buffer,
      iterations,
      hash: 'SHA-256',
    },
    key,
    HASH_BYTES * 8,
  )
  return bytesToBase64(new Uint8Array(bits))
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES)
  const hash = await derivePasswordHash(password, salt, PASSWORD_ITERATIONS)
  return [
    PASSWORD_ALGORITHM,
    String(PASSWORD_ITERATIONS),
    bytesToBase64(salt),
    hash,
  ].join('$')
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) {
    return false
  }

  let difference = 0
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index]
  }
  return difference === 0
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const parts = storedHash.split('$')
  if (parts.length !== 4 || parts[0] !== PASSWORD_ALGORITHM) {
    return false
  }

  const iterations = Number.parseInt(parts[1], 10)
  if (!Number.isFinite(iterations) || iterations <= 0) {
    return false
  }

  let salt: Uint8Array
  let expected: Uint8Array
  try {
    salt = base64ToBytes(parts[2])
    expected = base64ToBytes(parts[3])
  } catch {
    return false
  }

  const actual = await derivePasswordHash(password, salt, iterations)
  return constantTimeEqual(base64ToBytes(actual), expected)
}

export function createToken(): string {
  return base64ToBase64Url(bytesToBase64(randomBytes(TOKEN_BYTES)))
}

export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    encoder.encode(token),
  )
  return bytesToBase64(new Uint8Array(digest))
}

export function createId(): string {
  return crypto.randomUUID()
}
