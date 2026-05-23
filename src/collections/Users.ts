import type { CollectionAfterOperationHook, CollectionConfig } from 'payload'
import type { User } from '@/payload-types'

// Crée automatiquement une fiche personnage vierge pour chaque nouvel utilisateur
const afterCreateUser: CollectionAfterOperationHook = async ({ operation, result, req }) => {
  if (operation === 'create') {
    try {
      await req.payload.create({
        collection: 'characters',
        data: { user: result.id },
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
  auth: true,
  access: {
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
