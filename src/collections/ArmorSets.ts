import type { CollectionConfig } from 'payload'
import type { User } from '@/payload-types'

export const ArmorSets: CollectionConfig = {
  slug: 'armor-sets',
  labels: { singular: 'Set d\'armure', plural: 'Sets d\'armure' },
  admin: {
    useAsTitle: 'nom',
    group: 'Équipement',
  },
  access: {
    read: ({ req }) => !!req.user,
    create: ({ req }) => (req.user as User | null)?.role === 'admin',
    update: ({ req }) => (req.user as User | null)?.role === 'admin',
    delete: ({ req }) => (req.user as User | null)?.role === 'admin',
  },
  fields: [
    {
      name: 'rang',
      type: 'number',
      required: true,
      unique: true,
      min: 1,
      max: 10,
      label: 'Rang',
      validate: (value: unknown) =>
        (typeof value === 'number' && Number.isInteger(value)) || 'Le rang doit être un entier entre 1 et 10.',
      admin: {
        description: 'Rang unique de ce set, utilisé comme récompense de promotion (1 à 10).',
      },
    },
    {
      name: 'nom',
      type: 'text',
      required: true,
      label: 'Nom du Set',
    },
    {
      name: 'bonus',
      type: 'textarea',
      label: 'Bonus de Set',
      required: true,
      admin: {
        description: 'Bonus appliqué lorsque le set est complet.',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Image',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'pieces',
      type: 'join',
      collection: 'armors',
      on: 'set',
      label: 'Pièces d\'armure',
      admin: {
        description: 'Liste des pièces d\'armure appartenant à ce set.',
      },
    },
  ],
}
