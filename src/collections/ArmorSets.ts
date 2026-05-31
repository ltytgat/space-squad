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
