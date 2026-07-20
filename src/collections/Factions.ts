import type { CollectionConfig } from 'payload'
import type { User } from '@/payload-types'

export const Factions: CollectionConfig = {
  slug: 'factions',
  labels: { singular: 'Faction', plural: 'Factions' },
  admin: {
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'createdAt'],
    group: 'Jeu de Rôle',
  },
  access: {
    read: () => true,
    create: ({ req }) => (req.user as User | null)?.role === 'admin',
    update: ({ req }) => (req.user as User | null)?.role === 'admin',
    delete: ({ req }) => (req.user as User | null)?.role === 'admin',
  },
  fields: [
    {
      name: 'nom',
      type: 'text',
      required: true,
      label: 'Nom de la faction',
      unique: true,
    },
    {
      name: 'rangs',
      type: 'array',
      label: 'Rangs de la faction',
      fields: [
        {
          name: 'nom',
          type: 'text',
          required: true,
          label: 'Nom du rang',
        },
        {
          name: 'pointsRequis',
          type: 'number',
          required: true,
          label: 'Points requis',
          defaultValue: 0,
        },
      ],
    },
  ],
}
