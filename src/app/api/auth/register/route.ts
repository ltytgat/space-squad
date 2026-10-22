import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { meetsPasswordLength, MIN_PASSWORD_LENGTH } from '@/lib/passwordPolicy'

type RegistrationBody = {
  email?: unknown
  password?: unknown
  passwordConfirmation?: unknown
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!EMAIL_PATTERN.test(email)) return jsonError('Saisissez une adresse e-mail valide.', 400)
  if (!meetsPasswordLength(body.password)) {
    return jsonError(`Le mot de passe doit comporter au moins ${MIN_PASSWORD_LENGTH} caractères.`, 400)
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

    await payload.create({
      collection: 'users',
      data: { email, password: body.password, role: 'player', isMJ: false },
      overrideAccess: true,
    })

    return NextResponse.json({ message: 'Compte créé.' }, { status: 201 })
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
