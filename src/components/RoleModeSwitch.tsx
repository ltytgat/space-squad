'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { setActiveMode } from '@/app/(frontend)/role-actions'

export function RoleModeSwitch({ activeMode }: { activeMode: 'player' | 'mj' }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const requestInFlight = useRef(false)
  const target = activeMode === 'mj' ? 'player' : 'mj'

  useEffect(() => {
    requestInFlight.current = false
  }, [activeMode])

  function switchMode() {
    if (requestInFlight.current) return
    requestInFlight.current = true
    setError('')

    startTransition(async () => {
      try {
        const result = await setActiveMode(target)
        if (!result.success) {
          setError('Le changement de mode a échoué. Réessayez.')
          requestInFlight.current = false
        }
        // La mise à jour du cookie dans l'action serveur relance le rendu Next.js.
      } catch {
        setError('Le changement de mode a échoué. Réessayez.')
        requestInFlight.current = false
      }
    })
  }

  return <>
    <button type="button" className="ss-btn ss-btn-outline" onClick={switchMode} disabled={pending}>
      {pending ? 'Changement…' : target === 'mj' ? 'Mode MJ' : 'Mode joueur'}
    </button>
    {error && <span role="alert" style={{ color: '#ff8b8b', fontSize: '.75rem', marginLeft: '.5rem' }}>{error}</span>}
  </>
}
