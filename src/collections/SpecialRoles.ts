import type { CollectionConfig } from 'payload'
import type { User } from '@/payload-types'

export const SpecialRoles: CollectionConfig = {
  slug: 'special-roles',
  labels: { singular: 'Rôle spécial', plural: 'Rôles spéciaux' },
  admin: {
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'prix'],
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
      label: 'Nom',
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      label: 'Description',
    },
    {
      name: 'prix',
      type: 'number',
      required: true,
      min: 0,
      defaultValue: 0,
      label: 'Prix en Konis',
      admin: { step: 1 },
      validate: (value: unknown) =>
        (typeof value === 'number' && Number.isInteger(value) && value >= 0) ||
        'Le prix doit être un nombre entier positif ou nul.',
    },
  ],
}
