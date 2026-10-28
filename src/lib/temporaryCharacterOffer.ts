import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers.js'
import { getWorkspaceFromCookie } from '@/lib/temporaryCharacterWorkspace'

export const TEMP_CHARACTER_OFFER_COOKIE = 'ss_temporary_character_offer'
const OFFER_TTL_SECONDS = 30 * 60

export type TemporaryCharacterOffer = {
  userId: string
  workspaceId: number
  characterId: number
  initialCharacterId: number | null
  expiresAt: number
}

function offerSecret() {
  const secret = process.env.PAYLOAD_SECRET
  if (!secret) throw new Error('PAYLOAD_SECRET is required to sign a temporary character offer.')
  return secret
}

function sign(encodedPayload: string) {
  return createHmac('sha256', offerSecret()).update(encodedPayload).digest('base64url')
}

export function createTemporaryCharacterOfferToken(input: Omit<TemporaryCharacterOffer, 'expiresAt'>) {
  const payload: TemporaryCharacterOffer = { ...input, expiresAt: Date.now() + OFFER_TTL_SECONDS * 1000 }
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${encodedPayload}.${sign(encodedPayload)}`
}

export function verifyTemporaryCharacterOfferToken(token: string | undefined): TemporaryCharacterOffer | null {
  if (!token || token.length > 2048) return null
  const [encodedPayload, suppliedSignature, extra] = token.split('.')
  if (!encodedPayload || !suppliedSignature || extra) return null

  try {
    const expectedSignature = Buffer.from(sign(encodedPayload), 'base64url')
    const actualSignature = Buffer.from(suppliedSignature, 'base64url')
    if (actualSignature.length !== expectedSignature.length || !timingSafeEqual(actualSignature, expectedSignature)) return null

    const parsed = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as Partial<TemporaryCharacterOffer>
    if (typeof parsed.userId !== 'string' || !parsed.userId) return null
    if (!Number.isSafeInteger(parsed.workspaceId) || Number(parsed.workspaceId) <= 0) return null
    if (!Number.isSafeInteger(parsed.characterId) || Number(parsed.characterId) <= 0) return null
    if (parsed.initialCharacterId !== null && parsed.initialCharacterId !== undefined &&
      (!Number.isSafeInteger(parsed.initialCharacterId) || Number(parsed.initialCharacterId) <= 0)) return null
    if (typeof parsed.expiresAt !== 'number' || parsed.expiresAt <= Date.now()) return null

    return {
      userId: parsed.userId,
      workspaceId: Number(parsed.workspaceId),
      characterId: Number(parsed.characterId),
      initialCharacterId: parsed.initialCharacterId == null ? null : Number(parsed.initialCharacterId),
      expiresAt: parsed.expiresAt,
    }
  } catch {
    return null
  }
}

export function temporaryCharacterOfferCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: OFFER_TTL_SECONDS,
  }
}

export async function findTemporaryCharacterForCurrentWorkspace(payload: any) {
  const workspace = await getWorkspaceFromCookie(payload)
  if (!workspace) return null

  const { docs } = await payload.find({
    collection: 'characters',
    where: { workspace: { equals: workspace.id } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
  const character = docs[0] as any
  if (!character || character.user) return null
  const characterWorkspaceId = typeof character.workspace === 'object' ? character.workspace?.id : character.workspace
  if (String(characterWorkspaceId) !== String(workspace.id)) return null
  return { workspace, character }
}

export async function getTemporaryCharacterOffer(payload: any, userId: string | number) {
  const cookieStore = await cookies()
  const offer = verifyTemporaryCharacterOfferToken(cookieStore.get(TEMP_CHARACTER_OFFER_COOKIE)?.value)
  if (!offer || offer.userId !== String(userId)) return null

  const current = await findTemporaryCharacterForCurrentWorkspace(payload)
  if (!current || String(current.workspace.id) !== String(offer.workspaceId) ||
    String(current.character.id) !== String(offer.characterId)) return null

  return { ...offer, ...current }
}

export function isPristineRegistrationCharacter(character: any, userId: string | number) {
  const ownerId = typeof character?.user === 'object' ? character.user?.id : character?.user
  return String(ownerId) === String(userId)
    && character?.creationEtape === 'caracteristiques'
    && !character?.nom
    && !character?.origine
    && !character?.creationJets
}
