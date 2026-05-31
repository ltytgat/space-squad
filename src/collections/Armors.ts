import type { CollectionConfig } from 'payload'
import type { User } from '@/payload-types'

export const Armors: CollectionConfig = {
  slug: 'armors',
  labels: { singular: 'Armure', plural: 'Armures' },
  admin: {
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'categorie', 'valeurArmurePhysique', 'valeurBouclier', 'valeurRupture', 'prix'],
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
          name: 'categorie',
          type: 'select',
          label: 'Catégorie',
          required: true,
          options: [
            { label: 'Tête', value: 'tete' },
            { label: 'Torse', value: 'torse' },
            { label: 'Bras', value: 'bras' },
            { label: 'Jambes', value: 'jambes' },
            { label: 'Back-pack', value: 'backpack' },
          ],
          admin: { width: '50%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'valeurArmurePhysique',
          type: 'number',
          label: "Armure physique",
          admin: { width: '33%' },
        },
        {
          name: 'valeurBouclier',
          type: 'number',
          label: 'Armure cinétique (bouclier)',
          admin: { width: '33%' },
        },
        {
          name: 'valeurRupture',
          type: 'number',
          label: 'Valeur de rupture',
          admin: { width: '33%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'modificateur',
          type: 'text',
          label: 'Modificateur',
          admin: {
            width: '50%',
            description: 'Champ texte pour les modificateurs divers.',
          },
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
      name: 'stockage',
      type: 'number',
      label: 'Valeur de stockage',
      admin: {
        condition: (data) => data.categorie === 'backpack',
        description: 'Capacité de stockage (uniquement pour les back-packs).',
      },
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
      name: 'set',
      type: 'relationship',
      relationTo: 'armor-sets',
      label: 'Set d\'armure',
      admin: {
        position: 'sidebar',
        description: 'Set auquel appartient cette pièce d\'armure.',
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
