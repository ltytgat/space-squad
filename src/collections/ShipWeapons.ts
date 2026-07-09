import type { CollectionConfig } from 'payload'
import type { User } from '@/payload-types'

export const ShipWeapons: CollectionConfig = {
  slug: 'ship-weapons',
  labels: { singular: 'Arme de vaisseau', plural: 'Armes de vaisseau' },
  admin: {
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'taille', 'type', 'modele', 'degats', 'prix'],
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
          name: 'taille',
          type: 'select',
          required: true,
          label: 'Taille',
          options: [
            { label: 'Taille 1 (Alpha)', value: '1' },
            { label: 'Taille 2 (Beta)', value: '2' },
            { label: 'Taille 3 (Gamma)', value: '3' },
            { label: 'Taille 4 (Delta)', value: '4' },
          ],
          admin: { width: '30%' },
        },
        {
          name: 'modele',
          type: 'select',
          required: true,
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
          admin: { width: '30%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'type',
          type: 'select',
          required: true,
          label: 'Type',
          options: [
            { label: 'Thermique', value: 'thermique' },
            { label: 'Cinétique', value: 'cinetique' },
            { label: 'Explosif', value: 'explosif' },
            { label: 'Blindage', value: 'blindage' },
          ],
          admin: { width: '25%' },
        },
        {
          name: 'categorie',
          type: 'select',
          label: 'Catégorie',
          options: [
            { label: 'Cartouche (laser)', value: 'cartouche' },
            { label: 'Cinétique (balles)', value: 'cinetique' },
            { label: 'Lance-missile', value: 'lance-missile' },
            { label: 'Mine', value: 'mine' },
            { label: 'Bouclier de joute', value: 'bouclier-joute' },
          ],
          admin: { width: '25%' },
        },
        {
          name: 'degats',
          type: 'text',
          label: 'Dégâts',
          admin: {
            width: '25%',
            placeholder: 'ex: 2D12+3',
          },
        },
        {
          name: 'moyenne',
          type: 'number',
          label: 'Moyenne',
          admin: { width: '25%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'chauffe',
          type: 'number',
          label: 'Chauffe (MJ)',
          admin: {
            width: '25%',
            condition: (data) => data.type === 'thermique',
          },
        },
        {
          name: 'ballesParSalve',
          type: 'number',
          label: 'Balles/salve',
          admin: {
            width: '25%',
            condition: (data) => data.type === 'cinetique',
          },
        },
        {
          name: 'chargeur',
          type: 'number',
          label: 'Chargeur',
          admin: {
            width: '25%',
            condition: (data) => data.type === 'cinetique',
          },
        },
        {
          name: 'distance',
          type: 'text',
          label: 'Distance / Champ d\'action',
          admin: {
            width: '25%',
            condition: (data) => ['explosif'].includes(data.type),
          },
        },
        {
          name: 'cooldown',
          type: 'number',
          label: 'Cooldown (tours)',
          admin: {
            width: '25%',
            condition: (data) => ['explosif'].includes(data.type),
          },
        },
        {
          name: 'bonusBlindage',
          type: 'number',
          label: 'Bonus de blindage en joute',
          admin: {
            width: '25%',
            condition: (data) => data.type === 'blindage',
          },
        },
      ],
    },
    {
      name: 'pointsEmport',
      type: 'number',
      label: "Points d'emport utilisés",
      defaultValue: 1,
      admin: {
        description: "Nombre de points d'emport consommés (ex: x2 pour lance-missiles).",
      },
    },
    {
      name: 'prix',
      type: 'text',
      label: 'Prix',
      admin: {
        description: 'Prix de l\'arme (ex: 100 k, 1 M).',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description / Notes',
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
