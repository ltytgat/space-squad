'use client'

import { useEffect, useState } from 'react'

export type ShopItemDetail = { label: string; value: string }

export function ShopItemDetailsButton({
  name,
  category,
  image,
  details = [],
}: {
  name: string
  category?: string | null
  image?: { url: string; alt: string } | null
  details?: ShopItemDetail[]
}) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  return <>
    <button
      type="button"
      className="shop-item-details-trigger"
      aria-label={`Afficher la fiche détaillée de ${name}`}
      title="Afficher la fiche détaillée"
      onClick={() => setOpen(true)}
    >
      <span aria-hidden="true">i</span>
    </button>
    {open && <div className="shop-details-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) setOpen(false)
    }}>
      <section className="shop-details-dialog" role="dialog" aria-modal="true" aria-labelledby="shop-details-title">
        <button type="button" className="shop-details-close" aria-label="Fermer la fiche détaillée" onClick={() => setOpen(false)}>×</button>
        {image && <img className="shop-details-image" src={image.url} alt={image.alt || name} />}
        {category && <div className="shop-item-type">{category}</div>}
        <h2 id="shop-details-title">{name}</h2>
        {details.length > 0
          ? <dl className="shop-details-list">{details.map((detail, index) => <div key={`${detail.label}-${index}`}><dt>{detail.label}</dt><dd>{detail.value}</dd></div>)}</dl>
          : <p className="shop-details-empty">Aucune statistique supplémentaire renseignée.</p>}
      </section>
    </div>}
  </>
}
