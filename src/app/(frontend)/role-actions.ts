'use server'

import { cookies } from 'next/headers'
import { headers } from 'next/headers.js'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { ACTIVE_MODE_COOKIE, type ActiveMode } from '@/lib/activeMode'

export async function becomeMJ(): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const payload = await getPayload({ config: await config })
    const { user } = await payload.auth({ headers: await headers() })
    if (!user) return { success: false, error: 'Connectez-vous pour devenir MJ.' }
    if (user.role === 'admin' || user.isMJ === true) return { success: true }
    if (user.role !== 'player') return { success: false, error: 'Impossible d’activer les droits MJ.' }

    // Only the authenticated account can receive the MJ flag through this action.
    // Generic API updates to roles remain restricted to administrators.
    await payload.update({
      collection: 'users',
      id: user.id,
      data: { isMJ: true },
      overrideAccess: true,
    })
    return { success: true }
  } catch (error) {
    console.error('[becomeMJ] Échec de l’activation MJ :', error)
    return { success: false, error: 'Impossible d’activer les droits MJ. Réessayez.' }
  }
}

export async function setActiveMode(mode: ActiveMode) {
  if (mode !== 'player' && mode !== 'mj') return { success: false }
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user || user.role !== 'player' || (mode === 'mj' && user.isMJ !== true)) {
    return { success: false }
  }
  ;(await cookies()).set(ACTIVE_MODE_COOKIE, mode, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })
  return { success: true }
}
