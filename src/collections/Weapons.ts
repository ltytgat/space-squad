import type { CollectionConfig } from 'payload'
import type { User } from '@/payload-types'

export const Weapons: CollectionConfig = {
  slug: 'weapons',
  labels: { singular: 'Arme', plural: 'Armes' },
  admin: {
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'valeurDegats', 'tailleChargeur', 'poids'],
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
      name: 'nom',
      type: 'text',
      required: true,
      label: 'Nom',
    },
    {
      name: 'poids',
      type: 'number',
      label: 'Poids',
      admin: { description: "Poids de l'arme (en kg)" },
    },
    {
      name: 'tailleChargeur',
      type: 'number',
      label: 'Taille du chargeur',
    },
    {
      name: 'valeurDegats',
      type: 'number',
      label: 'Valeur de dégâts',
    },
    {
      name: 'projectilesParTir',
      type: 'number',
      label: 'Projectiles par tir',
    },
    {
      name: 'valeurRechargement',
      type: 'number',
      label: 'Valeur de rechargement',
    },
    {
      name: 'mods',
      type: 'textarea',
      label: 'Emplacement de mods',
      admin: { description: 'Modification(s) installée(s) sur cette arme.' },
    },
  ],
}
