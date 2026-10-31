import { describe, expect, it } from 'vitest'
import {
  legacyShopPolicyRuleKeysChangedAtNode,
  legacyShopPolicyRuleKeysInSubtree,
  resolveShopPolicy,
  shopPolicyNodePaths,
  shopPolicyPaths,
  shopPolicyTreeFromCatalogs,
  type ShopPolicyNode,
} from '@/lib/groupShopPolicy'

function findNode(nodes: ShopPolicyNode[], key: string): ShopPolicyNode | null {
  for (const node of nodes) {
    if (node.key === key) return node
    const child = findNode(node.children, key)
    if (child) return child
  }
  return null
}

describe('group shop policy display tree', () => {
  it('shows armor set names and vehicle variant and class names while retaining stable IDs in keys', () => {
    const tree = shopPolicyTreeFromCatalogs({
      armors: [{ id: 101, nom: 'Casque Orion', categorie: 'tete', set: { id: 7, nom: 'Set Orion' }, prix: 100 }],
      'vehicle-sale-models': [{ id: 201, nom: 'Rover', variante: { id: 11, nom: 'Tout terrain', classe: '1' }, prix: 100 }],
    })

    expect(findNode(tree, 'sol/armures/tete/7')?.label).toBe('Set Orion')
    expect(findNode(tree, 'garage/1')?.label).toBe('Légers')
    expect(findNode(tree, 'garage/1/11')?.label).toBe('Tout terrain')
  })

  it('puts consumables directly under their category and still resolves legacy subcategory rules', () => {
    const item = { id: 12, nom: 'Chargeur standard', categorie: 'munitions', typeMunition: 'chargeur', taille: 2, prix: 100 }
    const paths = shopPolicyPaths('consumables', item)
    const tree = shopPolicyTreeFromCatalogs({ consumables: [item] })
    const category = findNode(tree, 'sol/consommables/munitions')

    expect(paths).toEqual(['sol', 'sol/consommables', 'sol/consommables/munitions', 'sol/consommables/munitions/item:consumables:12'])
    expect(category?.children.map(({ label }) => label)).toEqual(['Chargeur standard'])
    expect(resolveShopPolicy({ rules: { 'sol/consommables/munitions/chargeur': { percentage: 15 } } }, paths).percentage).toBe(15)
    const obsoleteKeys = legacyShopPolicyRuleKeysChangedAtNode(tree, 'sol/consommables/munitions')
    expect(obsoleteKeys).toContain('sol/consommables/munitions/chargeur')
    const changedRules: Record<string, { percentage: number }> = { 'sol/consommables/munitions': { percentage: 5 }, 'sol/consommables/munitions/chargeur': { percentage: 15 } }
    obsoleteKeys.forEach((key) => delete changedRules[key])
    expect(resolveShopPolicy({ rules: changedRules }, paths).percentage).toBe(5)
  })

  it('collapses a ship weapon category that repeats its type and preserves its old rules', () => {
    const duplicate = { id: 31, nom: 'Canon', type: 'cinetique', categorie: 'cinetique', taille: '2', prix: 100 }
    const distinct = { id: 32, nom: 'Missile', type: 'explosif', categorie: 'mine', taille: '2', prix: 100 }
    const secondExplosiveCategory = { id: 33, nom: 'Lance-missile', type: 'explosif', categorie: 'lance-missile', taille: '2', prix: 100 }
    const tree = shopPolicyTreeFromCatalogs({ 'ship-weapons': [duplicate, distinct, secondExplosiveCategory] })
    const paths = shopPolicyPaths('ship-weapons', duplicate)

    expect(paths).toEqual(['espace', 'espace/armes', 'espace/armes/cinetique', 'espace/armes/cinetique/2', 'espace/armes/cinetique/2/item:ship-weapons:31'])
    expect(resolveShopPolicy({ rules: { 'espace/armes/cinetique/cinetique': { percentage: 20 } } }, paths).percentage).toBe(20)
    expect(findNode(tree, 'espace/armes/cinetique/cinetique')).toBeNull()
    expect(findNode(tree, 'espace/armes/explosif/mine')?.label).toBe('mine')
    expect(legacyShopPolicyRuleKeysChangedAtNode(tree, 'espace/armes/cinetique')).toContain('espace/armes/cinetique/cinetique')
  })

  it('hides a sole ship weapon category under its type but keeps categories when there are several', () => {
    const thermalWeapons = [
      { id: 41, nom: 'Laser léger', type: 'thermique', categorie: 'cartouche', taille: '1', prix: 100 },
      { id: 42, nom: 'Laser lourd', type: 'thermique', categorie: 'cartouche', taille: '2', prix: 200 },
    ]
    const explosiveWeapons = [
      { id: 43, nom: 'Mine', type: 'explosif', categorie: 'mine', taille: '1', prix: 100 },
      { id: 44, nom: 'Lance-missile', type: 'explosif', categorie: 'lance-missile', taille: '2', prix: 200 },
    ]
    const tree = shopPolicyTreeFromCatalogs({ 'ship-weapons': [...thermalWeapons, ...explosiveWeapons] })
    const thermalType = findNode(tree, 'espace/armes/thermique')
    const thermalSize = findNode(tree, 'espace/armes/thermique/cartouche/1')
    const thermalItem = findNode(tree, 'espace/armes/thermique/cartouche/1/item:ship-weapons:41')
    const oldCategoryRule = 'espace/armes/thermique/cartouche'

    expect(thermalType?.children.map(({ label }) => label)).toEqual(['1', '2'])
    expect(findNode(tree, oldCategoryRule)).toBeNull()
    expect(findNode(tree, 'espace/armes/explosif/mine')?.label).toBe('mine')
    expect(resolveShopPolicy({ rules: { [oldCategoryRule]: { percentage: 12 } } }, shopPolicyNodePaths(
      ['espace', 'espace/armes', 'espace/armes/thermique', 'espace/armes/thermique/cartouche/1', 'espace/armes/thermique/cartouche/1/item:ship-weapons:41'],
      thermalItem!,
    )).percentage).toBe(12)

    expect(legacyShopPolicyRuleKeysInSubtree(tree, thermalSize!.key)).not.toContain(oldCategoryRule)
    const obsoleteKeys = legacyShopPolicyRuleKeysChangedAtNode(tree, 'espace/armes/thermique')
    expect(obsoleteKeys).toContain(oldCategoryRule)
    const changedRules: Record<string, { percentage: number }> = {
      [oldCategoryRule]: { percentage: 12 },
      'espace/armes/thermique': { percentage: 5 },
    }
    obsoleteKeys.forEach((key) => delete changedRules[key])
    expect(resolveShopPolicy({ rules: changedRules }, shopPolicyNodePaths(
      ['espace', 'espace/armes', 'espace/armes/thermique', 'espace/armes/thermique/cartouche/1', 'espace/armes/thermique/cartouche/1/item:ship-weapons:41'],
      thermalItem!,
    )).percentage).toBe(5)
    expect(thermalSize?.label).toBe('1')
  })
})
