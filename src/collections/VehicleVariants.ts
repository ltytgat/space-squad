import type { CollectionConfig } from 'payload'
import type { User } from '@/payload-types'

/** A vehicle type belongs to one of the two variant slots in its class. */
export const VehicleVariants: CollectionConfig = {
  slug: 'vehicle-variants',
  labels: { singular: 'Type de véhicule', plural: 'Types de véhicule' },
  admin: {
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'classe', 'position'],
    group: 'Véhicules',
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
          label: 'Type de véhicule',
          admin: { width: '40%' },
        },
        {
          name: 'classe',
          type: 'select',
          required: true,
          label: 'Classe',
          options: [
            { label: 'Alpha', value: 'alpha' },
            { label: 'Beta', value: 'beta' },
            { label: 'Gamma', value: 'gamma' },
            { label: 'Delta', value: 'delta' },
          ],
          admin: { width: '30%' },
        },
        {
          name: 'position',
          type: 'select',
          required: true,
          label: 'Variante',
          options: [
            { label: 'Variante 1', value: '1' },
            { label: 'Variante 2', value: '2' },
          ],
          admin: { width: '30%' },
        },
      ],
    },
  ],
  indexes: [{ fields: ['classe', 'position'], unique: true }],
}
