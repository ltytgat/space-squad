export const MAX_PLAYER_CHARACTERS = 5
export const MAX_NPC_CHARACTERS = 10

export function countCharacterTypes(characters: readonly { typePersonnage?: unknown }[]) {
  const pnj = characters.filter((character) => character.typePersonnage === 'pnj').length
  return { joueur: characters.length - pnj, pnj }
}
