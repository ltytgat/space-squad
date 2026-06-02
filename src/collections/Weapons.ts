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
          type: 'text',
          label: 'Valeur de dégâts',
          admin: {
            width: '33%',
            placeholder: 'ex: 3d6, 2d10+5',
            description: 'Format: [nombre de dés]d[taille du dé]',
          },
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
      type: 'row',
      fields: [
        {
          name: 'courtePortee',
          type: 'number',
          label: 'Courte Portée (m)',
          admin: {
            width: '25%',
            condition: (data) =>
              !['melee', 'lourde'].includes(data.categorie) && !!data.categorie,
            description: 'Distance maximale pour le premier palier.',
          },
        },
        {
          name: 'modCourtePortee',
          type: 'number',
          label: 'Mod. Courte Portée',
          admin: {
            width: '25%',
            condition: (data) =>
              !['melee', 'lourde'].includes(data.categorie) && !!data.categorie,
          },
        },
        {
          name: 'moyennePortee',
          type: 'number',
          label: 'Portée Moyenne (m)',
          admin: {
            width: '25%',
            condition: (data) =>
              !['melee', 'lourde', 'sniper'].includes(data.categorie) && !!data.categorie,
            description: 'Distance maximale pour le second palier.',
          },
        },
        {
          name: 'modMoyennePortee',
          type: 'number',
          label: 'Mod. Portée Moyenne',
          admin: {
            width: '25%',
            condition: (data) =>
              !['melee', 'lourde', 'sniper'].includes(data.categorie) && !!data.categorie,
          },
        },
      ],
    },
    {
      name: 'paliersSniper',
      type: 'array',
      label: 'Paliers de Portée Sniper',
      labels: {
        singular: 'Palier',
        plural: 'Paliers',
      },
      minRows: 3,
      maxRows: 3,
      admin: {
        condition: (data) => data.categorie === 'sniper',
        description: 'Définissez les 3 paliers de distance (le 1er étant déjà la courte portée au-dessus).',
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
              label: 'Modificateur',
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
          label: 'Tranche Longue Portée (m)',
          admin: {
            width: '50%',
            description: 'Distance additionnelle après le dernier palier provoquant un malus cumulatif.',
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
      name: 'details',
      type: 'textarea',
      label: 'Détails / Spécificités',
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
    {
      name: 'mods',
      type: 'relationship',
      relationTo: 'mods',
      hasMany: true,
      label: 'Emplacement de mods',
      hidden: true,
      admin: {
        description:
          'ATTENTION : Ce champ est conservé pour la compatibilité mais les mods doivent être gérés au niveau du personnage.',
      },
    },
  ],
}
