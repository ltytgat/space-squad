import type { CollectionConfig } from 'payload'
import type { User } from '@/payload-types'
import { isMJMode } from '@/lib/activeMode'

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
    {
      name: 'creator',
      type: 'relationship',
      relationTo: 'users',
      label: 'MJ créateur',
      admin: { position: 'sidebar' },
    },
    {
      name: 'shopPolicy',
      type: 'json',
      label: 'Règles de boutique par escouade',
      access: {
        read: async ({ req, doc }) => {
          const user = req.user as User | null
          if (user?.role === 'admin') return true
          if (!user || !(await isMJMode(user))) return false
          const creatorId = doc?.creator && typeof doc.creator === 'object' ? doc.creator.id : doc?.creator
          return String(creatorId) === String(user.id)
        },
      },
      admin: { hidden: true },
    },
    {
      name: 'inviteCode',
      type: 'text',
      unique: true,
      label: 'Code d’invitation',
      access: {
        read: async ({ req, doc }) => {
          const user = req.user as User | null
          if (user?.role === 'admin') return true
          if (!user || !(await isMJMode(user))) return false
          const creatorId = doc?.creator && typeof doc.creator === 'object' ? doc.creator.id : doc?.creator
          return String(creatorId) === String(user.id)
        },
        update: ({ req }) => (req.user as User | null)?.role === 'admin',
      },
      admin: { position: 'sidebar' },
    },
  ],
}
