'use server'

import { randomBytes } from 'node:crypto'
import { cookies, headers } from 'next/headers.js'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import config from '@/payload.config'
import {
  getCreationIPHash,
  getWorkspaceFromCookie,
  hashWorkspaceToken,
  refreshWorkspaceActivity,
  TEMP_WORKSPACE_COOKIE,
  TEMP_WORKSPACE_MAX_ACTIVE,
  TEMP_WORKSPACE_MAX_CREATES_PER_IP_PER_HOUR,
  TEMP_WORKSPACE_TTL_MS,
  temporaryWorkspaceCookieOptions,
} from '@/lib/temporaryCharacterWorkspace'

export async function startTemporaryCharacterWorkspace() {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await headers() })
  if (user) redirect('/character')

  const cookieStore = await cookies()
  const existing = await getWorkspaceFromCookie(payload)
  if (existing) {
    const { docs } = await payload.find({
      collection: 'characters',
      where: { workspace: { equals: existing.id } },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    })
    if (docs[0]) {
      const token = cookieStore.get(TEMP_WORKSPACE_COOKIE)!.value
      await refreshWorkspaceActivity(payload, existing)
      cookieStore.set(TEMP_WORKSPACE_COOKIE, token, temporaryWorkspaceCookieOptions())
      redirect(`/temporary-character/${docs[0].id}`)
    }
  }
  cookieStore.delete(TEMP_WORKSPACE_COOKIE)

  const token = randomBytes(32).toString('base64url')
  const now = new Date()
  const expiresAt = new Date(now.getTime() + TEMP_WORKSPACE_TTL_MS)
  const ipHash = await getCreationIPHash()
  const transactionID = await payload.db.beginTransaction?.()
  if (!transactionID) throw new Error('Les transactions de la base sont indisponibles.')
  const transactionDb = (payload.db as any).sessions?.[transactionID]?.db
  if (!transactionDb) {
    await payload.db.rollbackTransaction?.(transactionID)
    throw new Error('Impossible d’ouvrir la transaction.')
  }
  const req = { transactionID } as any
  let characterId: number

  try {
    await payload.db.execute({ db: transactionDb, sql: sql`SELECT pg_advisory_xact_lock(hashtextextended('ss-temp-workspace-global', 0))` })
    if (ipHash) {
      await payload.db.execute({
        db: transactionDb,
        sql: sql`SELECT pg_advisory_xact_lock(hashtextextended(${`ss-temp-workspace-ip:${ipHash}`}, 0))`,
      })
      const recent = await payload.db.execute({
        db: transactionDb,
        sql: sql`SELECT COUNT(*)::int AS count FROM character_workspaces WHERE created_from_hash = ${ipHash} AND created_at > ${new Date(now.getTime() - 60 * 60 * 1000)}`,
      })
      if (Number(recent.rows?.[0]?.count ?? 0) >= TEMP_WORKSPACE_MAX_CREATES_PER_IP_PER_HOUR) {
        throw new Error('Trop de sessions temporaires ont été créées depuis cette connexion. Réessayez plus tard.')
      }
    }

    const active = await payload.db.execute({
      db: transactionDb,
      sql: sql`SELECT COUNT(*)::int AS count FROM character_workspaces WHERE expires_at > ${now}`,
    })
    if (Number(active.rows?.[0]?.count ?? 0) >= TEMP_WORKSPACE_MAX_ACTIVE) {
      throw new Error('Le nombre de sessions temporaires disponibles est atteint. Réessayez plus tard.')
    }

    const workspace = await payload.create({
      collection: 'character-workspaces',
      data: {
        tokenHash: hashWorkspaceToken(token),
        createdFromHash: ipHash,
        lastActivityAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        requestWindowStartedAt: now.toISOString(),
        requestCount: 0,
      },
      overrideAccess: true,
      req,
    })
    const character = await payload.create({
      collection: 'characters',
      data: { user: null, workspace: workspace.id, creationEtape: 'caracteristiques' } as any,
      overrideAccess: true,
      req,
    })
    await payload.db.commitTransaction?.(transactionID)
    characterId = Number(character.id)
  } catch (error) {
    await payload.db.rollbackTransaction?.(transactionID).catch(() => undefined)
    throw error
  }
  cookieStore.set(TEMP_WORKSPACE_COOKIE, token, temporaryWorkspaceCookieOptions())
  redirect(`/temporary-character/${characterId}`)
}
