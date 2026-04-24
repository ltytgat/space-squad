import type { CollectionConfig } from 'payload'
import type { User } from '@/payload-types'

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
    delete: ({ req }) => (req.user as User | null)?.role === 'admin',
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
