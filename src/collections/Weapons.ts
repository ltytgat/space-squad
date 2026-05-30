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
          name: 'porteeFixe',
          type: 'number',
          label: 'Portée (m)',
          admin: {
            width: '33%',
            condition: (data) => ['melee', 'lourde'].includes(data.categorie),
            description: "Pour la mélée, correspond à la taille de la lame. Pour les armes lourdes, il s'agit de la portée maximale fixe.",
          },
        },
        {
          name: 'projectilesParTir',
          type: 'number',
          label: 'Projectiles par tir',
          defaultValue: 1,
          admin: {
            width: '33%',
            condition: (data) =>
              data.categorie !== 'melee' && !data.type?.includes('thermique'),
          },
        },
        {
          name: 'valeurChauffe',
          type: 'number',
          label: 'Valeur de chauffe (%)',
          admin: {
            width: '33%',
            condition: (data) => data.type?.includes('thermique'),
          },
        },
      ],
    },
    {
      name: 'intervallesPortee',
      type: 'array',
      label: 'Intervalles de Portée',
      labels: {
        singular: 'Intervalle',
        plural: 'Intervalles',
      },
      minRows: 3,
      maxRows: 5,
      admin: {
        condition: (data) =>
          !['melee', 'lourde'].includes(data.categorie) && !!data.categorie,
        description:
          "Pour les snipers: 5 intervalles. Pour les autres: 3 intervalles. Le dernier intervalle est considéré comme la portée maximale avec malus cumulatif.",
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'distanceMax',
              type: 'number',
              label: 'Distance Max (m)',
              required: true,
              admin: { width: '50%' },
            },
            {
              name: 'modificateur',
              type: 'number',
              label: 'Modificateur Précision',
              required: true,
              admin: { width: '50%' },
            },
          ],
        },
      ],
    },
    {
      type: 'row',
      admin: {
        condition: (data) =>
          !['melee', 'lourde'].includes(data.categorie) && !!data.categorie,
      },
      fields: [
        {
          name: 'trancheMalusLonguePortee',
          type: 'number',
          label: 'Tranche de distance pour malus (m)',
          admin: {
            width: '50%',
            description: 'Distance additionnelle après le dernier intervalle provoquant un malus.',
          },
        },
        {
          name: 'malusParTranche',
          type: 'number',
          label: 'Malus par tranche',
          defaultValue: -1,
          admin: {
            width: '50%',
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
          label: 'Taille du chargeur / conteneur',
          admin: {
            width: '33%',
            condition: (data) =>
              data.type?.some((t: string) => ['cinetique', 'plasma', 'explosif'].includes(t)),
            description: "Pour les armes plasma, correspond à la taille du conteneur.",
          },
        },
        {
          name: 'tempsRechargement',
          type: 'number',
          label: 'Temps de rechargement (tours)',
          admin: {
            width: '33%',
            condition: (data) =>
              data.categorie === 'lourde' || data.type?.includes('explosif'),
          },
        },
        {
          name: 'zoneEffet',
          type: 'text',
          label: "Zone d'effet",
          admin: {
            width: '33%',
            condition: (data) => data.type?.includes('explosif'),
            placeholder: 'ex: 3m de rayon',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'tempsRefroidissement',
          type: 'number',
          label: 'Refroidissement (%)',
          admin: {
            width: '33%',
            condition: (data) => data.type?.includes('thermique'),
            description: 'Pourcentage de refroidissement par unité de temps.',
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
