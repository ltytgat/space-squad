import type { CollectionConfig } from 'payload'
import type { User } from '@/payload-types'

export const ShipConsumables: CollectionConfig = {
  slug: 'ship-consumables',
  labels: { singular: 'Consommable de vaisseau', plural: 'Consommables de vaisseau' },
  admin: {
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'categorie', 'taille', 'prix'],
    group: 'Vaisseaux',
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
          admin: { width: '40%' },
        },
        {
          name: 'categorie',
          type: 'select',
          label: 'Catégorie',
          options: [
            { label: 'Munitions (cinétique)', value: 'munitions' },
            { label: 'Cartouches (thermique)', value: 'cartouches' },
            { label: 'Roquettes', value: 'roquettes' },
            { label: 'Mines', value: 'mines' },
            { label: 'Réparation', value: 'reparation' },
            { label: 'Énergie', value: 'energie' },
            { label: 'Autre', value: 'autre' },
          ],
          admin: { width: '30%' },
        },
        {
          name: 'taille',
          type: 'select',
          label: 'Taille compatible',
          options: [
            { label: 'Toutes', value: 'toutes' },
            { label: 'Taille 1 (Alpha)', value: '1' },
            { label: 'Taille 2 (Beta)', value: '2' },
            { label: 'Taille 3 (Gamma)', value: '3' },
            { label: 'Taille 4 (Delta)', value: '4' },
          ],
          admin: { width: '30%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'modele',
          type: 'select',
          label: 'Modèle (tier)',
          options: [
            { label: 'G', value: 'G' },
            { label: 'F', value: 'F' },
            { label: 'E', value: 'E' },
            { label: 'D', value: 'D' },
            { label: 'C', value: 'C' },
            { label: 'B', value: 'B' },
            { label: 'A', value: 'A' },
            { label: 'S', value: 'S' },
          ],
          admin: { width: '25%' },
        },
        {
          name: 'calibre',
          type: 'text',
          label: 'Calibre',
          admin: {
            width: '25%',
            description: 'Calibre ou capacité (ex: 1200 MJ, 50mm).',
          },
        },
        {
          name: 'bonus',
          type: 'text',
          label: 'Bonus',
          admin: {
            width: '25%',
            description: 'Bonus apporté (ex: Dgts+4, Tir +2, Refroidissement).',
          },
        },
        {
          name: 'prix',
          type: 'text',
          label: 'Prix',
          admin: { width: '25%' },
        },
      ],
    },
    {
      name: 'effet',
      type: 'textarea',
      label: 'Effet / Description',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Image',
      admin: { position: 'sidebar' },
    },
  ],
}
