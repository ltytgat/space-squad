'use client'

import { useEffect, useRef, useState } from 'react'
import { updateCharacter } from './actions'

interface KitUsageInputProps {
  characterId: number
  field: string
  initialValue: number
  maxValue: number
  onUpdate?: (field: string, value: number) => void
  disabled?: boolean
}

const KIT_USAGE_DEBOUNCE_MS = 350

export function KitUsageInput({ characterId, field, initialValue, maxValue, onUpdate, disabled }: KitUsageInputProps) {
  const [value, setValue] = useState(initialValue)
  const [isDebouncing, setIsDebouncing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const valueRef = useRef(initialValue)
  const lastSavedValueRef = useRef(initialValue)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSavingRef = useRef(false)
  const isMountedRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true
    return () => { isMountedRef.current = false }
  }, [])

  const persistLatestValue = async () => {
    if (isSavingRef.current) return
    isSavingRef.current = true
    const valueToSave = valueRef.current
    if (isMountedRef.current) setIsSaving(true)

    try {
      await updateCharacter(characterId, { [field]: valueToSave })
      lastSavedValueRef.current = valueToSave
    } catch (error) {
      console.error('Failed to update kit usage:', error)
      if (valueRef.current === valueToSave) {
        valueRef.current = lastSavedValueRef.current
        if (isMountedRef.current) {
          setValue(lastSavedValueRef.current)
          onUpdate?.(field, lastSavedValueRef.current)
        }
      }
    } finally {
      isSavingRef.current = false
      if (isMountedRef.current) setIsSaving(false)
    }
  }

  const updateValue = (delta: number) => {
    if (disabled || isSavingRef.current) return
    const newValue = Math.max(0, valueRef.current + delta)
    valueRef.current = newValue
    setValue(newValue)
    onUpdate?.(field, newValue)

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsDebouncing(true)
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null
      if (isMountedRef.current) setIsDebouncing(false)
      void persistLatestValue()
    }, KIT_USAGE_DEBOUNCE_MS)
  }

  const isLoading = isDebouncing || isSaving

  return (
    <div className={`char-kit-usage-container ${isLoading ? 'is-loading' : ''} ${disabled ? 'is-disabled' : ''}`}>
      <div className="char-kit-usage-controls">
        <button
          type="button"
          onClick={() => updateValue(-1)}
          disabled={disabled || value <= 0 || isSaving}
          className="char-kit-btn char-kit-btn-minus"
          aria-label="Retirer un usage de kit"
        >
          -
        </button>
        <div className="char-kit-display" aria-live="polite">
          <span className="char-kit-current">{value}</span>
          <span className="char-kit-separator">/</span>
          <span className="char-kit-max">{maxValue}</span>
        </div>
        <button
          type="button"
          onClick={() => updateValue(1)}
          disabled={disabled || isSaving}
          className="char-kit-btn char-kit-btn-plus"
          aria-label="Ajouter un usage de kit"
        >
          +
        </button>
      </div>
    </div>
  )
}
