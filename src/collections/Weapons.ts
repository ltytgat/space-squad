import type { CollectionConfig } from 'payload'
import type { User } from '@/payload-types'

export const Weapons: CollectionConfig = {
  slug: 'weapons',
  labels: { singular: 'Arme', plural: 'Armes' },
  admin: {
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'categorie', 'type', 'valeurDegats', 'prix'],
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
          name: 'fabricant',
          type: 'text',
          label: 'Fabricant / Provenance',
          admin: { width: '50%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'categorie',
          type: 'select',
          label: 'Catégorie',
          required: true,
          options: [
            { label: "Fusil d'assaut", value: 'fusil-assaut' },
            { label: 'Shotgun', value: 'shotgun' },
            { label: 'Sniper', value: 'sniper' },
            { label: 'Pistolet', value: 'pistolet' },
            { label: 'Mélée / CàC', value: 'melee' },
            { label: 'Lourde', value: 'lourde' },
          ],
          admin: { width: '50%' },
        },
        {
          name: 'type',
          type: 'select',
          label: 'Type(s)',
          required: true,
          hasMany: true,
          options: [
            { label: 'Thermique', value: 'thermique' },
            { label: 'Cinétique', value: 'cinetique' },
            { label: 'Plasma', value: 'plasma' },
            { label: 'Explosif', value: 'explosif' },
            { label: 'Mélée', value: 'melee' },
          ],
          admin: { width: '50%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'valeurDegats',
          type: 'number',
          label: 'Valeur de dégâts',
          admin: { width: '33%' },
        },
        {
          name: 'poids',
          type: 'number',
          label: 'Poids (kg)',
          admin: { width: '33%' },
        },
        {
          name: 'prix',
          type: 'number',
          label: 'Prix',
          admin: { width: '33%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'portee',
          type: 'number',
          label: 'Portée de tir (m)',
          admin: {
            width: '50%',
            condition: (data) => data.categorie !== 'melee',
          },
        },
        {
          name: 'projectilesParTir',
          type: 'number',
          label: 'Projectiles par tir',
          defaultValue: 1,
          admin: {
            width: '50%',
            condition: (data) => data.categorie !== 'melee',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'tailleChargeur',
          type: 'number',
          label: 'Taille du chargeur',
          admin: {
            width: '33%',
            condition: (data) => data.type?.includes('cinetique'),
          },
        },
        {
          name: 'tempsRechargement',
          type: 'number',
          label: 'Temps de rechargement',
          admin: {
            width: '33%',
            condition: (data) => data.categorie === 'lourde',
          },
        },
        {
          name: 'tempsRefroidissement',
          type: 'number',
          label: 'Temps de refroidissement',
          admin: {
            width: '33%',
            condition: (data) => data.type?.includes('thermique'),
          },
        },
      ],
    },
    {
      name: 'mods',
      type: 'textarea',
      label: 'Emplacement de mods',
      admin: { description: 'Modification(s) installée(s) sur cette arme.' },
    },
  ],
}
