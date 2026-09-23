import { describe, expect, it } from 'vitest'
import type { LoreArticle } from '@/payload-types'
import { extractLorePlainText } from '@/lib/loreSearch'

function content(children: LoreArticle['content']['root']['children']): LoreArticle['content'] {
  return { root: { type: 'root', version: 1, direction: null, format: '', indent: 0, children } }
}

const text = (value: string) => ({ type: 'text', version: 1, text: value })

describe('lore search plaintext', () => {
  it('handles missing and empty content', () => {
    expect(extractLorePlainText(undefined)).toBe('')
    expect(extractLorePlainText(null)).toBe('')
    expect(extractLorePlainText(content([]))).toBe('')
  })

  it('preserves inline text and separates headings, paragraphs and list items', () => {
    expect(
      extractLorePlainText(
        content([
          { type: 'heading', version: 1, children: [text('Histoire')] },
          {
            type: 'paragraph',
            version: 1,
            children: [
              text('La '),
              {
                type: 'link',
                version: 1,
                fields: { url: 'https://example.com' },
                children: [text('Fédération')],
              },
              text(' galactique.'),
            ],
          },
          {
            type: 'list',
            version: 1,
            children: [
              { type: 'listitem', version: 1, children: [text('Terre')] },
              { type: 'listitem', version: 1, children: [text('Mars')] },
            ],
          },
        ]),
      ),
    ).toBe('Histoire\n\nLa Fédération galactique.\n\nTerre\nMars')
  })

  it('indexes key/value blocks without including their internal metadata', () => {
    expect(
      extractLorePlainText(
        content([
          {
            type: 'block',
            version: 2,
            fields: {
              blockType: 'keyValue',
              id: 'internal-id',
              rows: [
                { key: 'Capitale', value: 'Paris' },
                { key: 'Planète', value: 'Terre' },
              ],
            },
          },
        ]),
      ),
    ).toBe('Capitale: Paris\nPlanète: Terre')
  })
})
