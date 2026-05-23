import type { CollectionConfig } from 'payload'
import type { User } from '@/payload-types'

export const Groups: CollectionConfig = {
  slug: 'groups',
  labels: { singular: 'Groupe', plural: 'Groupes' },
  admin: {
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'createdAt'],
    group: 'Jeu de Rôle',
  },
  access: {
    // Tout utilisateur connecté peut lire les groupes (pour voir son escouade)
    read: ({ req }) => !!req.user,
    create: ({ req }) => (req.user as User | null)?.role === 'admin',
    update: ({ req }) => (req.user as User | null)?.role === 'admin',
    delete: ({ req }) => (req.user as User | null)?.role === 'admin',
  },
  fields: [
    {
      name: 'nom',
      type: 'text',
      required: true,
      label: 'Nom du groupe',
    },
  ],
}
