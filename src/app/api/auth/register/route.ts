import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { meetsPasswordLength, PASSWORD_LENGTH_ERROR } from '@/lib/passwordPolicy'
import { envLimit } from '@/lib/envLimit'
import { normalizeEmail } from '@/lib/emailPolicy'
import {
  createTemporaryCharacterOfferToken,
  findTemporaryCharacterForCurrentWorkspace,
  TEMP_CHARACTER_OFFER_COOKIE,
  temporaryCharacterOfferCookieOptions,
} from '@/lib/temporaryCharacterOffer'

type RegistrationBody = {
  email?: unknown
  password?: unknown
  passwordConfirmation?: unknown
  website?: unknown
}

// Plafonds globaux : suffisants pour un groupe de joueurs, bloquants pour un script.
const REGISTRATION_MAX_USERS = envLimit('REGISTRATION_MAX_USERS', 200)
const REGISTRATION_MAX_PER_HOUR = envLimit('REGISTRATION_MAX_PER_HOUR', 10)
const CREATED_MESSAGE = 'Compte créé.'

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status })
}

export async function POST(request: Request) {
  let parsedBody: unknown
  try {
    parsedBody = await request.json()
  } catch {
    return jsonError('Requête invalide.', 400)
  }
  if (!parsedBody || typeof parsedBody !== 'object' || Array.isArray(parsedBody)) {
    return jsonError('Requête invalide.', 400)
  }
  const body = parsedBody as RegistrationBody

  // Le champ leurre est caché aux humains : on simule un succès sans rien créer.
  if (typeof body.website === 'string' && body.website.length > 0) {
    return NextResponse.json({ message: CREATED_MESSAGE }, { status: 201 })
  }

  const email = normalizeEmail(body.email)
  if (!email) return jsonError('Saisissez une adresse e-mail valide.', 400)
  if (!meetsPasswordLength(body.password)) {
    return jsonError(PASSWORD_LENGTH_ERROR, 400)
  }
  if (body.password !== body.passwordConfirmation) {
    return jsonError('Les mots de passe ne correspondent pas.', 400)
  }

  try {
    const payload = await getPayload({ config: await config })
    const existingUser = await payload.find({
      collection: 'users',
      where: { email: { equals: email } },
      limit: 1,
      overrideAccess: true,
    })
    if (existingUser.docs.length > 0) {
      return jsonError('Un compte existe déjà avec cette adresse e-mail.', 409)
    }

    const { totalDocs: totalUsers } = await payload.count({ collection: 'users', overrideAccess: true })
    if (totalUsers >= REGISTRATION_MAX_USERS) {
      return jsonError('Les inscriptions sont actuellement fermées.', 403)
    }
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { totalDocs: recentUsers } = await payload.count({
      collection: 'users',
      where: { createdAt: { greater_than: oneHourAgo } },
      overrideAccess: true,
    })
    if (recentUsers >= REGISTRATION_MAX_PER_HOUR) {
      return jsonError('Trop d’inscriptions récentes. Réessayez dans une heure.', 429)
    }

    const user = await payload.create({
      collection: 'users',
      data: { email, password: body.password, role: 'player', isMJ: false },
      overrideAccess: true,
    })

    let temporaryOfferToken: string | null = null
    try {
      const temporary = await findTemporaryCharacterForCurrentWorkspace(payload)
      if (temporary) {
        const { docs: initialCharacters } = await payload.find({
          collection: 'characters',
          where: { user: { equals: user.id } },
          depth: 0,
          limit: 10,
          sort: 'id',
          overrideAccess: true,
        })
        const initialCharacterId = Number(initialCharacters[0]?.id)
        temporaryOfferToken = createTemporaryCharacterOfferToken({
          userId: String(user.id),
          workspaceId: Number(temporary.workspace.id),
          characterId: Number(temporary.character.id),
          initialCharacterId: Number.isSafeInteger(initialCharacterId) && initialCharacterId > 0 ? initialCharacterId : null,
        })
      }
    } catch (error) {
      // Registration still succeeds if temporary-session discovery is unavailable.
      console.error('[Registration] Impossible de vérifier la fiche temporaire', error)
    }

    const response = NextResponse.json({
      message: CREATED_MESSAGE,
      hasTemporaryCharacter: temporaryOfferToken !== null,
    }, { status: 201 })
    if (temporaryOfferToken) {
      response.cookies.set(TEMP_CHARACTER_OFFER_COOKIE, temporaryOfferToken, temporaryCharacterOfferCookieOptions())
    } else {
      response.cookies.delete(TEMP_CHARACTER_OFFER_COOKIE)
    }
    return response
  } catch (error) {
    // A concurrent registration may pass the lookup before the unique index rejects it.
    try {
      const payload = await getPayload({ config: await config })
      const existingUser = await payload.find({
        collection: 'users',
        where: { email: { equals: email } },
        limit: 1,
        overrideAccess: true,
      })
      if (existingUser.docs.length > 0) {
        return jsonError('Un compte existe déjà avec cette adresse e-mail.', 409)
      }
    } catch {
      // Keep internal database details out of the public response.
    }
    console.error('[Registration] Échec de la création du compte', error)
    return jsonError('La création du compte a échoué. Veuillez réessayer.', 500)
  }
}
