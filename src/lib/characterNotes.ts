export const CHARACTER_NOTES_MAX_LENGTH = 10_000

export function characterNotesLimitMessage() {
  return `Les Notes ne peuvent pas dépasser ${CHARACTER_NOTES_MAX_LENGTH.toLocaleString('fr-FR')} caractères.`
}
