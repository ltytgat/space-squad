import type { CollectionConfig } from 'payload'

export const ShopPolicyPresets: CollectionConfig = {
  slug: 'shop-policy-presets',
  labels: { singular: 'Preset de boutique', plural: 'Presets de boutique' },
  admin: {
    hidden: true,
    group: 'Jeu de Rôle',
    useAsTitle: 'name',
  },
  access: {
    read: () => false,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      label: 'MJ propriétaire',
      admin: { position: 'sidebar' },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Nom',
    },
    {
      name: 'nameKey',
      type: 'text',
      required: true,
      label: 'Clé de nom normalisée',
      admin: { hidden: true },
    },
    {
      name: 'policy',
      type: 'json',
      required: true,
      label: 'Configuration de boutique',
    },
  ],
  indexes: [{ fields: ['owner', 'nameKey'], unique: true }],
  timestamps: true,
}
