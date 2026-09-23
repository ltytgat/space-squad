'use client'

import { useEffect, useRef, useState } from 'react'

export type HeatTarget = { key: string; label: string; heat: number; maxHeat: number }
export const roundHeat = (value: number) => Math.round(value * 100) / 100

export function HeatRedistribution({ targets, budget, initial, onApply, onClose }: {
  targets: HeatTarget[]
  budget: number
  initial: Record<string, number>
  onApply: (values: Record<string, number>) => void
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [values, setValues] = useState(initial)
  const total = roundHeat(targets.reduce((sum, target) => sum + (values[target.key] ?? 0), 0))
  const remaining = roundHeat(budget - total)
  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [])
  const allocate = (key: string, amount: number) => {
    if (!Number.isFinite(amount)) return
    setValues((current) => {
      const other = targets.reduce((sum, target) => sum + (target.key === key ? 0 : current[target.key] ?? 0), 0)
      return { ...current, [key]: roundHeat(Math.max(0, Math.min(amount, budget - other))) }
    })
  }
  return (
    <dialog ref={dialog} className="ship-selector-modal ship-heat-dialog" aria-labelledby="ship-heat-title"
      onCancel={onClose} onClick={(event) => { if (event.target === dialog.current) onClose() }}>
      <div className="ship-selector-header">
        <h3 id="ship-heat-title">Rediriger la chaleur</h3>
        <button type="button" onClick={onClose} aria-label="Fermer">×</button>
      </div>
      <p>{budget} MJ disponibles · 1 de consommation = 100 MJ</p>
      <p className="ship-muted">Chaque validation ajoute la chaleur répartie aux armes sélectionnées.</p>
      {!targets.length && <p>Aucune arme thermique installée.</p>}
      <div className="ship-heat-targets">
        {targets.map((target) => {
          const selected = Object.hasOwn(values, target.key)
          const amount = values[target.key] ?? 0
          const projected = roundHeat(target.heat + amount)
          return (
            <div className="ship-heat-target" key={target.key}>
              <label><input type="checkbox" checked={selected} onChange={(event) => {
                const checked = event.target.checked
                setValues((current) => {
                  const next = { ...current }
                  if (checked) next[target.key] = 0
                  else delete next[target.key]
                  return next
                })
              }} /> {target.label}</label>
              <div className="ship-heat-slider">
                <input aria-label={`Chaleur pour ${target.label}`} type="range" min="0" max={budget} step="0.01"
                  disabled={!selected} value={amount} onChange={(event) => allocate(target.key, Number(event.target.value))} />
                <input aria-label={`MJ pour ${target.label}`} type="number" min="0" max={roundHeat(amount + remaining)} step="0.01"
                  disabled={!selected} value={amount} onChange={(event) => allocate(target.key, Number(event.target.value))} />
                <span>MJ</span>
              </div>
              <small>Chauffe après redirection : {projected} / {target.maxHeat || '—'} MJ</small>
              {target.maxHeat > 0 && projected > target.maxHeat && <small className="ship-heat-warning">Capacité de la cartouche dépassée de {roundHeat(projected - target.maxHeat)} MJ</small>}
            </div>
          )
        })}
      </div>
      <p aria-live="polite">{total} MJ répartis · {remaining} MJ non redirigés</p>
      <div className="ship-heat-actions">
        <button type="button" className="ss-button" onClick={onClose}>Annuler</button>
        <button type="button" className="ss-button primary" disabled={!targets.length || remaining < 0}
          onClick={() => onApply(values)}>Appliquer</button>
      </div>
    </dialog>
  )
}
