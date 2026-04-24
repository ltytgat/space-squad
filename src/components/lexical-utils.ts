export type TocEntry = {
  level: number
  text: string
  id: string
}

export type LexicalNode = {
  type: string
  tag?: string
  text?: string
  children?: LexicalNode[]
  [key: string]: unknown
}

export function slugifyHeading(text: string): string {
  const slug = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
  return slug || 'section'
}

export function extractNodeText(node: LexicalNode): string {
  if (node.type === 'text') return node.text ?? ''
  return node.children?.map(extractNodeText).join('') ?? ''
}

/**
 * Extracts all headings from a Lexical root node, in document order.
 * Generates unique IDs (handles duplicate heading texts with a counter suffix).
 */
export function extractHeadings(root: LexicalNode): TocEntry[] {
  const entries: TocEntry[] = []
  const idCounts: Record<string, number> = {}

  function walk(node: LexicalNode) {
    if (node.type === 'heading' && node.tag) {
      const level = parseInt(node.tag.replace('h', ''), 10)
      const text = extractNodeText(node)
      const baseId = slugifyHeading(text)

      const count = idCounts[baseId] ?? 0
      idCounts[baseId] = count + 1
      const id = count === 0 ? baseId : `${baseId}-${count}`

      entries.push({ level, text, id })
    }

    node.children?.forEach(walk)
  }

  walk(root)
  return entries
}
