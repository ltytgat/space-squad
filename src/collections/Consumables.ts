import type { CollectionConfig } from 'payload'
import type { User } from '@/payload-types'

export const Consumables: CollectionConfig = {
  slug: 'consumables',
  labels: { singular: 'Consommable', plural: 'Consommables' },
  admin: {
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'categorie', 'prix'],
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
      type: 'row',
      fields: [
        {
          name: 'nom',
          type: 'text',
          required: true,
          label: 'Nom',
          admin: { width: '50%' },
        },
        {
          name: 'categorie',
          type: 'select',
          label: 'Catégorie',
          required: true,
          options: [
            { label: 'Soins', value: 'soins' },
            { label: 'Munitions', value: 'munitions' },
            { label: 'Grenades', value: 'grenades' },
            { label: 'Tactique', value: 'tactique' },
            { label: 'Outils', value: 'outils' },
          ],
          admin: { width: '50%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'effet',
          type: 'textarea',
          label: 'Effet',
          admin: {
            width: '50%',
            description: 'Texte libre décrivant l\'effet du consommable.',
          },
        },
        {
          name: 'epreuve',
          type: 'text',
          label: 'Épreuve',
          admin: {
            width: '25%',
            description: 'Texte libre décrivant l\'épreuve éventuelle.',
          },
        },
        {
          name: 'prix',
          type: 'number',
          label: 'Prix',
          admin: { width: '25%' },
        },
      ],
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
