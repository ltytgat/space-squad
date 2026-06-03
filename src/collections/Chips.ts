import type { CollectionConfig } from 'payload'

export const Chips: CollectionConfig = {
  slug: 'chips',
  labels: {
    singular: 'Puce',
    plural: 'Puces',
  },
  admin: {
    useAsTitle: 'nom',
    group: 'Jeu de Rôle',
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
  ],
}
