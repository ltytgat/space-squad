'use client'

import { useEffect, useRef, useState } from 'react'
import type { TocEntry } from './lexical-utils'

export function LoreToc({ entries }: { entries: TocEntry[] }) {
  const [activeId, setActiveId] = useState<string>('')
  const headingRefs = useRef<HTMLElement[]>([])

  useEffect(() => {
    if (!entries.length) return

    // Collect heading elements in document order
    headingRefs.current = entries
      .map(({ id }) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)

    const HEADER_OFFSET = 80 // header height + small margin

    const onScroll = () => {
      const scrollY = window.scrollY + HEADER_OFFSET
      let currentId = headingRefs.current[0]?.id ?? ''

      for (const el of headingRefs.current) {
        if (el.offsetTop <= scrollY) {
          currentId = el.id
        } else {
          break
        }
      }

      setActiveId(currentId)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll() // état initial

    return () => window.removeEventListener('scroll', onScroll)
  }, [entries])

  if (!entries.length) return null

  // Niveau minimum des headings présents (pour l'indentation relative)
  const minLevel = Math.min(...entries.map((e) => e.level))

  return (
    <nav className="lore-toc" aria-label="Sommaire de l'article">
      <h4 className="lore-toc-title">Dans cet article</h4>
      <ol className="lore-toc-list">
        {entries.map(({ level, text, id }) => (
          <li
            key={id}
            className="lore-toc-item"
            style={{ paddingLeft: `${(level - minLevel) * 0.75}rem` }}
          >
            <a
              href={`#${id}`}
              className={`lore-toc-link${activeId === id ? ' lore-toc-link-active' : ''}`}
              onClick={(e) => {
                e.preventDefault()
                const target = document.getElementById(id)
                if (target) {
                  const top = target.getBoundingClientRect().top + window.scrollY - 80
                  window.scrollTo({ top, behavior: 'smooth' })
                  setActiveId(id)
                }
              }}
            >
              {text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
