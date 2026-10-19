import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'
import type { User } from '@/payload-types'
import { vehicleReadAccess } from '@/lib/vehicleAccess'

const relationId = (value: unknown): number | string | undefined => {
  if (typeof value === 'number' || typeof value === 'string') return value
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    if (typeof id === 'number' || typeof id === 'string') return id
  }
  return undefined
}

const initializeAndValidateVehicle: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  operation,
  req,
}) => {
  const modelId = relationId(data.modele ?? originalDoc?.modele)
  if (modelId === undefined) return data

  const model = await req.payload.findByID({
    collection: 'vehicle-sale-models',
    id: modelId,
    depth: 0,
    overrideAccess: true,
    req,
  })

  if (operation === 'create' && data.blindageActuel == null) {
    data.blindageActuel = model.blindageMax
  }

  const currentArmor = Object.prototype.hasOwnProperty.call(data, 'blindageActuel')
    ? data.blindageActuel
    : originalDoc?.blindageActuel
  if (typeof currentArmor === 'number' && currentArmor > model.blindageMax) {
    throw new Error('Le blindage actuel ne peut pas dépasser le blindage maximal du modèle.')
  }

  const weaponValue = Object.prototype.hasOwnProperty.call(data, 'armeTourelle')
    ? data.armeTourelle
    : originalDoc?.armeTourelle
  const ammoValue = Object.prototype.hasOwnProperty.call(data, 'chargeurRelie')
    ? data.chargeurRelie
    : originalDoc?.chargeurRelie
  const weaponId = relationId(weaponValue)
  const ammoId = relationId(ammoValue)
  if (ammoId !== undefined && weaponId === undefined) {
    throw new Error('Un chargeur ne peut être chargé que si une arme est équipée sur la tourelle.')
  }
  if (weaponId === undefined) return data

  if (!model.tourelleClasseMax) {
    throw new Error('Ce modèle de véhicule ne dispose pas de tourelle.')
  }

  const weapon = await req.payload.findByID({
    collection: 'ship-weapons',
    id: weaponId,
    depth: 0,
    overrideAccess: true,
    req,
  })
  const maxSizeByClass = { alpha: 1, beta: 2, gamma: 3 } as const
  const maxSize = maxSizeByClass[model.tourelleClasseMax]
  if (Number(weapon.taille) > maxSize) {
    throw new Error(
      `La tourelle de classe ${model.tourelleClasseMax} ne peut pas accueillir cette arme de vaisseau.`,
    )
  }

  return data
}

export const Vehicles: CollectionConfig = {
  slug: 'vehicles',
  labels: { singular: 'Véhicule acheté', plural: 'Véhicules achetés' },
  admin: {
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'modele', 'proprietaire', 'blindageActuel'],
    group: 'Véhicules',
  },
  access: {
    read: vehicleReadAccess,
    create: ({ req }) => (req.user as User | null)?.role === 'admin',
    update: ({ req }) => (req.user as User | null)?.role === 'admin',
    delete: ({ req }) => (req.user as User | null)?.role === 'admin',
  },
  hooks: { beforeChange: [initializeAndValidateVehicle] },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'nom',
          type: 'text',
          required: true,
          label: 'Nom du véhicule',
          admin: { width: '33%' },
        },
        {
          name: 'modele',
          type: 'relationship',
          relationTo: 'vehicle-sale-models',
          required: true,
          label: 'Modèle de vente',
          admin: { width: '34%' },
        },
        {
          name: 'proprietaire',
          type: 'relationship',
          relationTo: 'characters',
          label: 'Propriétaire',
          admin: { width: '33%' },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'État actuel',
      fields: [
        {
          name: 'blindageActuel',
          type: 'number',
          required: true,
          min: 0,
          label: 'Blindage actuel',
          admin: { description: 'Initialisé à la valeur maximale du modèle à la création.' },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Tourelle',
      admin: { description: 'À utiliser uniquement si le modèle de vente prévoit une tourelle.' },
      fields: [
        {
          name: 'armeTourelle',
          type: 'relationship',
          relationTo: 'ship-weapons',
          label: 'Arme de vaisseau équipée',
        },
        {
          type: 'row',
          fields: [
            {
              name: 'chargeurRelie',
              type: 'relationship',
              relationTo: 'ship-consumables',
              label: 'Munitions chargées',
              admin: { width: '50%' },
            },
            {
              name: 'munitionsActuelles',
              type: 'number',
              min: 0,
              label: 'Munitions restantes',
              admin: { width: '50%' },
            },
          ],
        },
      ],
    },
  ],
}
