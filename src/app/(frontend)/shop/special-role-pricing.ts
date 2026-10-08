export type SpecialRoleOffer = {
  id: number
  nom: string
  description?: string
  prix?: number | null
}

export function specialRoleQuote(role: SpecialRoleOffer, character: { konis?: number | null; rolesSpeciaux?: { id: number }[] | null }) {
  const price = typeof role.prix === 'number' && Number.isSafeInteger(role.prix) && role.prix >= 0
    ? role.prix
    : Number.POSITIVE_INFINITY
  const balance = typeof character.konis === 'number' && Number.isFinite(character.konis) ? character.konis : 0
  const owned = character.rolesSpeciaux?.some((entry) => Number(entry.id) === role.id) ?? false
  const reasons: string[] = []
  if (!Number.isFinite(price)) reasons.push('Le prix configuré est invalide.')
  if (owned) reasons.push('Votre personnage possède déjà ce rôle.')
  if (price > balance) reasons.push('Pas assez de Konis.')
  return { price, balance, owned, canBuy: reasons.length === 0, reasons }
}
