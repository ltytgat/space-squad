import { cookies } from 'next/headers.js'

export const ACTIVE_CHARACTER_COOKIE = 'space-squad-character'

const activeCharacterCookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
})

export async function setActiveCharacterCookie(characterId: number | string) {
  ;(await cookies()).set(ACTIVE_CHARACTER_COOKIE, String(characterId), activeCharacterCookieOptions())
}

export async function clearActiveCharacterCookie() {
  ;(await cookies()).delete(ACTIVE_CHARACTER_COOKIE)
}

export async function getOwnedCharacters(
  payload: any,
  user: any,
  { depth = 0, req }: { depth?: number; req?: any } = {},
) {
  if (!user?.id) return []
  const { docs } = await payload.find({
    collection: 'characters',
    where: { user: { equals: user.id } },
    depth,
    limit: 10,
    sort: 'id',
    overrideAccess: true,
    ...(req ? { req } : {}),
  })
  return docs as any[]
}

/** The cookie selects a view; ownership is always resolved from the database. */
export async function getActiveCharacter(
  payload: any,
  user: any,
  options: { depth?: number; req?: any } = {},
) {
  const characters = await getOwnedCharacters(payload, user, options)
  if (!characters.length) return null

  const selectedId = (await cookies()).get(ACTIVE_CHARACTER_COOKIE)?.value
  return characters.find((character) => String(character.id) === selectedId) ?? characters[0]
}
