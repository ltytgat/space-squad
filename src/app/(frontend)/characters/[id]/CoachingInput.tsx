'use client'

import { useState, useTransition, useEffect } from 'react'
import { updateCharacter } from './actions'

interface CoachingInputProps {
  characterId: number
  field: string
  initialValue: number
  maxValue: number
  disabled?: boolean
}

export function CoachingInput({ characterId, field, initialValue, maxValue, disabled }: CoachingInputProps) {
  const [value, setValue] = useState(initialValue)
  const [inputValue, setInputValue] = useState(String(initialValue))
  const [isPending, startTransition] = useTransition()

  // Mettre à jour l'état local si la prop change (ex: revalidation)
  useEffect(() => {
    setValue(initialValue)
    setInputValue(String(initialValue))
  }, [initialValue])

  const handleUpdate = (newVal: number) => {
    if (newVal < 0) newVal = 0
    setValue(newVal)
    setInputValue(String(newVal))
    
    startTransition(async () => {
      try {
        await updateCharacter(characterId, { [field]: newVal })
      } catch (err) {
        console.error('Failed to update coaching value:', err)
      }
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handleInputBlur = () => {
    const newVal = parseInt(inputValue, 10)
    if (!isNaN(newVal) && newVal !== value) {
      handleUpdate(newVal)
    } else {
      setInputValue(String(value))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    }
  }

  return (
    <div className={`char-coaching-input-container ${isPending ? 'is-loading' : ''} ${disabled ? 'is-disabled' : ''}`}>
      <div className="char-coaching-controls">
        <button 
          type="button"
          onClick={() => handleUpdate(value - 1)} 
          disabled={disabled || value <= 0 || isPending}
          className="char-coaching-btn"
        >
          -
        </button>
        <div className="char-coaching-display">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            disabled={disabled || isPending}
            className="char-coaching-value-input"
          />
          <span className="char-coaching-separator">/</span>
          <span className="char-coaching-max">{maxValue}</span>
        </div>
        <button 
          type="button"
          onClick={() => handleUpdate(value + 1)} 
          disabled={disabled || isPending}
          className="char-coaching-btn"
        >
          +
        </button>
      </div>
    </div>
  )
}
