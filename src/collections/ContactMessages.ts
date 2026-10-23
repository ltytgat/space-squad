import type { CollectionConfig } from 'payload'
import type { User } from '@/payload-types'

/**
 * Messages reçus via le formulaire de contact. L'écriture passe uniquement par
 * l'action serveur `submitContactMessage`, qui applique les limites anti-spam.
 */
export const ContactMessages: CollectionConfig = {
  slug: 'contact-messages',
  labels: { singular: 'Message de contact', plural: 'Messages de contact' },
  admin: {
    useAsTitle: 'subject',
    defaultColumns: ['subject', 'email', 'kind', 'status', 'createdAt'],
    group: 'Administration',
  },
  access: {
    create: () => false,
    read: ({ req }) => (req.user as User | null)?.role === 'admin',
    update: ({ req }) => (req.user as User | null)?.role === 'admin',
    delete: ({ req }) => (req.user as User | null)?.role === 'admin',
  },
  fields: [
    {
      name: 'kind',
      type: 'select',
      required: true,
      label: 'Expéditeur',
      options: [
        { label: 'Invité', value: 'guest' },
        { label: 'Utilisateur', value: 'user' },
      ],
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'nouveau',
      label: 'Statut',
      options: [
        { label: 'Nouveau', value: 'nouveau' },
        { label: 'Traité', value: 'traite' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'emailSent',
      type: 'checkbox',
      defaultValue: false,
      label: 'E-mail transmis',
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      label: 'Adresse e-mail',
      admin: { readOnly: true },
    },
    {
      name: 'subject',
      type: 'text',
      required: true,
      maxLength: 150,
      label: 'Sujet',
      admin: { readOnly: true },
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
      maxLength: 5000,
      label: 'Message',
      admin: { readOnly: true },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      label: 'Compte',
      admin: { readOnly: true },
    },
    {
      name: 'character',
      type: 'relationship',
      relationTo: 'characters',
      label: 'Personnage actif',
      admin: { readOnly: true },
    },
    {
      name: 'ipHash',
      type: 'text',
      index: true,
      admin: { hidden: true },
    },
  ],
}
