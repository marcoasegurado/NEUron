import { apiRequest } from '../../lib/api'

export interface PendingAccount {
  id: string
  email: string
  username: string
  displayName: string
  createdAt: string
}

interface PendingAccountsResponse {
  accounts: PendingAccount[]
}

interface AccountResponse {
  account: PendingAccount
}

export async function listPendingAccounts(): Promise<PendingAccount[]> {
  const response = await apiRequest<PendingAccountsResponse>(
    '/api/admin/accounts',
  )
  return response.accounts
}

async function decide(
  id: string,
  decision: 'approve' | 'reject',
): Promise<PendingAccount> {
  const response = await apiRequest<AccountResponse>(
    `/api/admin/accounts/${encodeURIComponent(id)}/${decision}`,
    { method: 'POST' },
  )
  return response.account
}

export function approveAccount(id: string): Promise<PendingAccount> {
  return decide(id, 'approve')
}

export function rejectAccount(id: string): Promise<PendingAccount> {
  return decide(id, 'reject')
}
