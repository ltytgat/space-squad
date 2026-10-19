import type { CollectionConfig } from 'payload'
import type { User } from '@/payload-types'

export const VehicleSaleModels: CollectionConfig = {
  slug: 'vehicle-sale-models',
  labels: { singular: 'Modèle de vente de véhicule', plural: 'Modèles de vente de véhicules' },
  admin: {
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'variante', 'places', 'blindageMax', 'prix'],
    group: 'Véhicules',
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
          unique: true,
          label: 'Nom du modèle',
          admin: { width: '50%' },
        },
        {
          name: 'variante',
          type: 'relationship',
          relationTo: 'vehicle-variants',
          required: true,
          label: 'Type de véhicule',
          admin: { width: '50%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'places',
          type: 'number',
          required: true,
          min: 0,
          label: 'Nombre de places',
          admin: { width: '25%' },
        },
        {
          name: 'emportsArmesPersonnages',
          type: 'number',
          required: true,
          min: 0,
          label: "Emports d'armes de personnages",
          admin: { width: '25%' },
        },
        {
          name: 'blindageMax',
          type: 'number',
          required: true,
          min: 0,
          label: 'Blindage maximal',
          admin: { width: '25%' },
        },
        {
          name: 'bouclierMax',
          type: 'number',
          required: true,
          min: 0,
          label: 'Bouclier maximal',
          admin: { width: '25%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'rechargeBouclier',
          type: 'number',
          required: true,
          min: 0,
          label: 'Recharge du bouclier',
          admin: { width: '25%' },
        },
        {
          name: 'mouvement',
          type: 'number',
          required: true,
          min: 0,
          label: 'Mouvement',
          admin: { width: '25%' },
        },
        {
          name: 'prix',
          type: 'number',
          required: true,
          min: 0,
          label: 'Prix (konis)',
          admin: { width: '25%' },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Options',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'toutTerrain',
              type: 'checkbox',
              label: 'Tout-terrain',
              defaultValue: false,
              admin: { width: '33%' },
            },
            {
              name: 'supportArme',
              type: 'checkbox',
              label: "Support d'arme",
              defaultValue: false,
              admin: {
                width: '67%',
                description: 'Réduit de moitié les malus de tir pour un pilote non conducteur.',
              },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'turboBonus',
              type: 'number',
              min: 0,
              label: 'Bonus Turbo (+X)',
              admin: { width: '33%' },
            },
            {
              name: 'tourelleClasseMax',
              type: 'select',
              label: 'Tourelle : classe maximale de vaisseau',
              options: [
                { label: 'Alpha', value: 'alpha' },
                { label: 'Beta', value: 'beta' },
                { label: 'Gamma', value: 'gamma' },
              ],
              admin: { width: '34%' },
            },
            {
              name: 'remorqueIndicePoids',
              type: 'number',
              min: 0,
              label: 'Indice de poids de remorque',
              admin: {
                width: '33%',
                description: 'Valeur numérique reliée à la table de règles.',
              },
            },
          ],
        },
      ],
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
