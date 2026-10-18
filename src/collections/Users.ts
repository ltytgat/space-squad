import type { CollectionAfterOperationHook, CollectionBeforeOperationHook, CollectionConfig } from 'payload'
import { APIError } from 'payload'
import type { User } from '@/payload-types'
import { sql } from '@payloadcms/db-postgres'
import { createHmac } from 'node:crypto'

const protectPasswordReset: CollectionBeforeOperationHook<'users'> = async ({ args, operation, req }) => {
  if (operation === 'resetPassword') {
    if (typeof args.data.password !== 'string' || args.data.password.length < 12) {
      throw new APIError('Le mot de passe doit comporter au moins 12 caractères.', 400)
    }
    return args
  }
  if (operation !== 'forgotPassword') return args

  const email = typeof args.data.email === 'string' ? args.data.email.trim().toLowerCase() : ''
  const secret = process.env.PAYLOAD_SECRET
  if (!email || !secret) throw new APIError('Impossible de traiter cette demande.', 503)

  // Keep only one active reset link per account. The advisory lock makes the
  // check and Payload's subsequent token write serial across app instances.
  const emailHash = createHmac('sha256', secret).update(`password-reset:${email}`).digest('hex')
  const transactionID = await req.transactionID
  const transactionDb = transactionID === undefined
    ? undefined
    : (req.payload.db as any).sessions?.[transactionID]?.db

  // Fail closed if the adapter cannot provide the transaction needed to enforce
  // the cooldown atomically across concurrent requests and app instances.
  if (!transactionDb) throw new APIError('Impossible de traiter cette demande.', 503)

  await req.payload.db.execute({
    db: transactionDb,
    sql: sql`SELECT pg_advisory_xact_lock(hashtextextended(${emailHash}, 0))`,
  })

  const existingUser = await req.payload.db.findOne({
    collection: 'users',
    req,
    where: { email: { equals: email } },
  }) as User | null
  const resetExpiresAt = existingUser?.resetPasswordExpiration
    ? new Date(existingUser.resetPasswordExpiration).getTime()
    : 0
  if (existingUser?.resetPasswordToken && resetExpiresAt > Date.now()) {
    throw new APIError('Un lien de réinitialisation a déjà été envoyé. Réessayez plus tard.', 429)
  }

  return args
}

// Crée automatiquement une fiche personnage vierge pour chaque nouvel utilisateur
const afterCreateUser: CollectionAfterOperationHook = async ({ operation, result, req }) => {
  if (operation === 'create') {
    const user = result as User
    try {
      await req.payload.create({
        collection: 'characters',
        data: { user: user.id, creationEtape: 'caracteristiques' },
        req,
      })
    } catch (err) {
      console.error('[Users] Échec de la création automatique du personnage :', err)
    }
  }
  return result
}

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'role', 'createdAt'],
    group: 'Administration',
  },
  auth: {
    forgotPassword: {
      expiration: 30 * 60 * 1000,
      generateEmailSubject: () => 'Réinitialisation de votre mot de passe Space Squad',
      generateEmailHTML: (args) => {
        const req = args?.req
        const token = args?.token
        const configuredURL = process.env.NEXT_PUBLIC_SITE_URL
          || process.env.VERCEL_PROJECT_PRODUCTION_URL
          || process.env.VERCEL_URL
          || req?.payload.config.serverURL
        const baseURL = configuredURL
          ? new URL(configuredURL.includes('://') ? configuredURL : `https://${configuredURL}`).origin
          : process.env.NODE_ENV !== 'production' && req?.origin
        if (!baseURL || !token) throw new Error('Configurez NEXT_PUBLIC_SITE_URL pour envoyer les liens de réinitialisation.')

        const resetURL = `${baseURL}/reset-password/${encodeURIComponent(token)}`
        return `<p>Une demande de réinitialisation du mot de passe de votre compte Space Squad a été reçue.</p>
          <p><a href="${resetURL}">Choisir un nouveau mot de passe</a></p>
          <p>Ce lien expire dans 30 minutes. Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail.</p>`
      },
    },
  },
  access: {
    // L'accès au panneau Payload est réservé aux administrateurs.
    admin: ({ req }) => (req.user as User | null)?.role === 'admin',
    // La liste des utilisateurs est réservée aux admins
    read: ({ req }) => (req.user as User | null)?.role === 'admin',
    // Pas d'inscription publique — création par un admin uniquement
    create: ({ req }) => (req.user as User | null)?.role === 'admin',
    // Admins modifient tout ; chaque utilisateur peut modifier son propre profil
    update: ({ req, id }) => {
      const user = req.user as User | null
      if (!user) return false
      if (user.role === 'admin') return true
      return String(user.id) === String(id)
    },
    // Admins suppriment tout ; chaque utilisateur peut supprimer son propre compte
    delete: ({ req, id }) => {
      const user = req.user as User | null
      if (!user) return false
      if (user.role === 'admin') return true
      return String(user.id) === String(id)
    },
  },
  hooks: {
    afterOperation: [afterCreateUser],
    beforeOperation: [protectPasswordReset],
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'player',
      // Disponible sur req.user via le JWT, sans requête BDD supplémentaire
      saveToJWT: true,
      label: 'Rôle',
      options: [
        { label: 'Administrateur', value: 'admin' },
        { label: 'Joueur', value: 'player' },
      ],
      access: {
        // Seuls les admins peuvent modifier le rôle d'un utilisateur
        update: ({ req }) => (req.user as User | null)?.role === 'admin',
      },
      admin: {
        position: 'sidebar',
        description: "Détermine les droits de l'utilisateur dans l'application.",
      },
    },
  ],
}
