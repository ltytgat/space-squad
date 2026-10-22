import type { CollectionConfig } from 'payload'
import type { User } from '@/payload-types'

export const Chips: CollectionConfig = {
  slug: 'chips',
  labels: {
    singular: 'Puce',
    plural: 'Puces',
  },
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
      label: 'Nom',
    },
    {
      name: 'categorie',
      type: 'select',
      required: true,
      label: 'Catégorie',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Passive', value: 'passive' },
      ],
    },
    {
      name: 'effet',
      type: 'textarea',
      required: true,
      label: 'Effet',
    },
    {
      name: 'restriction',
      type: 'text',
      label: 'Restriction',
    },
    {
      name: 'cooldown',
      type: 'number',
      label: 'Cooldown (tours)',
      admin: {
        condition: (data) => data?.categorie === 'active',
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
  ],
}
