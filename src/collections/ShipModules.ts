import type { CollectionConfig } from 'payload'
import type { User } from '@/payload-types'

export const ShipModules: CollectionConfig = {
  slug: 'ship-modules',
  labels: { singular: 'Module de vaisseau', plural: 'Modules de vaisseau' },
  admin: {
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'famille', 'taille', 'modele', 'consommation', 'prix'],
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
          name: 'famille',
          type: 'select',
          required: true,
          label: 'Famille',
          options: [
            { label: '── Modules de base ──', value: '_base_header' },
            { label: 'Générateur', value: 'generateur' },
            { label: 'Propulseurs standards', value: 'propulseurs' },
            { label: 'Système de survie', value: 'survie' },
            { label: 'Boucliers', value: 'boucliers' },
            { label: '── Modules supplémentaires ──', value: '_supp_header' },
            { label: 'Blindage', value: 'blindage' },
            { label: 'Réparateur automatique', value: 'reparateur' },
            { label: 'Hangar', value: 'hangar' },
            { label: 'Scanner', value: 'scanner' },
            { label: 'Infirmerie', value: 'infirmerie' },
            { label: "Sas d'abordage", value: 'sas-abordage' },
            { label: 'Ordinateur de tir', value: 'ordinateur-tir' },
            { label: 'Harmonisateur de bouclier', value: 'harmonisateur' },
            { label: "Baie d'amarrage", value: 'baie-amarrage' },
            { label: 'Pilotage assisté', value: 'pilotage-assiste' },
            { label: 'Propulseurs Stardash', value: 'propulseurs-stardash' },
          ],
          admin: { width: '30%' },
        },
        {
          name: 'typeModule',
          type: 'select',
          required: true,
          label: 'Type',
          options: [
            { label: 'Module de base', value: 'base' },
            { label: 'Module supplémentaire', value: 'supplementaire' },
          ],
          admin: { width: '30%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'taille',
          type: 'select',
          required: true,
          label: 'Taille compatible',
          options: [
            { label: 'Taille 1 (Alpha)', value: '1' },
            { label: 'Taille 2 (Beta)', value: '2' },
            { label: 'Taille 3 (Gamma)', value: '3' },
            { label: 'Taille 4 (Delta)', value: '4' },
          ],
          admin: { width: '25%' },
        },
        {
          name: 'modele',
          type: 'select',
          required: true,
          label: 'Modèle (tier)',
          options: [
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
          name: 'consommation',
          type: 'number',
          label: 'Consommation (GW)',
          admin: { width: '25%' },
        },
        {
          name: 'prix',
          type: 'text',
          label: 'Prix',
          admin: { width: '25%' },
        },
      ],
    },

    // ── Propriétés spécifiques par famille ──
    {
      name: 'puissance',
      type: 'text',
      label: 'Puissance',
      admin: {
        condition: (data) => data.famille === 'generateur',
        description: 'Puissance du générateur (ex: 6 GW).',
      },
    },
    {
      name: 'modificateurs',
      type: 'text',
      label: 'Modificateurs',
      admin: {
        description: 'Bonus apportés (ex: Esquive +3, Tir(pilote)+2, Crypto +1, Dash +1).',
      },
    },
    {
      name: 'bouclierMax',
      type: 'number',
      label: 'Boucliers Max',
      admin: {
        condition: (data) => data.famille === 'boucliers',
      },
    },
    {
      name: 'cooldownBouclier',
      type: 'number',
      label: 'Cooldown',
      admin: {
        condition: (data) => ['boucliers', 'reparateur'].includes(data.famille),
        description: 'Nombre de tours avant réactivation.',
      },
    },
    {
      name: 'rechargeBouclier',
      type: 'number',
      label: 'Recharge',
      admin: {
        condition: (data) => ['boucliers', 'harmonisateur'].includes(data.famille),
      },
    },
    {
      name: 'reparations',
      type: 'text',
      label: 'Réparations',
      admin: {
        condition: (data) => data.famille === 'reparateur',
        description: 'Réparations par tour (max). Ex: 3 (12).',
      },
    },
    {
      name: 'malusPoids',
      type: 'number',
      label: 'Malus poids',
      admin: {
        condition: (data) => ['blindage', 'hangar'].includes(data.famille),
      },
    },
    {
      name: 'blindageBonus',
      type: 'number',
      label: 'Blindage bonus',
      admin: {
        condition: (data) => data.famille === 'blindage',
      },
    },
    {
      name: 'capacite',
      type: 'text',
      label: 'Capacité',
      admin: {
        condition: (data) => ['hangar', 'infirmerie', 'sas-abordage'].includes(data.famille),
        description: 'Capacité ou nombre de places.',
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
