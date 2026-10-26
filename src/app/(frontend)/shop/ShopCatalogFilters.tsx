'use client'

export type ShopCatalogFilterOption = {
  value: string
  label: string
}

export function normalizeShopCatalogText(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr-FR')
}

export function ShopCatalogFilters({
  query,
  onQueryChange,
  classValue,
  onClassChange,
  classOptions,
  typeValue,
  onTypeChange,
  typeLabel,
  allTypesLabel,
  typeOptions,
  hasFilters,
  onReset,
}: {
  query: string
  onQueryChange: (value: string) => void
  classValue: string
  onClassChange: (value: string) => void
  classOptions: ShopCatalogFilterOption[]
  typeValue: string
  onTypeChange: (value: string) => void
  typeLabel: string
  allTypesLabel: string
  typeOptions: ShopCatalogFilterOption[]
  hasFilters: boolean
  onReset: () => void
}) {
  return <div className="shop-filters shop-catalog-filters" role="search" aria-label="Filtres du catalogue">
    <label>Nom du modèle<input type="search" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Rechercher un modèle…" /></label>
    <label>Classe<select value={classValue} onChange={(event) => onClassChange(event.target.value)}>
      <option value="all">Toutes les classes</option>
      {classOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select></label>
    <label>{typeLabel}<select value={typeValue} onChange={(event) => onTypeChange(event.target.value)}>
      <option value="all">{allTypesLabel}</option>
      {typeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select></label>
    {hasFilters && <button type="button" className="shop-catalog-filter-reset" onClick={onReset}>Effacer les filtres</button>}
  </div>
}
