import React from 'react'
import { slugifyHeading, extractNodeText, type LexicalNode } from './lexical-utils'

type LexicalContent = {
  root: LexicalNode
  [key: string]: unknown
}

// Tracks duplicate heading IDs within a single render
function makeIdTracker() {
  const counts: Record<string, number> = {}
  return (baseId: string): string => {
    const count = counts[baseId] ?? 0
    counts[baseId] = count + 1
    return count === 0 ? baseId : `${baseId}-${count}`
  }
}

function createRenderer(nextId: (base: string) => string) {
  function renderNode(node: LexicalNode, index: number): React.ReactNode {
    const key = index

    switch (node.type) {
      case 'root':
        return (
          <React.Fragment key={key}>
            {node.children?.map((child, i) => renderNode(child, i))}
          </React.Fragment>
        )

      case 'paragraph': {
        const children = node.children?.map((child, i) => renderNode(child, i))
        const isEmpty = !children?.some(Boolean)
        if (isEmpty) return <br key={key} />
        return <p key={key}>{children}</p>
      }

      case 'heading': {
        const Tag = node.tag as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
        const text = extractNodeText(node)
        const id = nextId(slugifyHeading(text))
        return (
          <Tag key={key} id={id}>
            {node.children?.map((child, i) => renderNode(child, i))}
          </Tag>
        )
      }

      case 'text': {
        if (!node.text) return null
        let content: React.ReactNode = node.text
        const fmt = typeof node.format === 'number' ? node.format : 0
        if (fmt & 1) content = <strong>{content}</strong>   // gras
        if (fmt & 2) content = <em>{content}</em>            // italique
        if (fmt & 4) content = <s>{content}</s>              // barré
        if (fmt & 8) content = <u>{content}</u>              // souligné
        if (fmt & 16) content = <code>{content}</code>       // code inline
        return <React.Fragment key={key}>{content}</React.Fragment>
      }

      case 'linebreak':
        return <br key={key} />

      case 'list': {
        const Tag = node.listType === 'bullet' ? 'ul' : 'ol'
        return (
          <Tag key={key}>
            {node.children?.map((child, i) => renderNode(child, i))}
          </Tag>
        )
      }

      case 'listitem':
        return (
          <li key={key}>
            {node.children?.map((child, i) => renderNode(child, i))}
          </li>
        )

      case 'quote':
        return (
          <blockquote key={key}>
            {node.children?.map((child, i) => renderNode(child, i))}
          </blockquote>
        )

      case 'horizontalrule':
        return <hr key={key} />

      case 'link': {
        const url = node.fields?.url ?? '#'
        const newTab = node.fields?.newTab
        return (
          <a
            key={key}
            href={url as string}
            {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            {node.children?.map((child, i) => renderNode(child, i))}
          </a>
        )
      }

      default:
        if (node.children) {
          return (
            <React.Fragment key={key}>
              {node.children.map((child, i) => renderNode(child, i))}
            </React.Fragment>
          )
        }
        return null
    }
  }

  return renderNode
}

export function LexicalRenderer({ content }: { content: LexicalContent | null | undefined }) {
  if (!content?.root) return null
  const renderNode = createRenderer(makeIdTracker())
  return <>{renderNode(content.root, 0)}</>
}
