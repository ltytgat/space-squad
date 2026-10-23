export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const MAX_EMAIL_LENGTH = 254

/** Normalizes an email address, or returns null when it is missing or malformed. */
export function normalizeEmail(value: unknown): string | null {
  const email = typeof value === 'string' ? value.trim().toLowerCase() : ''
  return email.length <= MAX_EMAIL_LENGTH && EMAIL_PATTERN.test(email) ? email : null
}
