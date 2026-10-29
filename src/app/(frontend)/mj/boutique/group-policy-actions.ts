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
    collectKeys(node.children, keys)
  }
  return keys
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
