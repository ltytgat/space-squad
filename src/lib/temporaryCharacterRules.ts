const TEMP_CHARACTER_FIELDS = new Set([
  'competences', 'competencesSpeciales', 'armureTete', 'armureTorse', 'armureBras', 'armureJambes', 'armureBackpack',
  'armePrincipale', 'armeSecondaire', 'armeLourde', 'armeDeMelee', 'puceMk1', 'puceMk2', 'puceMk3',
  'consommableEquipe1', 'consommableEquipe2', 'consommableEquipe3', 'consommablesEquipes',
  'inventaireArmes', 'inventaireArmures', 'inventaire', 'inventaireMods', 'inventairePuces',
  'utilisationsKitsReparation', 'utilisationsKitsSoins', 'pointsDeCompetence',
])

function assertValueLimits(value: unknown, maxItems: number, depth = 0): void {
  if (depth > 16) throw new Error('Les données de la fiche sont trop imbriquées.')
  if (typeof value === 'string' && value.length > 4_000) throw new Error('Un champ texte de la fiche est trop long.')
  if (Array.isArray(value)) {
    if (value.length > maxItems) throw new Error('La liste contient trop d’éléments.')
    value.forEach((entry) => assertValueLimits(entry, maxItems, depth + 1))
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((entry) => assertValueLimits(entry, maxItems, depth + 1))
  }
}

export function validateTemporaryCharacterUpdate(
  data: any,
  character: any,
  limits: { maxArrayItems: number; maxCustomSkills: number; maxPayloadBytes?: number },
) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Données de fiche invalides.')
  const serialized = JSON.stringify(data)
  if (new TextEncoder().encode(serialized).byteLength > (limits.maxPayloadBytes ?? 128_000)) {
    throw new Error('Les données envoyées dépassent la taille autorisée pour une fiche temporaire.')
  }
  for (const [key, value] of Object.entries(data)) {
    if (!TEMP_CHARACTER_FIELDS.has(key) && !/^coaching(?:Force|Habilite|Connaissances|Culture|Anticipation|Perception)Value$/.test(key)) {
      throw new Error('Cette propriété ne peut pas être modifiée dans une fiche temporaire.')
    }
    assertValueLimits(value, limits.maxArrayItems)
  }
  if (Array.isArray(data.competencesSpeciales) && data.competencesSpeciales.length > limits.maxCustomSkills) {
    throw new Error('La fiche temporaire ne peut pas contenir autant de compétences personnalisées.')
  }
  const totalInventory = ['inventaireArmes', 'inventaireArmures', 'inventaire', 'inventaireMods', 'inventairePuces']
    .reduce((total, field) => {
      const value = Object.prototype.hasOwnProperty.call(data, field) ? data[field] : character?.[field]
      return total + (Array.isArray(value) ? value.length : 0)
    }, 0)
  if (totalInventory > limits.maxArrayItems) throw new Error('L’inventaire temporaire dépasse sa limite.')
}

export function stripTemporaryWorkspaceSecrets<T>(value: T): T {
  if (Array.isArray(value)) return value.map(stripTemporaryWorkspaceSecrets) as T
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !['workspace', 'tokenHash', 'createdFromHash', 'requestCount', 'requestWindowStartedAt'].includes(key))
    .map(([key, child]) => [key, stripTemporaryWorkspaceSecrets(child)])) as T
}
