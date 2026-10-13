export function isCharacterCreationComplete(character: { creationEtape?: unknown } | null | undefined): boolean {
  return !character?.creationEtape || character.creationEtape === 'termine'
}

export function assertCharacterCreationComplete(character: { creationEtape?: unknown } | null | undefined): void {
  if (!isCharacterCreationComplete(character)) {
    throw new Error('Terminez le parcours de création de votre personnage avant de poursuivre.')
  }
}
