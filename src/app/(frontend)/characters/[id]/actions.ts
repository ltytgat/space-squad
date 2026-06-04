'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { headers as getHeaders } from 'next/headers.js'
import { revalidatePath } from 'next/cache'

export async function updateMalus(characterId: number, field: string, value: number) {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })

  if (!user || (user as any).role !== 'admin') {
    throw new Error('Non autorisé')
  }

  await payload.update({
    collection: 'characters',
    id: characterId,
    data: {
      [field]: value,
    },
    user,
    overrideAccess: false,
  })

  revalidatePath(`/characters/${characterId}`)
}
