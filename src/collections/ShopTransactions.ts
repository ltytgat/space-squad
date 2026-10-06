import type { CollectionConfig } from 'payload'

/**
 * Internal, immutable idempotency ledger used by shop and shipyard actions.
 * The actions write to this table inside their PostgreSQL transactions.
 */
export const ShopTransactions: CollectionConfig = {
  slug: 'shop-transactions',
  admin: {
    hidden: true,
    group: 'Administration',
    useAsTitle: 'transactionId',
  },
  access: {
    create: () => false,
    read: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: 'transactionId',
      type: 'text',
      required: true,
      unique: true,
      label: 'Identifiant de transaction',
    },
    {
      name: 'fingerprint',
      type: 'text',
      required: true,
    },
    {
      name: 'operation',
      type: 'text',
      required: true,
    },
    {
      name: 'actor',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'character',
      type: 'relationship',
      relationTo: 'characters',
      required: true,
      index: true,
    },
    {
      name: 'ship',
      type: 'relationship',
      relationTo: 'ships',
      index: true,
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
    },
    {
      name: 'details',
      type: 'json',
      required: true,
    },
  ],
  indexes: [{ fields: ['createdAt'] }],
  timestamps: true,
}
