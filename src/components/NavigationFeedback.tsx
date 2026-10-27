'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

const SHOW_DELAY_MS = 140
const MAX_VISIBLE_MS = 60_000
const NAVIGATION_START_EVENT = 'ss:navigation-start'

export function NavigationFeedback() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const locationKey = `${pathname}?${searchParams.toString()}`
  const previousLocation = useRef(locationKey)
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const slowTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [visible, setVisible] = useState(false)
  const [slow, setSlow] = useState(false)

  const clearTimers = useCallback(() => {
    if (showTimer.current) clearTimeout(showTimer.current)
    if (slowTimer.current) clearTimeout(slowTimer.current)
    if (safetyTimer.current) clearTimeout(safetyTimer.current)
    showTimer.current = null
    slowTimer.current = null
    safetyTimer.current = null
  }, [])

  const beginNavigation = useCallback(() => {
    clearTimers()
    showTimer.current = setTimeout(() => setVisible(true), SHOW_DELAY_MS)
    slowTimer.current = setTimeout(() => setSlow(true), 8_000)
    safetyTimer.current = setTimeout(() => {
      setVisible(false)
      setSlow(false)
      clearTimers()
    }, MAX_VISIBLE_MS)
  }, [clearTimers])

  useEffect(() => {
    if (previousLocation.current !== locationKey) {
      previousLocation.current = locationKey
      clearTimers()
      setVisible(false)
      setSlow(false)
    }
  }, [clearTimers, locationKey])

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const target = event.target
      if (!(target instanceof Element)) return
      const link = target.closest('a[href]')
      if (!(link instanceof HTMLAnchorElement) || link.hasAttribute('download') || (link.target && link.target !== '_self')) return

      const destination = new URL(link.href, window.location.href)
      if (destination.origin !== window.location.origin) return
      if (destination.pathname === window.location.pathname && destination.search === window.location.search) return
      beginNavigation()
    }

    function handlePopState() {
      beginNavigation()
    }

    function handleProgrammaticNavigation() {
      beginNavigation()
    }

    document.addEventListener('click', handleClick, true)
    window.addEventListener('popstate', handlePopState)
    window.addEventListener(NAVIGATION_START_EVENT, handleProgrammaticNavigation)
    return () => {
      document.removeEventListener('click', handleClick, true)
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener(NAVIGATION_START_EVENT, handleProgrammaticNavigation)
      clearTimers()
    }
  }, [beginNavigation, clearTimers])

  if (!visible) return null

  return <div className="ss-navigation-feedback" role="status" aria-live="polite" aria-atomic="true">
    <span className="ss-navigation-feedback-bar" aria-hidden="true" />
    <span className="ss-sr-only">{slow ? 'Le serveur met plus de temps que prévu. Merci de patienter.' : 'Chargement de la page…'}</span>
  </div>
}

export function announceNavigationStart() {
  window.dispatchEvent(new Event(NAVIGATION_START_EVENT))
}
