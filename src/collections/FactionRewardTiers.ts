import type { CollectionConfig, Validate } from 'payload'
import type { User } from '@/payload-types'

const rewardTypes = [
  { label: 'Permis d’achat des armes de rang supérieur', value: 'acces-armes-ex' },
  { label: 'Bon de réduction', value: 'bon-reduction' },
] as const

const applications = [
  { label: 'Sol', value: 'sol' },
  { label: 'Espace', value: 'espace' },
  { label: 'Module', value: 'module' },
] as const

const validateDiscountPercentage: Validate<unknown> = (value, { data }) =>
  data?.typeRecompense !== 'bon-reduction' || (typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 100) || 'Indiquez un pourcentage entre 0 et 100.'
const validateFactionCost: Validate<unknown> = (value) =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 || 'Le coût doit être un nombre entier positif ou nul.'
const validateRequiredGrade: Validate<unknown> = (value) =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 1 || 'Le grade requis doit être un ID entier supérieur ou égal à 1.'
const validateUniqueFactions: Validate<unknown> = (value) => {
  if (!Array.isArray(value)) return true
  const factionIds = value.map((entry: any) => String(typeof entry.faction === 'object' ? entry.faction?.id ?? '' : entry.faction ?? ''))
  return new Set(factionIds).size === factionIds.length || 'Une seule ligne par faction est autorisée pour une récompense.'
}
const validateFactionApplication: Validate<unknown> = (value, { data }) =>
  data?.typeRecompense !== 'bon-reduction' || ['sol', 'espace', 'module'].includes(String(value)) || 'Sélectionnez une application pour ce bon.'

export const FactionRewardTiers: CollectionConfig = {
  slug: 'faction-reward-tiers',
  labels: { singular: 'Récompense de faction', plural: 'Récompenses de faction' },
  admin: {
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'typeRecompense', 'gradeRequis', 'coutPointsFaction', 'pourcentageReduction'],
    group: 'Jeu de Rôle',
    description: 'Un document par récompense. Plusieurs récompenses peuvent partager le même grade requis.',
  },
  access: {
    read: () => true,
    create: ({ req }) => (req.user as User | null)?.role === 'admin',
    update: ({ req }) => (req.user as User | null)?.role === 'admin',
    delete: ({ req }) => (req.user as User | null)?.role === 'admin',
  },
  fields: [
    { name: 'nom', type: 'text', required: true, label: 'Nom' },
    {
      name: 'typeRecompense',
      type: 'select',
      required: true,
      defaultValue: 'bon-reduction',
      label: 'Type de récompense',
      options: [...rewardTypes],
    },
    {
      name: 'pourcentageReduction',
      type: 'number',
      label: 'Valeur de la réduction (%)',
      min: 0.01,
      max: 100,
      validate: validateDiscountPercentage,
      admin: { condition: (data) => data?.typeRecompense === 'bon-reduction' },
    },
    {
      name: 'coutPointsFaction',
      type: 'number',
      required: true,
      label: 'Coût en points de faction',
      min: 0,
      defaultValue: 0,
      validate: validateFactionCost,
    },
    {
      name: 'gradeRequis',
      type: 'number',
      required: true,
      label: 'Grade requis (ID du grade)',
      min: 1,
      validate: validateRequiredGrade,
    },
    {
      name: 'factions',
      type: 'array',
      required: true,
      label: 'Description et application par faction',
      admin: { description: 'Ajoutez une seule ligne par faction avec son texte et, pour un bon, son application.' },
      minRows: 1,
      validate: validateUniqueFactions,
      fields: [
        { name: 'faction', type: 'relationship', relationTo: 'factions', required: true, label: 'Faction' },
        { name: 'description', type: 'textarea', required: true, label: 'Description pour cette faction' },
        {
          name: 'application',
          type: 'select',
          label: 'Application du bon',
          options: [...applications],
          validate: validateFactionApplication,
          admin: { condition: (data) => data?.typeRecompense === 'bon-reduction' },
        },
      ],
    },
  ],
}
