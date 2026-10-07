import type { CollectionConfig } from 'payload'
import type { User } from '@/payload-types'
import { COMPETENCES_BASE } from './Characters'

export const Formations: CollectionConfig = {
  slug: 'formations',
  labels: { singular: 'Formation', plural: 'Formations' },
  admin: {
    useAsTitle: 'competence',
    defaultColumns: ['competence', 'organisationFormation', 'coutKonis', 'coutPointsDeRang', 'coutRenommee'],
    group: 'Jeu de Rôle',
  },
  access: {
    read: ({ req }) => !!req.user,
    create: ({ req }) => (req.user as User | null)?.role === 'admin',
    update: ({ req }) => (req.user as User | null)?.role === 'admin',
    delete: ({ req }) => (req.user as User | null)?.role === 'admin',
  },
  fields: [
    {
      name: 'competence',
      type: 'select',
      required: true,
      label: 'Compétence associée',
      options: COMPETENCES_BASE.map((competence) => ({ label: competence, value: competence })),
    },
    {
      name: 'organisationFormation',
      type: 'relationship',
      relationTo: 'factions',
      required: true,
      label: 'Organisation de Formation',
    },
    {
      name: 'coutKonis',
      type: 'number',
      required: true,
      label: 'Coût en konis',
      defaultValue: 0,
      min: 0,
      admin: { step: 1 },
      validate: (value: unknown) =>
        (typeof value === 'number' && Number.isInteger(value) && value >= 0) ||
        'Le coût en konis doit être un nombre entier positif ou nul.',
    },
    {
      name: 'coutPointsDeRang',
      type: 'number',
      required: true,
      label: 'Coût en points de rang',
      defaultValue: 0,
      min: 0,
    },
    {
      name: 'coutRenommee',
      type: 'number',
      required: true,
      label: 'Coût en renommée',
      defaultValue: 0,
      min: 0,
    },
  ],
}
