import { convertLexicalToPlaintext } from '@payloadcms/richtext-lexical/plaintext'
import type { LoreArticle } from '@/payload-types'

export function extractLorePlainText(content: LoreArticle['content'] | null | undefined): string {
  if (!content) return ''

  return convertLexicalToPlaintext({
    data: content,
    converters: {
      blocks: {
        keyValue: ({ node }) => {
          const { rows } = node.fields as { rows?: { key: string; value: string }[] }
          return `\n${(rows ?? []).map(({ key, value }) => `${key}: ${value}`).join('\n')}\n`
        },
      },
    },
  }).trim()
}
