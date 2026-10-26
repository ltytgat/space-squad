import type { CollectionConfig } from 'payload'
import type { User } from '@/payload-types'
import { getActiveCharacter } from '@/lib/activeCharacter'
import { isMJMode } from '@/lib/activeMode'
import { getMJGroupIds } from '@/lib/mjAccess'

async function readableOwnerIds(req: any): Promise<number[]> {
  const character = await getActiveCharacter(req.payload, req.user).catch(() => null)
  if (!character) return []
  const ids = new Set<number>([Number(character.id)])
  if (await isMJMode(req.user)) {
    const groupIds = await getMJGroupIds(req.payload, req.user)
    if (groupIds.length) {
      const { docs } = await req.payload.find({
        collection: 'characters', where: { groupe: { in: groupIds } }, depth: 0,
        pagination: false, overrideAccess: true, req,
      })
      for (const member of docs as any[]) ids.add(Number(member.id))
    }
  }
  return [...ids].filter(Number.isSafeInteger)
}

export const CustomEquipment: CollectionConfig = {
  slug: 'custom-equipment',
  labels: { singular: 'Équipement personnalisé', plural: 'Équipements personnalisés' },
  admin: {
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'categorieEquipement', 'proprietaireActuel', 'prixAchat'],
    group: 'Ateliers',
  },
  access: {
    read: async ({ req }) => {
      const user = req.user as User | null
      if (!user) return false
      if (user.role === 'admin') return true
      const ids = await readableOwnerIds(req)
      return ids.length ? { proprietaireActuel: { in: ids } } as any : false
    },
    create: ({ req }) => (req.user as User | null)?.role === 'admin',
    update: ({ req }) => (req.user as User | null)?.role === 'admin',
    delete: ({ req }) => (req.user as User | null)?.role === 'admin',
  },
  fields: [
    { name: 'nom', type: 'text', required: true, label: 'Nom' },
    {
      name: 'categorieEquipement', type: 'select', required: true, label: 'Équipement',
      options: [{ label: 'Arme', value: 'arme' }, { label: 'Armure', value: 'armure' }],
    },
    { name: 'categorie', type: 'text', required: true, label: 'Catégorie source' },
    { name: 'typeArme', type: 'text', label: 'Type d’arme' },
    { name: 'armeSource', type: 'relationship', relationTo: 'weapons', label: 'Arme source' },
    { name: 'armureSource', type: 'relationship', relationTo: 'armors', label: 'Armure source' },
    { name: 'set', type: 'relationship', relationTo: 'armor-sets', label: 'Set source' },
    { name: 'proprietaireActuel', type: 'relationship', relationTo: 'characters', required: true, label: 'Propriétaire actuel' },
    { name: 'proprietaireOrigine', type: 'relationship', relationTo: 'characters', required: true, label: 'Créateur / propriétaire d’origine' },
    { name: 'prixAchat', type: 'number', required: true, min: 0, label: 'Prix d’achat stocké' },
    { name: 'mods', type: 'relationship', relationTo: 'mods', hasMany: true, label: 'Mods installés' },
    { name: 'munitionsActuelles', type: 'number', min: 0, label: 'Munitions actuelles' },
    { name: 'chargeurRelie', type: 'relationship', relationTo: 'consumables', label: 'Chargeur engagé' },
    { name: 'proprietesFigees', type: 'json', required: true, label: 'Propriétés figées' },
    {
      name: 'modificationsAtelier', type: 'array', label: 'Modifications appliquées',
      fields: [
        { name: 'modificationSourceId', type: 'number', label: 'ID recette source' },
        { name: 'nom', type: 'text', required: true, label: 'Nom figé' },
        { name: 'prix', type: 'number', required: true, min: 0, label: 'Prix figé' },
        { name: 'maximum', type: 'number', min: 1, label: 'Maximum figé' },
        { name: 'multiplicateurRachat', type: 'number', label: 'Multiplicateur de rachat figé' },
        { name: 'compatibilite', type: 'json', label: 'Compatibilité figée' },
        { name: 'effets', type: 'json', required: true, label: 'Effets figés' },
      ],
    },
  ],
}
