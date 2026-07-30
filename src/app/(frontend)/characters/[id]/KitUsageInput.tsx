'use client'

import { useState, useTransition } from 'react'
import { updateCharacter } from './actions'

interface KitUsageInputProps {
  characterId: number
  field: string
  initialValue: number
  maxValue: number
  onUpdate?: (field: string, value: number) => void
  disabled?: boolean
}

export function KitUsageInput({ characterId, field, initialValue, maxValue, onUpdate, disabled }: KitUsageInputProps) {
  const [value, setValue] = useState(initialValue)
  const [isPending, startTransition] = useTransition()

  const updateValue = (newVal: number) => {
    if (newVal < 0) newVal = 0
    // On ne bloque pas forcément le max car l'énoncé dit "suivi libre"
    
    setValue(newVal)
    if (onUpdate) onUpdate(field, newVal)
    
    startTransition(async () => {
      try {
        await updateCharacter(characterId, { [field]: newVal })
      } catch (err) {
        console.error('Failed to update kit usage:', err)
      }
    })
  }

  return (
    <div className={`char-kit-usage-container ${isPending ? 'is-loading' : ''} ${disabled ? 'is-disabled' : ''}`}>
      <div className="char-kit-usage-controls">
        <button 
          onClick={() => updateValue(value - 1)} 
          disabled={disabled || value <= 0 || isPending}
          className="char-kit-btn char-kit-btn-minus"
        >
          -
        </button>
        <div className="char-kit-display">
          <span className="char-kit-current">{value}</span>
          <span className="char-kit-separator">/</span>
          <span className="char-kit-max">{maxValue}</span>
        </div>
        <button 
          onClick={() => updateValue(value + 1)} 
          disabled={disabled || isPending}
          className="char-kit-btn char-kit-btn-plus"
        >
          +
        </button>
      </div>
    </div>
  )
}
