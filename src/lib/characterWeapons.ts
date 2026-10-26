export type CharacterWeaponSlot = 'armePrincipale' | 'armeSecondaire' | 'armeLourde' | 'armeDeMelee'

export function weaponFromGroup(group: any) {
  if (!group || typeof group !== 'object') return null

  if (group.customItem) {
    const customItem = group.customItem
    const properties = customItem.proprietesFigees
    if (!properties || typeof properties !== 'object') return null
    const customTypes = typeof customItem.typeArme === 'string'
      ? customItem.typeArme.split(',').filter(Boolean)
      : properties.type
    return {
      ...properties,
      id: customItem.id,
      nom: customItem.nom ?? properties.nom,
      categorie: customItem.categorie ?? properties.categorie,
      type: Array.isArray(customTypes) ? customTypes : [],
      image: properties.image && typeof properties.image === 'object'
        ? properties.image
        : customItem.armeSource?.image ?? null,
    }
  }

  if (Object.prototype.hasOwnProperty.call(group, 'item')) {
    return group.item && typeof group.item === 'object' ? group.item : null
  }

  return typeof group.categorie === 'string' && group.categorie ? group : null
}

export function weaponAllowedInSlot(category: unknown, slot: CharacterWeaponSlot): boolean {
  if (typeof category !== 'string' || !category) return false
  if (slot === 'armeLourde') return category === 'lourde'
  if (slot === 'armeDeMelee') return category === 'melee'
  return category !== 'lourde' && category !== 'melee'
}
