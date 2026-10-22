import { cookies } from 'next/headers'

export type ActiveMode = 'player' | 'mj' | 'admin'

export const ACTIVE_MODE_COOKIE = 'space-squad-mode'

/** The cookie only chooses a view; every permission is checked against the user's roles. */
export async function getActiveMode(user: any): Promise<ActiveMode> {
  if (!user) return 'player'
  if (user.role === 'admin') return 'admin'
  if (user.role !== 'player' || user.isMJ !== true) return 'player'
  const value = (await cookies()).get(ACTIVE_MODE_COOKIE)?.value
  return value === 'mj' ? 'mj' : 'player'
}

export async function isMJMode(user: any): Promise<boolean> {
  return (await getActiveMode(user)) === 'mj'
}

export async function assertPlayerMode(user: any): Promise<void> {
  if (user?.role === 'player' && await isMJMode(user)) {
    throw new Error('Passez en mode joueur pour effectuer cette action.')
  }
}
