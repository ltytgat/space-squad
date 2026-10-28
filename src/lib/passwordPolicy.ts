export const MIN_PASSWORD_LENGTH = 10
// Borne haute pour éviter de hacher des mots de passe démesurés.
export const MAX_PASSWORD_LENGTH = 256

export function meetsPasswordLength(password: unknown): password is string {
  return typeof password === 'string' && password.length >= MIN_PASSWORD_LENGTH && password.length <= MAX_PASSWORD_LENGTH
}

export const PASSWORD_LENGTH_ERROR = `Le mot de passe doit comporter entre ${MIN_PASSWORD_LENGTH} et ${MAX_PASSWORD_LENGTH} caractères.`
