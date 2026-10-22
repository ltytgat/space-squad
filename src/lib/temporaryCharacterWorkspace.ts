import 'server-only'

import { createHash, createHmac } from 'node:crypto'
import { cookies, headers } from 'next/headers.js'
import { sql } from '@payloadcms/db-postgres'
import { envLimit } from '@/lib/envLimit'
export { stripTemporaryWorkspaceSecrets as stripWorkspaceSecrets } from '@/lib/temporaryCharacterRules'

export const TEMP_WORKSPACE_COOKIE = 'ss_temporary_character_workspace'
export const TEMP_WORKSPACE_TTL_MS = 24 * 60 * 60 * 1000
export const TEMP_WORKSPACE_MAX_ACTIVE = envLimit('TEMP_WORKSPACE_MAX_ACTIVE', 500)
export const TEMP_WORKSPACE_MAX_CREATES_PER_IP_PER_HOUR = envLimit('TEMP_WORKSPACE_MAX_CREATES_PER_IP_PER_HOUR', 5)
export const TEMP_WORKSPACE_MAX_REQUESTS_PER_HOUR = envLimit('TEMP_WORKSPACE_MAX_REQUESTS_PER_HOUR', 120)
export const TEMP_WORKSPACE_MAX_ARRAY_ITEMS = envLimit('TEMP_WORKSPACE_MAX_ARRAY_ITEMS', 100)
export const TEMP_WORKSPACE_MAX_CUSTOM_SKILLS = envLimit('TEMP_WORKSPACE_MAX_CUSTOM_SKILLS', 20)
export const TEMP_WORKSPACE_MAX_PAYLOAD_BYTES = envLimit('TEMP_WORKSPACE_MAX_PAYLOAD_BYTES', 128_000)

export function hashWorkspaceToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function getWorkspaceFromCookie(payload: any) {
  const token = (await cookies()).get(TEMP_WORKSPACE_COOKIE)?.value
  if (!token || token.length < 40 || token.length > 100) return null

  const { docs } = await payload.find({
    collection: 'character-workspaces',
    where: { tokenHash: { equals: hashWorkspaceToken(token) } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
  const workspace = docs[0] as any
  if (!workspace || !Number.isSafeInteger(Number(workspace.id))) return null
  if (!workspace.expiresAt || new Date(workspace.expiresAt).getTime() <= Date.now()) return null
  return workspace
}

export async function refreshWorkspaceActivity(payload: any, workspace: any, req?: any) {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + TEMP_WORKSPACE_TTL_MS)
  const transactionID = req?.transactionID
  const transactionDb = transactionID ? (payload.db as any).sessions?.[transactionID]?.db : undefined
  const result = await payload.db.execute({
    ...(transactionDb ? { db: transactionDb } : { drizzle: (payload.db as any).drizzle }),
    sql: sql`UPDATE character_workspaces SET last_activity_at = ${now}, expires_at = ${expiresAt}, updated_at = ${now} WHERE id = ${workspace.id} AND expires_at > ${now} RETURNING id`,
  })
  if (!result.rows?.length) throw new Error('Cette session temporaire a expiré.')
}

/** Atomically refresh the idle expiry and consume one workspace write quota slot. */
export async function consumeWorkspaceRequest(payload: any, workspaceId: number, req?: any) {
  const now = new Date()
  const windowStart = new Date(now.getTime() - 60 * 60 * 1000)
  const expiresAt = new Date(now.getTime() + TEMP_WORKSPACE_TTL_MS)
  const transactionID = req?.transactionID
  const transactionDb = transactionID ? (payload.db as any).sessions?.[transactionID]?.db : undefined
  const query = await payload.db.execute({
    ...(transactionDb ? { db: transactionDb } : { drizzle: (payload.db as any).drizzle }),
    sql: sql`
      UPDATE character_workspaces
      SET last_activity_at = ${now}, expires_at = ${expiresAt},
          request_window_started_at = CASE
            WHEN request_window_started_at <= ${windowStart} THEN ${now}
            ELSE request_window_started_at
          END,
          request_count = CASE
            WHEN request_window_started_at <= ${windowStart} THEN 1
            ELSE request_count + 1
          END,
          updated_at = ${now}
      WHERE id = ${workspaceId}
        AND expires_at > ${now}
        AND (request_window_started_at <= ${windowStart} OR request_count < ${TEMP_WORKSPACE_MAX_REQUESTS_PER_HOUR})
      RETURNING id
    `,
  })
  if (!query.rows?.length) throw new Error('Cette session temporaire a expiré ou a dépassé sa limite de requêtes.')
}

export async function getCreationIPHash(): Promise<string | null> {
  const requestHeaders = await headers()
  const address = requestHeaders.get('x-real-ip')?.trim()
    || requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim()
  const secret = process.env.PAYLOAD_SECRET
  if (!address || !secret) return null
  return createHmac('sha256', secret).update(address).digest('hex')
}

export function temporaryWorkspaceCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: TEMP_WORKSPACE_TTL_MS / 1000,
  }
}
