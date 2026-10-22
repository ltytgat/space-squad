'use client'

import { useState } from 'react'
import { setActiveMode } from '@/app/(frontend)/role-actions'

export function RoleModeSwitch({ activeMode }: { activeMode: 'player' | 'mj' }) {
  const [pending, setPending] = useState(false)
  const target = activeMode === 'mj' ? 'player' : 'mj'

  async function switchMode() {
    setPending(true)
    const result = await setActiveMode(target)
    if (result.success) window.location.reload()
    setPending(false)
  }

  return <button type="button" className="ss-btn ss-btn-outline" onClick={switchMode} disabled={pending}>
    {pending ? 'Changement…' : target === 'mj' ? 'Mode MJ' : 'Mode joueur'}
  </button>
}
