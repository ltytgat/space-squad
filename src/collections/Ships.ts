import type { CollectionConfig } from 'payload'
import type { User } from '@/payload-types'

export const Ships: CollectionConfig = {
  slug: 'ships',
  labels: { singular: 'Vaisseau', plural: 'Vaisseaux' },
  admin: {
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'classe', 'modele'],
    group: 'Jeu de Rôle',
  },
  access: {
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
      label: 'Nom du vaisseau',
    },
    {
      name: 'classe',
      type: 'select',
      label: 'Classe',
      options: [
        { label: 'Alpha', value: 'alpha' },
        { label: 'Beta', value: 'beta' },
        { label: 'Gamma', value: 'gamma' },
        { label: 'Delta', value: 'delta' },
      ],
    },
    {
      name: 'modele',
      type: 'text',
      label: 'Modèle',
    },
  ],
}
