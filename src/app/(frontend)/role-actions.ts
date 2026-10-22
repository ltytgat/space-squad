'use server'

import { cookies } from 'next/headers'
import { headers } from 'next/headers.js'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { ACTIVE_MODE_COOKIE, type ActiveMode } from '@/lib/activeMode'

export async function setActiveMode(mode: ActiveMode) {
  if (mode !== 'player' && mode !== 'mj') return { success: false }
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user || user.role !== 'player' || (mode === 'mj' && (user as any).isMJ !== true)) {
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
