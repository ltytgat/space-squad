import type { CollectionConfig } from 'payload'
import type { User } from '@/payload-types'

export const Armors: CollectionConfig = {
  slug: 'armors',
  labels: { singular: 'Armure', plural: 'Armures' },
  admin: {
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'valeurArmurePhysique', 'valeurBouclier', 'valeurRupture'],
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
      name: 'valeurArmurePhysique',
      type: 'number',
      label: "Valeur d'armure physique",
    },
    {
      name: 'valeurBouclier',
      type: 'number',
      label: 'Valeur de bouclier',
    },
    {
      name: 'modificateur',
      type: 'number',
      label: 'Modificateur',
      admin: { description: 'Modificateur appliqué aux jets (positif ou négatif).' },
    },
    {
      name: 'valeurRupture',
      type: 'number',
      label: 'Valeur de rupture',
    },
    {
      name: 'mods',
      type: 'textarea',
      label: 'Emplacement de mods',
      admin: { description: "Modification(s) installée(s) sur cette pièce d'armure." },
    },
  ],
}
