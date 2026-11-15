import type { RateLimitBinding } from './rate-limit'

export interface D1Result<T> {
  results?: T[]
  success: boolean
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  first<T>(): Promise<T | null>
  all<T>(): Promise<D1Result<T>>
  run(): Promise<D1Result<unknown>>
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement
  batch<T = unknown>(
    statements: D1PreparedStatement[],
  ): Promise<Array<D1Result<T>>>
}

export interface AssetFetcher {
  fetch(request: Request): Promise<Response>
}

export interface Env {
  DB: D1Database
  ASSETS: AssetFetcher
  RESEND_API_KEY?: string
  AUTH_EMAIL_FROM?: string
  APP_ORIGIN?: string
  AUTH_LOGIN_LIMITER?: RateLimitBinding
  AUTH_REGISTER_LIMITER?: RateLimitBinding
  AUTH_DEMO_LIMITER?: RateLimitBinding
}
