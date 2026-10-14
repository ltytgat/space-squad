import { getPayload } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import config from '@/payload.config'

const CLEANUP_BATCH_SIZE = 100

export async function cleanupExpiredCharacterWorkspaces() {
  const payload = await getPayload({ config: await config })
  const now = new Date()
  const { docs } = await payload.find({
    collection: 'character-workspaces',
    where: { expiresAt: { less_than_equal: now.toISOString() } },
    depth: 0,
    limit: CLEANUP_BATCH_SIZE,
    sort: 'expiresAt',
    overrideAccess: true,
  })

  let deletedWorkspaces = 0
  let deletedCharacters = 0
  let deletedShips = 0
  for (const workspace of docs as any[]) {
    const transactionID = await payload.db.beginTransaction?.()
    if (!transactionID) throw new Error('Les transactions de la base sont indisponibles.')
    const transactionDb = (payload.db as any).sessions?.[transactionID]?.db
    if (!transactionDb) {
      await payload.db.rollbackTransaction?.(transactionID)
      throw new Error('Impossible d’ouvrir la transaction de nettoyage.')
    }
    const req = { transactionID } as any

    try {
      const lock = await payload.db.execute({
        db: transactionDb,
        sql: sql`SELECT id FROM character_workspaces WHERE id = ${workspace.id} AND expires_at <= ${now} FOR UPDATE SKIP LOCKED`,
      })
      if (!lock.rows?.length) {
        await payload.db.commitTransaction?.(transactionID)
        continue
      }

      const { docs: characters } = await payload.find({
        collection: 'characters',
        where: { workspace: { equals: workspace.id } },
        depth: 0,
        pagination: false,
        overrideAccess: true,
        req,
      })
      for (const character of characters as any[]) {
        const { docs: ships } = await payload.find({
          collection: 'ships',
          where: { proprietaire: { equals: character.id } },
          depth: 0,
          pagination: false,
          overrideAccess: true,
          req,
        })
        for (const ship of ships as any[]) {
          await payload.delete({ collection: 'ships', id: ship.id, overrideAccess: true, req })
          deletedShips++
        }
        await payload.delete({ collection: 'characters', id: character.id, overrideAccess: true, req })
        deletedCharacters++
      }
      await payload.delete({ collection: 'character-workspaces', id: workspace.id, overrideAccess: true, req })
      deletedWorkspaces++
      await payload.db.commitTransaction?.(transactionID)
    } catch (error) {
      await payload.db.rollbackTransaction?.(transactionID).catch(() => undefined)
      throw error
    }
  }

  return { examined: docs.length, deletedWorkspaces, deletedCharacters, deletedShips }
}
