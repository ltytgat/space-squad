import type { CollectionConfig } from 'payload'
import type { User } from '@/payload-types'

export const Ships: CollectionConfig = {
  slug: 'ships',
  labels: { singular: 'Vaisseau', plural: 'Vaisseaux' },
  admin: {
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'modele', 'proprietaire'],
    group: 'Jeu de Rôle',
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
          label: 'Nom (immatriculation)',
          admin: { width: '50%' },
        },
        {
          name: 'modele',
          type: 'relationship',
          relationTo: 'ship-models',
          required: true,
          label: 'Modèle',
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'proprietaire',
      type: 'relationship',
      relationTo: 'characters',
      label: 'Propriétaire (acheteur)',
      admin: {
        position: 'sidebar',
        description: 'Le personnage qui a acheté ce vaisseau.',
      },
    },

    // ── État actuel ───────────────────────────────────
    {
      type: 'collapsible',
      label: 'État actuel',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'blindageActuel',
              type: 'number',
              label: 'Blindage actuel',
              admin: { width: '25%' },
            },
            {
              name: 'bouclierActuel',
              type: 'number',
              label: 'Bouclier actuel',
              admin: { width: '25%' },
            },
            {
              name: 'esquiveActuelle',
              type: 'number',
              label: 'Esquive actuelle',
              admin: { width: '25%' },
            },
            {
              name: 'consommationActuelle',
              type: 'number',
              label: 'Consommation totale (GW)',
              admin: { width: '25%' },
            },
          ],
        },
      ],
    },

    // ── Équipage ──────────────────────────────────────
    {
      type: 'collapsible',
      label: 'Équipage',
      fields: [
        {
          name: 'pilote',
          type: 'relationship',
          relationTo: 'characters',
          label: 'Pilote',
        },
        {
          name: 'copilote',
          type: 'relationship',
          relationTo: 'characters',
          label: 'Copilote',
        },
        {
          name: 'canonniers',
          type: 'array',
          label: 'Canonniers (tourelles)',
          admin: {
            description: 'Un canonnier par tourelle disponible.',
          },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'personnage',
                  type: 'relationship',
                  relationTo: 'characters',
                  label: 'Canonnier',
                  admin: { width: '50%' },
                },
                {
                  name: 'tourelle',
                  type: 'number',
                  label: 'Tourelle n°',
                  admin: { width: '50%' },
                },
              ],
            },
          ],
        },
      ],
    },

    // ── Modules de base ──────────────────────────────
    {
      type: 'collapsible',
      label: 'Modules de base',
      fields: [
        {
          name: 'moduleGenerateur',
          type: 'relationship',
          relationTo: 'ship-modules',
          label: 'Générateur',
          filterOptions: {
            famille: { equals: 'generateur' },
          },
        },
        {
          name: 'modulePropulseurs',
          type: 'relationship',
          relationTo: 'ship-modules',
          label: 'Propulseurs',
          filterOptions: {
            famille: { in: ['propulseurs', 'propulseurs-stardash'] },
          },
        },
        {
          name: 'moduleSurvie',
          type: 'relationship',
          relationTo: 'ship-modules',
          label: 'Système de survie',
          filterOptions: {
            famille: { equals: 'survie' },
          },
        },
        {
          name: 'moduleBoucliers',
          type: 'relationship',
          relationTo: 'ship-modules',
          label: 'Boucliers',
          filterOptions: {
            famille: { equals: 'boucliers' },
          },
        },
      ],
    },

    // ── Modules supplémentaires ──────────────────────
    {
      type: 'collapsible',
      label: 'Modules supplémentaires',
      fields: [
        {
          name: 'modulesSupplementaires',
          type: 'relationship',
          relationTo: 'ship-modules',
          hasMany: true,
          label: 'Modules installés',
          filterOptions: {
            typeModule: { equals: 'supplementaire' },
          },
          admin: {
            description: "Modules supplémentaires installés (limité par le nombre d'emplacements du modèle).",
          },
        },
      ],
    },

    // ── Armement ─────────────────────────────────────
    {
      type: 'collapsible',
      label: 'Armement',
      fields: [
        {
          name: 'armesPilote',
          type: 'relationship',
          relationTo: 'ship-weapons',
          hasMany: true,
          label: 'Armes du pilote',
          admin: {
            description: "Armes montées sur les points d'emport du pilote.",
          },
        },
        {
          name: 'armesTourelles',
          type: 'array',
          label: 'Armes des tourelles',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'tourelle',
                  type: 'number',
                  label: 'Tourelle n°',
                  admin: { width: '30%' },
                },
                {
                  name: 'armes',
                  type: 'relationship',
                  relationTo: 'ship-weapons',
                  hasMany: true,
                  label: 'Armes',
                  admin: { width: '70%' },
                },
              ],
            },
          ],
        },
      ],
    },

    // ── Consommables ─────────────────────────────────
    {
      type: 'collapsible',
      label: 'Consommables',
      fields: [
        {
          name: 'consommablesVaisseau',
          type: 'array',
          label: 'Consommables embarqués',
          admin: {
            description: "Limité par le nombre d'emplacements consommables du modèle.",
          },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'consommable',
                  type: 'relationship',
                  relationTo: 'ship-consumables',
                  label: 'Consommable',
                  required: true,
                  admin: { width: '70%' },
                },
                {
                  name: 'quantite',
                  type: 'number',
                  label: 'Quantité',
                  required: true,
                  defaultValue: 1,
                  min: 1,
                  admin: { width: '30%' },
                },
              ],
            },
          ],
        },
      ],
    },

    // ── Notes ─────────────────────────────────────────
    {
      name: 'notes',
      type: 'textarea',
      label: 'Notes',
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
