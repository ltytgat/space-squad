import type { CollectionConfig } from 'payload'
import type { User } from '@/payload-types'

const shipWeaponStateFields = () => [
  {
    name: 'munitionsActuelles',
    type: 'number' as const,
    label: 'Munitions actuelles',
    defaultValue: 0,
  },
  {
    name: 'chargeurRelie',
    type: 'relationship' as const,
    relationTo: 'ship-consumables' as const,
    label: 'Munition chargée',
  },
  { name: 'chauffeActuelle', type: 'number' as const, label: 'Chauffe actuelle', defaultValue: 0 },
]

export const Ships: CollectionConfig = {
  slug: 'ships',
  labels: { singular: 'Vaisseau', plural: 'Vaisseaux' },
  admin: {
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'modele', 'proprietaire'],
    group: 'Jeu de Rôle',
  },
  access: {
    read: ({ req }) => !!req.user,
    create: ({ req }) => (req.user as User | null)?.role === 'admin',
    update: ({ req }) => (req.user as User | null)?.role === 'admin',
    delete: ({ req }) => (req.user as User | null)?.role === 'admin',
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation !== 'create' || !data?.modele) return data

        const saleModel = (await req.payload.findByID({
          collection: 'ship-sale-models',
          id: typeof data.modele === 'object' ? data.modele.id : data.modele,
          depth: 1,
        })) as any

        if (!saleModel) return data
        const chassis =
          typeof saleModel.chassis === 'object'
            ? saleModel.chassis
            : await req.payload.findByID({
                collection: 'ship-models',
                id: saleModel.chassis,
                depth: 0,
              })

        const installedArmes = saleModel.armes ?? []
        const pilotWeapons = installedArmes
          .filter((entry: any) => !entry.emplacement || entry.emplacement === 'pilote')
          .map((entry: any) => ({
            arme: typeof entry.arme === 'object' ? entry.arme.id : entry.arme,
          }))
        const turretWeapons = Array.from({ length: chassis?.tourelles ?? 0 }, (_, index) => ({
          tourelle: index + 1,
          armes: installedArmes
            .filter((entry: any) => entry.emplacement === `tourelle-${index + 1}`)
            .map((entry: any) => ({
              arme: typeof entry.arme === 'object' ? entry.arme.id : entry.arme,
            })),
        })).filter((turret: any) => turret.armes.length > 0)

        return {
          ...data,
          moduleGenerateur:
            data.moduleGenerateur ??
            (typeof saleModel.generateur === 'object'
              ? saleModel.generateur.id
              : saleModel.generateur),
          modulePropulseurs:
            data.modulePropulseurs ??
            (typeof saleModel.propulseurs === 'object'
              ? saleModel.propulseurs.id
              : saleModel.propulseurs),
          moduleBoucliers:
            data.moduleBoucliers ??
            (typeof saleModel.boucliers === 'object'
              ? saleModel.boucliers.id
              : saleModel.boucliers),
          moduleSurvie:
            data.moduleSurvie ??
            (typeof saleModel.survie === 'object' ? saleModel.survie.id : saleModel.survie),
          modulesSupplementaires:
            data.modulesSupplementaires ??
            (saleModel.modulesOptionnels ?? []).map((module: any) =>
              typeof module === 'object' ? module.id : module,
            ),
          armesPilote: data.armesPilote ?? pilotWeapons,
          armesTourelles: data.armesTourelles ?? turretWeapons,
          blindageActuel: data.blindageActuel ?? chassis?.blindage,
          bouclierActuel: data.bouclierActuel ?? 0,
          esquiveActuelle: data.esquiveActuelle ?? chassis?.esquiveBase,
          inventaireModules: data.inventaireModules ?? [],
          inventaireArmes: data.inventaireArmes ?? [],
          inventaireConsommables: data.inventaireConsommables ?? [],
        }
      },
    ],
  },
  fields: [
    // ── Identité ──────────────────────────────────────
    {
      type: 'row',
      fields: [
        {
          name: 'nom',
          type: 'text',
          required: true,
          label: 'Nom (immatriculation)',
          admin: { width: '50%' },
        },
        {
          name: 'modele',
          type: 'relationship',
          relationTo: 'ship-sale-models',
          required: true,
          label: 'Modèle',
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'proprietaire',
      type: 'relationship',
      relationTo: 'characters',
      label: 'Propriétaire (acheteur)',
      admin: {
        position: 'sidebar',
        description: 'Le personnage qui a acheté ce vaisseau.',
      },
    },

    // ── État actuel ───────────────────────────────────
    {
      type: 'collapsible',
      label: 'État actuel',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'blindageActuel',
              type: 'number',
              label: 'Blindage actuel',
              admin: { width: '33%' },
            },
            {
              name: 'bouclierActuel',
              type: 'number',
              label: 'Bouclier actuel',
              admin: { width: '33%' },
            },
            {
              name: 'esquiveActuelle',
              type: 'number',
              label: 'Esquive actuelle',
              admin: { width: '34%' },
            },
          ],
        },
      ],
    },

    // ── Équipage ──────────────────────────────────────
    {
      type: 'collapsible',
      label: 'Équipage',
      fields: [
        {
          name: 'pilote',
          type: 'relationship',
          relationTo: 'characters',
          label: 'Pilote',
        },
        {
          name: 'copilote',
          type: 'relationship',
          relationTo: 'characters',
          label: 'Copilote',
        },
        {
          name: 'canonniers',
          type: 'array',
          label: 'Canonniers (tourelles)',
          admin: {
            description: 'Un canonnier par tourelle disponible.',
          },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'personnage',
                  type: 'relationship',
                  relationTo: 'characters',
                  label: 'Canonnier',
                  admin: { width: '50%' },
                },
                {
                  name: 'tourelle',
                  type: 'number',
                  label: 'Tourelle n°',
                  admin: { width: '50%' },
                },
              ],
            },
          ],
        },
      ],
    },

    // ── Modules de base ──────────────────────────────
    {
      type: 'collapsible',
      label: 'Modules de base',
      fields: [
        {
          name: 'moduleGenerateur',
          type: 'relationship',
          relationTo: 'ship-modules',
          label: 'Générateur',
          filterOptions: {
            famille: { equals: 'generateur' },
          },
        },
        {
          name: 'modulePropulseurs',
          type: 'relationship',
          relationTo: 'ship-modules',
          label: 'Propulseurs',
          filterOptions: {
            famille: { in: ['propulseurs', 'propulseurs-stardash'] },
          },
        },
        {
          name: 'moduleSurvie',
          type: 'relationship',
          relationTo: 'ship-modules',
          label: 'Système de survie',
          filterOptions: {
            famille: { equals: 'survie' },
          },
        },
        {
          name: 'moduleBoucliers',
          type: 'relationship',
          relationTo: 'ship-modules',
          label: 'Boucliers',
          filterOptions: {
            famille: { equals: 'boucliers' },
          },
        },
      ],
    },

    // ── Modules supplémentaires ──────────────────────
    {
      type: 'collapsible',
      label: 'Modules supplémentaires',
      fields: [
        {
          name: 'modulesSupplementaires',
          type: 'relationship',
          relationTo: 'ship-modules',
          hasMany: true,
          label: 'Modules installés',
          filterOptions: {
            typeModule: { equals: 'supplementaire' },
          },
          admin: {
            description:
              "Modules supplémentaires installés (limité par le nombre d'emplacements du modèle).",
          },
        },
      ],
    },

    // ── Armement ─────────────────────────────────────
    {
      type: 'collapsible',
      label: 'Armement',
      fields: [
        {
          name: 'armesPilote',
          type: 'array',
          label: 'Armes du pilote',
          admin: {
            description: "Armes montées sur les points d'emport du pilote.",
          },
          fields: [
            {
              name: 'arme',
              type: 'relationship',
              relationTo: 'ship-weapons',
              required: true,
            },
            ...shipWeaponStateFields(),
          ],
        },
        {
          name: 'armesTourelles',
          type: 'array',
          label: 'Armes des tourelles',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'tourelle',
                  type: 'number',
                  label: 'Tourelle n°',
                  admin: { width: '20%' },
                },
                {
                  name: 'module',
                  type: 'relationship',
                  relationTo: 'ship-modules',
                  label: 'Module de tourelle',
                  filterOptions: {
                    typeModule: { equals: 'tourelle' },
                  },
                  admin: { width: '30%' },
                },
                {
                  name: 'armes',
                  type: 'array',
                  label: 'Armes',
                  admin: { width: '50%' },
                  fields: [
                    {
                      name: 'arme',
                      type: 'relationship',
                      relationTo: 'ship-weapons',
                      required: true,
                    },
                    ...shipWeaponStateFields(),
                  ],
                },
              ],
            },
          ],
        },
      ],
    },

    // ── Consommables ─────────────────────────────────
    {
      type: 'collapsible',
      label: 'Consommables',
      fields: [
        {
          name: 'consommablesVaisseau',
          type: 'array',
          label: 'Consommables embarqués',
          admin: {
            description: "Limité par le nombre d'emplacements consommables du modèle.",
          },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'consommable',
                  type: 'relationship',
                  relationTo: 'ship-consumables',
                  label: 'Consommable',
                  required: true,
                  admin: { width: '70%' },
                },
                {
                  name: 'quantite',
                  type: 'number',
                  label: 'Quantité',
                  required: true,
                  defaultValue: 1,
                  min: 1,
                  admin: { width: '30%' },
                },
              ],
            },
          ],
        },
      ],
    },

    {
      type: 'collapsible',
      label: 'Inventaire du vaisseau',
      fields: [
        {
          name: 'inventaireModules',
          type: 'array',
          label: 'Modules disponibles',
          fields: [
            { name: 'module', type: 'relationship', relationTo: 'ship-modules', required: true },
            { name: 'quantite', type: 'number', required: true, defaultValue: 1, min: 1 },
          ],
        },
        {
          name: 'inventaireArmes',
          type: 'array',
          label: 'Armes disponibles',
          fields: [
            { name: 'arme', type: 'relationship', relationTo: 'ship-weapons', required: true },
            { name: 'quantite', type: 'number', required: true, defaultValue: 1, min: 1 },
          ],
        },
        {
          name: 'inventaireConsommables',
          type: 'array',
          label: 'Consommables disponibles',
          fields: [
            {
              name: 'consommable',
              type: 'relationship',
              relationTo: 'ship-consumables',
              required: true,
            },
            { name: 'quantite', type: 'number', required: true, defaultValue: 1, min: 1 },
          ],
        },
      ],
    },

    // ── Notes ─────────────────────────────────────────
    {
      name: 'notes',
      type: 'textarea',
      label: 'Notes',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Image',
      admin: { position: 'sidebar' },
    },
  ],
}
