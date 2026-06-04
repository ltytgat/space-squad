'use client'

import { useState, useTransition } from 'react'
import { updateMalus } from './actions'

interface MalusInputProps {
  characterId: number
  field: string
  initialValue: number
}

export function MalusInput({ characterId, field, initialValue }: MalusInputProps) {
  const [value, setValue] = useState(initialValue)
  const [isPending, startTransition] = useTransition()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = parseInt(e.target.value) || 0
    setValue(newVal)
    
    startTransition(async () => {
      try {
        await updateMalus(characterId, field, newVal)
      } catch (err) {
        console.error('Failed to update malus:', err)
        // Optionnel: remettre l'ancienne valeur en cas d'erreur
      }
    })
  }

  return (
    <div className={`char-malus-input-container ${isPending ? 'is-loading' : ''}`}>
      <input
        type="number"
        min="0"
        value={value}
        onChange={handleChange}
        className="char-malus-input"
        title="Modifier le malus (Admin)"
      />
    </div>
  )
}
