import type { CollectionConfig } from 'payload'
import type { User } from '@/payload-types'

/**
 * Journal des récompenses de fin de session appliquées en masse à une escouade
 * ou à une sélection de personnages.
 *
 * — Chaque document représente un batch (application unique et atomique).
 * — `batchId` est unique : garantit l'idempotence (double-clic / rafraîchissement).
 * — Les documents sont immuables (pas d'update/delete depuis l'API) : ils
 *   servent d'audit log et permettront un undo ultérieur.
 */
export const SessionRewards: CollectionConfig = {
  slug: 'session-rewards',
  labels: { singular: 'Récompense de session', plural: 'Récompenses de session' },
  admin: {
    useAsTitle: 'batchId',
    defaultColumns: ['batchId', 'appliedBy', 'createdAt'],
    group: 'Administration',
    description:
      "Historique des scripts de fin de mission appliqués aux escouades / sélections de personnages.",
  },
  access: {
    read: ({ req }) => (req.user as User | null)?.role === 'admin',
    create: ({ req }) => (req.user as User | null)?.role === 'admin',
    // Log immuable : pas de modification ni suppression via l'API.
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: 'batchId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Identifiant du batch',
      admin: {
        description:
          "UUID généré côté client, garantit l'idempotence de l'application des gains.",
        readOnly: true,
      },
    },
    {
      name: 'appliedBy',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      label: 'Appliqué par',
      admin: { readOnly: true },
    },
    {
      name: 'scopeType',
      type: 'select',
      required: true,
      label: 'Type de portée',
      options: [
        { label: 'Escouade complète', value: 'group' },
        { label: 'Sélection manuelle', value: 'selection' },
      ],
      admin: { readOnly: true },
    },
    {
      name: 'group',
      type: 'relationship',
      relationTo: 'groups',
      label: 'Escouade',
      admin: {
        condition: (data) => data?.scopeType === 'group',
        readOnly: true,
      },
    },
    {
      name: 'characterIds',
      type: 'json',
      required: true,
      label: 'Identifiants des personnages',
      admin: {
        description: 'Liste des IDs des personnages ciblés par le batch.',
        readOnly: true,
      },
    },
    {
      name: 'rewards',
      type: 'json',
      required: true,
      label: 'Valeurs globales appliquées',
      admin: {
        description:
          "Valeurs générales saisies dans le formulaire (konis total, PR, faction, etc.).",
        readOnly: true,
      },
    },
    {
      name: 'perCharacter',
      type: 'json',
      required: true,
      label: 'Détail par personnage',
      admin: {
        description:
          'Snapshot avant/après pour chaque personnage — sert de base à un futur undo.',
        readOnly: true,
      },
    },
    {
      name: 'reverted',
      type: 'checkbox',
      defaultValue: false,
      label: 'Annulé',
      admin: { readOnly: true },
    },
    {
      name: 'revertedAt',
      type: 'date',
      label: "Date d'annulation",
      admin: { readOnly: true, condition: (data) => !!data?.reverted },
    },
    {
      name: 'revertedBy',
      type: 'relationship',
      relationTo: 'users',
      label: 'Annulé par',
      admin: { readOnly: true, condition: (data) => !!data?.reverted },
    },
  ],
  timestamps: true,
}
