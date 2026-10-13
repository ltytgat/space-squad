type CharacterCreationState = {
  creationEtape?: unknown
  nom?: unknown
  force?: unknown
  habilite?: unknown
  connaissances?: unknown
  culture?: unknown
  anticipation?: unknown
  perception?: unknown
}

function isFilledLegacyCharacter(character: CharacterCreationState): boolean {
  const hasName = typeof character.nom === 'string' && character.nom.trim().length > 0
  const abilities = [
    character.force,
    character.habilite,
    character.connaissances,
    character.culture,
    character.anticipation,
    character.perception,
  ]
  return hasName && abilities.every((value) => typeof value === 'number' && Number.isFinite(value) && value > 0)
}

export function isCharacterCreationComplete(character: CharacterCreationState | null | undefined): boolean {
  const step = character?.creationEtape
  if (!step || step === 'termine') return true

  // Older character records may receive the collection's former default stage.
  // A named sheet with all six assigned attributes is an existing character.
  return step === 'caracteristiques' && isFilledLegacyCharacter(character)
}

export function assertCharacterCreationComplete(character: CharacterCreationState | null | undefined): void {
  if (!isCharacterCreationComplete(character)) {
    throw new Error('Terminez le parcours de création de votre personnage avant de poursuivre.')
  }
}
