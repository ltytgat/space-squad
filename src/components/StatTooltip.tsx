export type StatTooltipData = {
  label: string
  formula: string
  components: { label: string; value: number | string; sub?: string }[]
}

export function StatTooltip({ data }: { data: StatTooltipData }) {
  return <div className="char-stat-tooltip">
    <div className="char-stat-tooltip-header"><strong>Détail : {data.label}</strong></div>
    <div className="char-stat-tooltip-formula"><div className="char-stat-tooltip-section-title">Formule</div><code>{data.formula}</code></div>
    <div className="char-stat-tooltip-components"><div className="char-stat-tooltip-section-title">Composants</div>{data.components.map((component, index) => <div key={index} className="char-stat-tooltip-component"><span className="char-stat-tooltip-component-label">{component.label}</span><span className="char-stat-tooltip-component-value">{Number(component.value) >= 0 ? `+${component.value}` : component.value}</span>{component.sub && <div className="char-stat-tooltip-component-sub">{component.sub}</div>}</div>)}</div>
  </div>
}
