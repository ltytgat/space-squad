import type { CollectionConfig } from 'payload'
import type { User } from '@/payload-types'

export const Mods: CollectionConfig = {
  slug: 'mods',
  labels: { singular: 'Mod', plural: 'Mods' },
  admin: {
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'categoriePrincipale', 'sousCategorieArme', 'sousCategorieArmure', 'prix'],
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
      type: 'row',
      fields: [
        {
          name: 'categoriePrincipale',
          type: 'select',
          label: 'Type d\'équipement',
          required: true,
          options: [
            { label: 'Armes', value: 'armes' },
            { label: 'Armures', value: 'armures' },
          ],
          admin: { width: '50%' },
        },
        {
          name: 'prix',
          type: 'number',
          label: 'Prix',
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'sousCategorieArme',
      type: 'select',
      label: 'Catégorie d\'arme',
      required: true,
      admin: {
        condition: (data) => data.categoriePrincipale === 'armes',
      },
      options: [
        { label: 'Toutes', value: 'toutes' },
        { label: 'Fusils & Pistolets', value: 'fusils-pistolets' },
        { label: 'Shotgun', value: 'shotgun' },
        { label: 'Snipers', value: 'snipers' },
        { label: 'Mélée / CàC', value: 'melee' },
      ],
    },
    {
      name: 'sousCategorieArmure',
      type: 'select',
      label: 'Catégorie d\'armure',
      required: true,
      admin: {
        condition: (data) => data.categoriePrincipale === 'armures',
      },
      options: [
        { label: 'Toutes', value: 'toutes' },
        { label: 'Tête', value: 'tete' },
        { label: 'Torse', value: 'torse' },
        { label: 'Bras', value: 'bras' },
        { label: 'Jambes', value: 'jambes' },
      ],
    },
    {
      name: 'effet',
      type: 'textarea',
      label: 'Effet',
      required: true,
    },
  ],
}
