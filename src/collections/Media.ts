import type { CollectionConfig } from 'payload'
import type { User } from '@/payload-types'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Administration',
  },
  access: {
    read: () => true,
    // L'envoi de fichiers vers le bucket est réservé aux admins.
    create: ({ req }) => (req.user as User | null)?.role === 'admin',
    update: ({ req }) => (req.user as User | null)?.role === 'admin',
    delete: ({ req }) => (req.user as User | null)?.role === 'admin',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: {
    mimeTypes: ['image/*'],
  },
}
