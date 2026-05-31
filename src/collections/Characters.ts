import type { CollectionConfig } from 'payload'
import type { User } from '@/payload-types'

const COMPETENCES_BASE = [
  'Chasseur',
  'Bombardier',
  'Poids Lourds',
  'Transport de Troupes',
  'Canonnier',
  'Médecine de terrain',
  'Concentration',
  'Mécanicien',
  'Stabilisation',
  'Assaut',
  'Sniper',
  'Shotgun',
  'Combat rapproché',
  'Analyse',
  'Réactivité',
  'Furtivité',
  'Diplomate',
  'Culture',
] as const

export const Characters: CollectionConfig = {
  slug: 'characters',
  labels: { singular: 'Personnage', plural: 'Personnages' },
  admin: {
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'user', 'affiliation', 'groupe', 'pointsDeRang'],
    group: 'Jeu de Rôle',
  },
  access: {
    // Admin lit tout ; joueur lit uniquement son propre personnage
    read: ({ req }) => {
      const user = req.user as User | null
      if (!user) return false
      if (user.role === 'admin') return true
      return { user: { equals: user.id } }
    },
    // Seul l'admin crée et modifie les fiches
    create: ({ req }) => (req.user as User | null)?.role === 'admin',
    update: ({ req }) => (req.user as User | null)?.role === 'admin',
    delete: ({ req }) => (req.user as User | null)?.role === 'admin',
  },
  fields: [
    // ── Identité ──────────────────────────────────────
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      unique: true,
      label: 'Utilisateur',
      admin: {
        position: 'sidebar',
        description: 'Utilisateur propriétaire de ce personnage (1 personnage par compte).',
      },
    },
    {
      name: 'nom',
      type: 'text',
      label: 'Nom',
    },
    {
      name: 'sexe',
      type: 'select',
      label: 'Sexe',
      options: [
        { label: 'M', value: 'M' },
        { label: 'F', value: 'F' },
        { label: 'X', value: 'X' },
      ],
    },
    {
      name: 'origine',
      type: 'select',
      label: 'Origine (espèce)',
      options: [
        { label: 'Humain', value: 'Humain' },
        { label: 'Strani', value: 'Strani' },
        { label: 'Vada', value: 'Vada' },
      ],
    },
    {
      name: 'affiliation',
      type: 'select',
      label: 'Affiliation',
      options: [
        { label: 'Alliance', value: 'Alliance' },
        { label: 'Union', value: 'Union' },
        { label: 'Guilde', value: 'Guilde' },
      ],
    },
    {
      name: 'groupe',
      type: 'relationship',
      relationTo: 'groups',
      label: 'Groupe / Escouade',
      admin: { position: 'sidebar' },
    },

    // ── Ressources ────────────────────────────────────
    {
      type: 'row',
      fields: [
        { name: 'pointsDeRang', type: 'number', label: 'Points de rang', defaultValue: 0 },
        { name: 'konis', type: 'number', label: 'Konis', defaultValue: 0 },
        { name: 'legende', type: 'number', label: 'Légende', defaultValue: 0 },
      ],
    },

    // ── Attributs de base ─────────────────────────────
    {
      type: 'collapsible',
      label: 'Attributs de base',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'force', type: 'number', label: 'Force', defaultValue: 0 },
            { name: 'habilite', type: 'number', label: 'Habilité', defaultValue: 0 },
            { name: 'connaissances', type: 'number', label: 'Connaissances', defaultValue: 0 },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'culture', type: 'number', label: 'Culture', defaultValue: 0 },
            { name: 'anticipation', type: 'number', label: 'Anticipation', defaultValue: 0 },
            { name: 'perception', type: 'number', label: 'Perception', defaultValue: 0 },
          ],
        },
      ],
    },

    // ── Armures ───────────────────────────────────────
    {
      type: 'collapsible',
      label: 'Armures',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'armureTete',
              type: 'group',
              label: 'Tête',
              admin: { width: '50%' },
              fields: [
                {
                  name: 'item',
                  type: 'relationship',
                  relationTo: 'armors',
                  label: 'Pièce d\'armure',
                  filterOptions: { categorie: { equals: 'tete' } },
                },
                {
                  name: 'mods',
                  type: 'relationship',
                  relationTo: 'mods',
                  hasMany: true,
                  label: 'Mods',
                  filterOptions: ({ siblingData }) => {
                    return {
                      categoriePrincipale: { equals: 'armures' },
                      or: [{ sousCategorieArmure: { equals: 'toutes' } }, { sousCategorieArmure: { equals: 'tete' } }],
                    }
                  },
                },
              ],
            },
            {
              name: 'armureTorse',
              type: 'group',
              label: 'Torse',
              admin: { width: '50%' },
              fields: [
                {
                  name: 'item',
                  type: 'relationship',
                  relationTo: 'armors',
                  label: 'Pièce d\'armure',
                  filterOptions: { categorie: { equals: 'torse' } },
                },
                {
                  name: 'mods',
                  type: 'relationship',
                  relationTo: 'mods',
                  hasMany: true,
                  label: 'Mods',
                  filterOptions: ({ siblingData }) => {
                    return {
                      categoriePrincipale: { equals: 'armures' },
                      or: [{ sousCategorieArmure: { equals: 'toutes' } }, { sousCategorieArmure: { equals: 'torse' } }],
                    }
                  },
                },
              ],
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'armureBras',
              type: 'group',
              label: 'Bras',
              admin: { width: '50%' },
              fields: [
                {
                  name: 'item',
                  type: 'relationship',
                  relationTo: 'armors',
                  label: 'Pièce d\'armure',
                  filterOptions: { categorie: { equals: 'bras' } },
                },
                {
                  name: 'mods',
                  type: 'relationship',
                  relationTo: 'mods',
                  hasMany: true,
                  label: 'Mods',
                  filterOptions: ({ siblingData }) => {
                    return {
                      categoriePrincipale: { equals: 'armures' },
                      or: [{ sousCategorieArmure: { equals: 'toutes' } }, { sousCategorieArmure: { equals: 'bras' } }],
                    }
                  },
                },
              ],
            },
            {
              name: 'armureJambes',
              type: 'group',
              label: 'Jambes',
              admin: { width: '50%' },
              fields: [
                {
                  name: 'item',
                  type: 'relationship',
                  relationTo: 'armors',
                  label: 'Pièce d\'armure',
                  filterOptions: { categorie: { equals: 'jambes' } },
                },
                {
                  name: 'mods',
                  type: 'relationship',
                  relationTo: 'mods',
                  hasMany: true,
                  label: 'Mods',
                  filterOptions: ({ siblingData }) => {
                    return {
                      categoriePrincipale: { equals: 'armures' },
                      or: [
                        { sousCategorieArmure: { equals: 'toutes' } },
                        { sousCategorieArmure: { equals: 'jambes' } },
                      ],
                    }
                  },
                },
              ],
            },
          ],
        },
      ],
    },

    // ── Arsenal ───────────────────────────────────────
    {
      type: 'collapsible',
      label: 'Arsenal',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'armePrincipale',
              type: 'group',
              label: 'Arme principale',
              admin: { width: '50%' },
              fields: [
                { name: 'item', type: 'relationship', relationTo: 'weapons', label: 'Arme' },
                {
                  name: 'mods',
                  type: 'relationship',
                  relationTo: 'mods',
                  hasMany: true,
                  label: 'Mods',
                  filterOptions: { categoriePrincipale: { equals: 'armes' } },
                },
              ],
            },
            {
              name: 'armeSecondaire',
              type: 'group',
              label: 'Arme secondaire',
              admin: { width: '50%' },
              fields: [
                { name: 'item', type: 'relationship', relationTo: 'weapons', label: 'Arme' },
                {
                  name: 'mods',
                  type: 'relationship',
                  relationTo: 'mods',
                  hasMany: true,
                  label: 'Mods',
                  filterOptions: { categoriePrincipale: { equals: 'armes' } },
                },
              ],
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'armeLourde',
              type: 'group',
              label: 'Arme lourde',
              admin: { width: '33%' },
              fields: [
                {
                  name: 'item',
                  type: 'relationship',
                  relationTo: 'weapons',
                  label: 'Arme',
                  filterOptions: { categorie: { equals: 'lourde' } },
                },
                {
                  name: 'mods',
                  type: 'relationship',
                  relationTo: 'mods',
                  hasMany: true,
                  label: 'Mods',
                  filterOptions: { categoriePrincipale: { equals: 'armes' } },
                },
              ],
            },
            {
              name: 'armeDePoing',
              type: 'group',
              label: 'Arme de poing',
              admin: { width: '33%' },
              fields: [
                {
                  name: 'item',
                  type: 'relationship',
                  relationTo: 'weapons',
                  label: 'Arme',
                  filterOptions: { categorie: { equals: 'pistolet' } },
                },
                {
                  name: 'mods',
                  type: 'relationship',
                  relationTo: 'mods',
                  hasMany: true,
                  label: 'Mods',
                  filterOptions: { categoriePrincipale: { equals: 'armes' } },
                },
              ],
            },
            {
              name: 'armeDeMelee',
              type: 'group',
              label: 'Arme de mêlée',
              admin: { width: '33%' },
              fields: [
                {
                  name: 'item',
                  type: 'relationship',
                  relationTo: 'weapons',
                  label: 'Arme',
                  filterOptions: { categorie: { equals: 'melee' } },
                },
                {
                  name: 'mods',
                  type: 'relationship',
                  relationTo: 'mods',
                  hasMany: true,
                  label: 'Mods',
                  filterOptions: ({ siblingData }) => {
                    return {
                      categoriePrincipale: { equals: 'armes' },
                      or: [{ sousCategorieArme: { equals: 'toutes' } }, { sousCategorieArme: { equals: 'melee' } }],
                    }
                  },
                },
              ],
            },
          ],
        },
        {
          name: 'backpack',
          type: 'textarea',
          label: 'Backpack / Équipement divers',
        },
      ],
    },

    // ── Vaisseau ──────────────────────────────────────
    {
      type: 'row',
      fields: [
        {
          name: 'vaisseau',
          type: 'relationship',
          relationTo: 'ships',
          label: 'Vaisseau',
        },
        {
          name: 'roleVaisseau',
          type: 'select',
          label: 'Rôle à bord',
          options: [
            { label: 'Propriétaire', value: 'proprietaire' },
            { label: 'Passager', value: 'passager' },
          ],
        },
      ],
    },

    // ── Compétences de base ───────────────────────────
    {
      name: 'competences',
      type: 'array',
      label: 'Compétences',
      admin: { description: 'Compétences de la liste standard et leur niveau.' },
      fields: [
        {
          name: 'competence',
          type: 'select',
          label: 'Compétence',
          required: true,
          options: COMPETENCES_BASE.map((c) => ({ label: c, value: c })),
        },
        {
          name: 'valeur',
          type: 'number',
          label: 'Niveau',
          required: true,
          defaultValue: 0,
          min: 0,
        },
      ],
    },

    // ── Compétences personnalisées ────────────────────
    {
      name: 'competencesSpeciales',
      type: 'array',
      label: 'Compétences spéciales',
      admin: {
        description: 'Compétences uniques, hors liste standard, propres à ce personnage.',
      },
      fields: [
        {
          name: 'nom',
          type: 'text',
          label: 'Nom',
          required: true,
        },
        {
          name: 'valeur',
          type: 'number',
          label: 'Niveau',
          required: true,
          defaultValue: 0,
          min: 0,
        },
      ],
    },
  ],
}
