import type { CollectionConfig } from 'payload'

export const LoreArticles: CollectionConfig = {
  slug: 'lore-articles',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', '_status', 'updatedAt'],
    group: 'Lore',
    description: 'Articles encyclopédiques de l\'univers Space Squad.',
  },
  versions: {
    drafts: true,
  },
  access: {
    // Lecture publique pour les articles publiés uniquement
    read: ({ req }) => {
      if (req.user) return true
      return {
        _status: { equals: 'published' },
      }
    },
    // Écriture réservée aux utilisateurs connectés (admins)
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        // Auto-génération du slug depuis le titre à la création
        if (operation === 'create' && data.title && !data.slug) {
          data.slug = data.title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // supprime les accents
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Titre',
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      label: 'Slug (URL)',
      admin: {
        description: 'Généré automatiquement depuis le titre. Modifiable manuellement si besoin.',
        position: 'sidebar',
      },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      label: 'Catégorie',
      options: [
        {
          label: 'Chronologies',
          value: 'chronologies',
        },
        {
          label: 'Espèces non-humaines',
          value: 'especes-non-humaines',
        },
        {
          label: 'Politique',
          value: 'politique',
        },
        {
          label: 'Technologie',
          value: 'technologie',
        },
        {
          label: 'Culture',
          value: 'culture',
        },
        {
          label: 'Stardash',
          value: 'stardash',
        },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      label: 'Résumé',
      admin: {
        description: 'Courte description affichée dans les listes et aperçus (facultatif).',
        rows: 3,
      },
    },
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      label: 'Image de couverture',
      admin: {
        description: 'Image d\'en-tête de l\'article (facultatif).',
        position: 'sidebar',
      },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      label: 'Contenu',
    },
  ],
}
