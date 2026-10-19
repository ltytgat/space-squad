'use client'

import { useState } from 'react'
import styles from './LoreUnitConverter.module.css'

const conversions = [
  {
    key: 'yearToCycle',
    from: 'Année',
    to: 'Cycle',
    convert: (value: number) => (8766 / 9375) * (value - 2220),
  },
  {
    key: 'cycleToYear',
    from: 'Cycle',
    to: 'Année',
    convert: (value: number) => 2220 + (value * 9375) / 8766,
  },
  {
    key: 'ageToCycle',
    from: 'Âge',
    to: 'Cycle',
    convert: (value: number) => (8766 / 9375) * value,
  },
] as const

type ConversionKey = (typeof conversions)[number]['key']

const numberFormat = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function parseInput(value: string): number | null {
  const normalized = value.trim().replace(',', '.')

  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return null

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

export function LoreUnitConverter() {
  const [values, setValues] = useState<Record<ConversionKey, string>>({
    yearToCycle: '',
    cycleToYear: '',
    ageToCycle: '',
  })

  return (
    <section className={styles.panel} aria-labelledby="lore-unit-converter-title">
      <h2 className={styles.title} id="lore-unit-converter-title">
        Calculateur
      </h2>

      {conversions.map((conversion) => {
        const inputId = `lore-unit-converter-${conversion.key}`
        const inputValue = values[conversion.key]
        const parsedValue = parseInput(inputValue)
        const result = parsedValue === null ? '' : numberFormat.format(conversion.convert(parsedValue))

        return (
          <div className={styles.conversion} key={conversion.key}>
            <h3 className={styles.direction}>
              {conversion.from} → {conversion.to}
            </h3>
            <div className={styles.row}>
              <label className={styles.label} htmlFor={inputId}>
                {conversion.from}
                <input
                  autoComplete="off"
                  className={styles.input}
                  id={inputId}
                  inputMode="decimal"
                  onChange={(event) => {
                    const nextValue = event.currentTarget.value
                    setValues((current) => ({ ...current, [conversion.key]: nextValue }))
                  }}
                  type="text"
                  value={inputValue}
                />
              </label>
              <div className={styles.resultContainer}>
                <span className={styles.label} id={`${inputId}-result-label`}>
                  {conversion.to}
                </span>
                <output
                  aria-labelledby={`${inputId}-result-label`}
                  aria-live="polite"
                  className={styles.result}
                  htmlFor={inputId}
                >
                  {result}
                </output>
              </div>
            </div>
          </div>
        )
      })}
    </section>
  )
}
