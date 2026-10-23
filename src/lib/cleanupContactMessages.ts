import { getPayload } from 'payload'
import config from '@/payload.config'
import { envLimit } from '@/lib/envLimit'

const CLEANUP_BATCH_SIZE = 100
const CONTACT_RETENTION_DAYS = envLimit('CONTACT_RETENTION_DAYS', 180)

/** Supprime les messages de contact plus anciens que la durée de rétention. */
export async function cleanupOldContactMessages() {
  const payload = await getPayload({ config: await config })
  const cutoff = new Date(Date.now() - CONTACT_RETENTION_DAYS * 24 * 60 * 60 * 1000)
  const { docs: expired } = await payload.find({
    collection: 'contact-messages',
    where: { createdAt: { less_than: cutoff.toISOString() } },
    depth: 0,
    limit: CLEANUP_BATCH_SIZE,
    sort: 'createdAt',
    select: { createdAt: true },
    overrideAccess: true,
  })
  if (!expired.length) return { deletedContactMessages: 0 }

  const { docs } = await payload.delete({
    collection: 'contact-messages',
    where: { id: { in: expired.map((message) => message.id) } },
    depth: 0,
    overrideAccess: true,
  })
  return { deletedContactMessages: docs.length }
}
