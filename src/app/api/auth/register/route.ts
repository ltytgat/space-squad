import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { meetsPasswordLength, PASSWORD_LENGTH_ERROR } from '@/lib/passwordPolicy'
import { envLimit } from '@/lib/envLimit'

type RegistrationBody = {
  email?: unknown
  password?: unknown
  passwordConfirmation?: unknown
  website?: unknown
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_EMAIL_LENGTH = 254
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

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
    return jsonError('Saisissez une adresse e-mail valide.', 400)
  }
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

    await payload.create({
      collection: 'users',
      data: { email, password: body.password, role: 'player', isMJ: false },
      overrideAccess: true,
    })

    return NextResponse.json({ message: CREATED_MESSAGE }, { status: 201 })
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
