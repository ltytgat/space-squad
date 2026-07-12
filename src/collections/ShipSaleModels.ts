import type { CollectionConfig } from 'payload'
import type { User } from '@/payload-types'

/**
 * Modèles de vente de vaisseaux.
 * Lie un châssis (ShipModels) à son équipement initial complet :
 * générateur, propulseur, bouclier, système de survie, armes par point d'emport,
 * et éventuellement des modules supplémentaires pré-installés.
 * Forme un vaisseau opérationnel prêt à la vente.
 */
export const ShipSaleModels: CollectionConfig = {
  slug: 'ship-sale-models',
  labels: { singular: 'Modèle de vente', plural: 'Modèles de vente' },
  admin: {
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'chassis', 'prix'],
    group: 'Vaisseaux',
  },
  access: {
    read: ({ req }) => !!req.user,
    create: ({ req }) => (req.user as User | null)?.role === 'admin',
    update: ({ req }) => (req.user as User | null)?.role === 'admin',
    delete: ({ req }) => (req.user as User | null)?.role === 'admin',
  },
  fields: [
    // ── Identité ──────────────────────────────────────
    {
      type: 'row',
      fields: [
        {
          name: 'nom',
          type: 'text',
          required: true,
          label: 'Nom du modèle de vente',
          unique: true,
          admin: { width: '50%' },
        },
        {
          name: 'chassis',
          type: 'relationship',
          relationTo: 'ship-models',
          required: true,
          label: 'Châssis',
          admin: {
            width: '50%',
            description: 'Le châssis de base sur lequel ce modèle est construit.',
          },
        },
      ],
    },
    {
      name: 'prix',
      type: 'text',
      label: 'Prix de vente',
      admin: {
        description: 'Prix du modèle complet (ex: 100 k, 1 M, 1,25 M).',
      },
    },

    // ── Modules de base (obligatoires) ────────────────
    {
      type: 'collapsible',
      label: 'Modules de base',
      admin: {
        description: 'Composants de base inclus dans le modèle de vente.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'generateur',
              type: 'relationship',
              relationTo: 'ship-modules',
              required: true,
              label: 'Générateur',
              admin: { width: '50%' },
              filterOptions: {
                famille: { equals: 'generateur' },
              },
            },
            {
              name: 'propulseurs',
              type: 'relationship',
              relationTo: 'ship-modules',
              required: true,
              label: 'Propulseurs',
              admin: { width: '50%' },
              filterOptions: {
                famille: { equals: 'propulseurs' },
              },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'boucliers',
              type: 'relationship',
              relationTo: 'ship-modules',
              required: true,
              label: 'Boucliers',
              admin: { width: '50%' },
              filterOptions: {
                famille: { equals: 'boucliers' },
              },
            },
            {
              name: 'survie',
              type: 'relationship',
              relationTo: 'ship-modules',
              required: true,
              label: 'Système de survie',
              admin: { width: '50%' },
              filterOptions: {
                famille: { equals: 'survie' },
              },
            },
          ],
        },
      ],
    },

    // ── Armement initial ──────────────────────────────
    {
      type: 'collapsible',
      label: 'Armement initial',
      admin: {
        description: 'Armes pré-installées sur le modèle de vente (une par point d\'emport disponible, tourelles comprises).',
      },
      fields: [
        {
          name: 'armes',
          type: 'array',
          label: 'Armes incluses',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'arme',
                  type: 'relationship',
                  relationTo: 'ship-weapons',
                  required: true,
                  label: 'Arme',
                  admin: { width: '50%' },
                },
                {
                  name: 'emplacement',
                  type: 'select',
                  label: 'Emplacement',
                  options: [
                    { label: 'Pilote', value: 'pilote' },
                    { label: 'Tourelle 1', value: 'tourelle-1' },
                    { label: 'Tourelle 2', value: 'tourelle-2' },
                    { label: 'Tourelle 3', value: 'tourelle-3' },
                    { label: 'Tourelle 4', value: 'tourelle-4' },
                  ],
                  admin: { width: '50%' },
                },
              ],
            },
          ],
        },
      ],
    },

    // ── Modules supplémentaires pré-installés ─────────
    {
      type: 'collapsible',
      label: 'Modules supplémentaires pré-installés',
      admin: {
        description: 'Modules optionnels inclus dans le modèle de vente (si le châssis a des emplacements disponibles).',
      },
      fields: [
        {
          name: 'modulesOptionnels',
          type: 'relationship',
          relationTo: 'ship-modules',
          hasMany: true,
          label: 'Modules supplémentaires inclus',
          filterOptions: {
            typeModule: { equals: 'supplementaire' },
          },
        },
      ],
    },

    // ── Description / Notes ───────────────────────────
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
