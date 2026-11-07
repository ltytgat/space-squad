import { expect, it, vi } from 'vitest'

vi.mock('next/headers.js', () => ({ cookies: async () => ({ get: () => ({ value: '15' }) }) }))
import { getActiveCharacter } from '@/lib/activeCharacter'

it('keeps the fifteenth owned character selectable', async () => {
  const characters = Array.from({ length: 15 }, (_, index) => ({ id: index + 1, user: 7 }))
  const payload = {
    find: vi.fn(async ({ pagination, limit }: { pagination?: boolean; limit?: number }) => ({
      docs: pagination === false ? characters : characters.slice(0, limit ?? 10),
    })),
  }
  expect(await getActiveCharacter(payload, { id: 7 })).toEqual(characters[14])
})
