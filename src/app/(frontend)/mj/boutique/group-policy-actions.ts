'use server'

import { headers } from 'next/headers.js'
import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getMJGroupIds } from '@/lib/mjAccess'
import { isMJMode } from '@/lib/activeMode'
import { getShopPolicyForGroup, loadShopPolicyCatalogs, shopPolicyTreeFromCatalogs, type GroupShopPolicy, type GroupShopRule, type ShopPolicyNode } from '@/lib/groupShopPolicy'

function collectKeys(nodes: ShopPolicyNode[], keys = new Set<string>()) {
  for (const node of nodes) {
    keys.add(node.key)
    node.legacyRulePaths?.forEach((key) => keys.add(key))
    collectKeys(node.children, keys)
  }
  return keys
}

export type GroupShopPolicyPresetSummary = {
  id: number
  name: string
  updatedAt: string
}

const MAX_SHOP_POLICY_PRESETS = 50

function normalizePresetName(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Le nom de la sauvegarde est invalide.')
  const name = value.trim()
  if (!name) throw new Error('Saisissez un nom pour cette sauvegarde.')
  if (name.length > 100) throw new Error('Le nom ne peut pas dépasser 100 caractères.')
  return name
}

function normalizePresetNameKey(value: string) {
  return value.trim().toLocaleLowerCase('fr-FR')
}

function validatePolicy(input: GroupShopPolicy, allowedKeys: Set<string>): GroupShopPolicy {
  if (!input || typeof input !== 'object' || !input.rules || typeof input.rules !== 'object' || Array.isArray(input.rules)) {
    throw new Error('Configuration de boutique invalide.')
  }
  const rules: GroupShopPolicy['rules'] = {}
  for (const [key, value] of Object.entries(input.rules)) {
    if (!allowedKeys.has(key) || !value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Une règle cible un élément inconnu.')
    const rule: GroupShopRule = {}
    if (value.percentage !== undefined) {
      if (!Number.isSafeInteger(value.percentage) || value.percentage < -100) throw new Error('Le pourcentage doit être un entier supérieur ou égal à −100.')
      rule.percentage = value.percentage
    }
    if (value.available !== undefined) {
      if (typeof value.available !== 'boolean') throw new Error('Disponibilité invalide.')
      rule.available = value.available
    }
    if (Object.keys(rule).length) rules[key] = rule
  }
  return { rules }
}

function relationId(value: unknown): number | null {
  const raw = value && typeof value === 'object' ? (value as { id?: unknown }).id : value
  const id = Number(raw)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

async function findOwnedPreset(payload: any, userId: number, presetId: number) {
  if (!Number.isSafeInteger(presetId) || presetId <= 0) throw new Error('Sauvegarde invalide.')
  const preset = await payload.findByID({ collection: 'shop-policy-presets', id: presetId, depth: 0, overrideAccess: true }).catch(() => null) as any
  if (!preset || relationId(preset.owner) !== userId) throw new Error('Cette sauvegarde ne vous appartient pas.')
  return preset
}

async function assertUniquePresetName(payload: any, userId: number, name: string, exceptId?: number) {
  const existing = await payload.find({
    collection: 'shop-policy-presets',
    where: { owner: { equals: userId } },
    depth: 0,
    limit: MAX_SHOP_POLICY_PRESETS + 1,
    overrideAccess: true,
  })
  const key = normalizePresetNameKey(name)
  if ((existing.docs as any[]).some((preset) => Number(preset.id) !== exceptId && normalizePresetNameKey(String(preset.name ?? '')) === key)) {
    throw new Error('Une sauvegarde porte déjà ce nom. Choisissez-la pour l’écraser ou utilisez un autre nom.')
  }
  return existing
}

async function getMJContext() {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user || !(await isMJMode(user))) throw new Error('Accès réservé aux MJ.')
  return { payload, user }
}

export async function saveGroupShopPolicy(groupId: number, input: GroupShopPolicy) {
  const { payload, user } = await getMJContext()
  if (!Number.isSafeInteger(groupId) || groupId <= 0) throw new Error('Escouade invalide.')
  const groupIds = await getMJGroupIds(payload, user)
  if (!groupIds.includes(groupId)) throw new Error('Cette escouade ne vous appartient pas.')
  if (!input || typeof input !== 'object' || !input.rules || typeof input.rules !== 'object' || Array.isArray(input.rules)) {
    throw new Error('Configuration de boutique invalide.')
  }
  const catalogs = await loadShopPolicyCatalogs(payload)
  const keys = collectKeys(shopPolicyTreeFromCatalogs(catalogs))
  const existing = await getShopPolicyForGroup(payload, groupId)
  for (const key of Object.keys(existing.rules)) keys.add(key)
  const rules: GroupShopPolicy['rules'] = {}
  for (const [key, value] of Object.entries(input.rules)) {
    if (!keys.has(key) || !value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Une règle cible un élément inconnu.')
    const rule: GroupShopRule = {}
    if (value.percentage !== undefined) {
      if (!Number.isSafeInteger(value.percentage) || value.percentage < -100) throw new Error('Le pourcentage doit être un entier supérieur ou égal à −100.')
      rule.percentage = value.percentage
    }
    if (value.available !== undefined) {
      if (typeof value.available !== 'boolean') throw new Error('Disponibilité invalide.')
      rule.available = value.available
    }
    if (Object.keys(rule).length) rules[key] = rule
  }
  await payload.update({ collection: 'groups', id: groupId, data: { shopPolicy: { rules } } as any, overrideAccess: true, user })
  revalidatePath(`/mj/boutique/escouade/${groupId}`)
  revalidatePath('/shop', 'layout')
  return { success: true }
}

export async function listGroupShopPolicyPresets(): Promise<GroupShopPolicyPresetSummary[]> {
  const { payload, user } = await getMJContext()
  const result = await payload.find({
    collection: 'shop-policy-presets',
    where: { owner: { equals: user.id } },
    depth: 0,
    limit: MAX_SHOP_POLICY_PRESETS,
    sort: '-updatedAt',
    overrideAccess: true,
  })
  return (result.docs as any[]).map((preset) => ({
    id: Number(preset.id),
    name: String(preset.name),
    updatedAt: String(preset.updatedAt),
  }))
}

export async function saveGroupShopPolicyPreset(groupId: number, rawName: string, input: GroupShopPolicy, presetId?: number) {
  const { payload, user } = await getMJContext()
  if (!Number.isSafeInteger(groupId) || groupId <= 0) throw new Error('Escouade invalide.')
  if (!(await getMJGroupIds(payload, user)).includes(groupId)) throw new Error('Cette escouade ne vous appartient pas.')

  const name = normalizePresetName(rawName)
  const catalogs = await loadShopPolicyCatalogs(payload)
  const allowedKeys = collectKeys(shopPolicyTreeFromCatalogs(catalogs))
  const currentPolicy = await getShopPolicyForGroup(payload, groupId)
  Object.keys(currentPolicy.rules).forEach((key) => allowedKeys.add(key))
  const policy = validatePolicy(input, allowedKeys)
  const targetPreset = presetId === undefined ? null : await findOwnedPreset(payload, Number(user.id), presetId)
  const existing = await assertUniquePresetName(payload, Number(user.id), name, presetId)

  let saved: any
  if (targetPreset) {
    saved = await payload.update({
      collection: 'shop-policy-presets',
      id: targetPreset.id,
      data: { name, nameKey: normalizePresetNameKey(name), policy },
      overrideAccess: true,
      user,
    })
  } else {
    if (Number(existing.totalDocs) >= MAX_SHOP_POLICY_PRESETS) {
      throw new Error(`Vous avez atteint la limite de ${MAX_SHOP_POLICY_PRESETS} sauvegardes. Supprimez-en une pour en créer une nouvelle.`)
    }
    saved = await payload.create({
      collection: 'shop-policy-presets',
      data: { owner: user.id, name, nameKey: normalizePresetNameKey(name), policy },
      overrideAccess: true,
      user,
    })
  }
  return { id: Number(saved.id), name: String(saved.name), updatedAt: String(saved.updatedAt) }
}

export async function loadGroupShopPolicyPreset(presetId: number): Promise<GroupShopPolicy> {
  const { payload, user } = await getMJContext()
  const preset = await findOwnedPreset(payload, Number(user.id), presetId)
  const policy = preset.policy
  if (!policy || typeof policy !== 'object' || !policy.rules || typeof policy.rules !== 'object' || Array.isArray(policy.rules)) {
    throw new Error('Le contenu de cette sauvegarde est invalide.')
  }
  return policy as GroupShopPolicy
}

export async function deleteGroupShopPolicyPreset(presetId: number) {
  const { payload, user } = await getMJContext()
  const preset = await findOwnedPreset(payload, Number(user.id), presetId)
  await payload.delete({ collection: 'shop-policy-presets', id: preset.id, overrideAccess: true, user })
  return { success: true }
}
