import type { CollectionConfig } from 'payload'
import type { User } from '@/payload-types'

/**
 * Catalogue des modèles de vaisseaux.
 * Chaque modèle a des propriétés fixes (non modifiables par les joueurs).
 * Taille 1 = Alpha, Taille 2 = Beta, Taille 3 = Gamma, Taille 4 = Delta
 */
export const ShipModels: CollectionConfig = {
  slug: 'ship-models',
  labels: { singular: 'Modèle de vaisseau', plural: 'Modèles de vaisseaux' },
  admin: {
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'classe', 'categorie', 'tourelles', 'blindage', 'prix'],
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
          label: 'Nom du modèle',
          unique: true,
          admin: { width: '34%' },
        },
        {
          name: 'classe',
          type: 'select',
          required: true,
          label: 'Classe (taille)',
          options: [
            { label: 'Alpha (Taille 1)', value: 'alpha' },
            { label: 'Beta (Taille 2)', value: 'beta' },
            { label: 'Gamma (Taille 3)', value: 'gamma' },
            { label: 'Delta (Taille 4)', value: 'delta' },
          ],
          admin: { width: '33%' },
        },
        {
          name: 'categorie',
          type: 'select',
          required: true,
          label: 'Catégorie',
          options: [
            { label: 'Polyvalent', value: 'polyvalent' },
            { label: 'Combat', value: 'combat' },
            { label: 'Exploration', value: 'exploration' },
            { label: 'Transport', value: 'transport' },
          ],
          admin: { width: '33%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'tourelles',
          type: 'number',
          required: true,
          label: 'Nombre de tourelles (canonniers)',
          defaultValue: 0,
          min: 0,
          admin: { width: '33%' },
        },
        {
          name: 'pointsEmportPilote',
          type: 'number',
          required: true,
          label: "Points d'emport (pilote)",
          defaultValue: 2,
          min: 0,
          admin: {
            width: '33%',
            description: "Nombre d'armes équipables par le pilote.",
          },
        },
        {
          name: 'pointsEmportTourelles',
          type: 'text',
          label: "Points d'emport (tourelles)",
          admin: {
            width: '34%',
            description: "Nombre d'armes par tourelle, séparés par des +. Ex: 1+2 pour 2 tourelles.",
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'blindage',
          type: 'number',
          required: true,
          label: 'Blindage',
          defaultValue: 25,
          min: 0,
          admin: { width: '25%' },
        },
        {
          name: 'generateur',
          type: 'text',
          label: 'Générateur',
          admin: {
            width: '25%',
            description: 'Puissance du générateur de base (ex: 6 GW).',
          },
        },
        {
          name: 'modulesSupplementaires',
          type: 'text',
          label: 'Modules supplémentaires',
          admin: {
            width: '25%',
            description: "Emplacements de modules. Format: base+tourelle(s). Ex: 1+1 = 1 base + 1 tourelle.",
          },
        },
        {
          name: 'consommables',
          type: 'number',
          required: true,
          label: 'Emplacements consommables',
          defaultValue: 1,
          min: 0,
          admin: { width: '25%' },
        },
      ],
    },
    {
      name: 'prix',
      type: 'text',
      label: 'Prix',
      admin: {
        description: 'Prix du vaisseau (ex: 100 k, 1 M, 1,25 M).',
      },
    },
    {
      name: 'esquiveBase',
      type: 'number',
      label: 'Esquive de base',
      admin: {
        description: 'Esquive de base selon la taille : Alpha=15, Beta=12, Gamma=9, Delta=6.',
      },
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
