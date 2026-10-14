import type { CollectionConfig } from 'payload'
import type { User } from '@/payload-types'

export const CharacterWorkspaces: CollectionConfig = {
  slug: 'character-workspaces',
  labels: { singular: 'Workspace temporaire', plural: 'Workspaces temporaires' },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['id', 'lastActivityAt', 'expiresAt', 'createdAt'],
    group: 'Administration',
  },
  access: {
    admin: ({ req }) => (req.user as User | null)?.role === 'admin',
    read: ({ req }) => (req.user as User | null)?.role === 'admin',
    create: ({ req }) => (req.user as User | null)?.role === 'admin',
    update: ({ req }) => (req.user as User | null)?.role === 'admin',
    delete: ({ req }) => (req.user as User | null)?.role === 'admin',
  },
  fields: [
    {
      name: 'tokenHash',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { hidden: true },
    },
    {
      name: 'createdFromHash',
      type: 'text',
      index: true,
      admin: { hidden: true },
    },
    {
      name: 'lastActivityAt',
      type: 'date',
      required: true,
      index: true,
    },
    {
      name: 'expiresAt',
      type: 'date',
      required: true,
      index: true,
    },
    {
      name: 'requestWindowStartedAt',
      type: 'date',
      required: true,
      admin: { hidden: true },
    },
    {
      name: 'requestCount',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: { hidden: true },
    },
  ],
}
