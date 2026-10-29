'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { adjustedShopPrice, resolveShopPolicy, summarizeShopPolicyImpacts, type GroupShopPolicy, type GroupShopRule, type ShopPolicyNode } from '@/lib/groupShopPolicy'
import { readShopPrice } from '@/lib/shop'
import { saveGroupShopPolicy } from '../../group-policy-actions'

const money = (value: number) => `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 4 }).format(value)} Konis`

function priceLabel(value: number | string | null, format: ShopPolicyNode['priceFormat']) {
  const amount = readShopPrice(value)
  if (amount === null) return 'Non commercialisable'
  if (format === 'weapon-factor') {
    return `${new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 2 }).format(amount)} du prix de l’arme`
  }
  return money(amount)
}

function removeSubtreeRules(rules: Record<string, GroupShopRule>, key: string) {
  return Object.fromEntries(Object.entries(rules).filter(([target]) => target !== key && !target.startsWith(`${key}/`)))
}

function PolicyNodeEditor({
  node,
  ancestors,
  policy,
  impactCounts,
  onRuleChange,
  onReset,
  pending,
}: {
  node: ShopPolicyNode
  ancestors: string[]
  policy: GroupShopPolicy
  impactCounts: ReadonlyMap<string, number>
  onRuleChange: (key: string, rule: GroupShopRule) => void
  onReset: (key: string, label: string) => void
  pending: boolean
}) {
  const lineage = [...ancestors, node.key]
  const rule = policy.rules[node.key] ?? {}
  const effective = resolveShopPolicy(policy, lineage)
  const adjustedPrice = node.referencePrice === undefined ? null : adjustedShopPrice(node.referencePrice, effective.percentage)
  const impactCount = impactCounts.get(node.key) ?? 0
  const isPreciseItem = node.priceFormat !== undefined
  return <details className="group-shop-policy-node" open={ancestors.length < 1}>
    <summary>
      <span className="group-shop-policy-summary-title">{node.label}{impactCount > 0 && <span role="img" className={`group-shop-policy-badge${isPreciseItem ? ' group-shop-policy-badge-item' : ''}`} aria-label={isPreciseItem ? 'Modification active' : `${impactCount} élément${impactCount === 1 ? '' : 's'} modifié${impactCount === 1 ? '' : 's'}`} title={isPreciseItem ? 'Modification active' : `${impactCount} élément${impactCount === 1 ? '' : 's'} modifié${impactCount === 1 ? '' : 's'}`}>{isPreciseItem ? <span aria-hidden="true" /> : impactCount}</span>}</span>
      <span className="group-shop-policy-effective">{effective.available ? 'En vente' : 'Retiré de la vente'} · {effective.percentage > 0 ? '+' : ''}{effective.percentage}%</span>
    </summary>
    <div className="group-shop-policy-controls">
      <label>Variation du prix (%)
        <input type="number" min={-100} step={1} disabled={pending} value={rule.percentage ?? ''} placeholder={`${effective.percentage} (hérité)`} onChange={(event) => {
          const raw = event.target.value
          const percentage = raw === '' ? undefined : Number(raw)
          onRuleChange(node.key, { ...rule, percentage })
        }} />
      </label>
      <label>Disponibilité
        <select disabled={pending} value={rule.available === undefined ? '' : rule.available ? 'available' : 'removed'} onChange={(event) => {
          const available = event.target.value === '' ? undefined : event.target.value === 'available'
          onRuleChange(node.key, { ...rule, available })
        }}>
          <option value="">Hériter ({effective.available ? 'en vente' : 'retiré'})</option>
          <option value="available">En vente</option>
          <option value="removed">Retirer de la vente</option>
        </select>
      </label>
      <button type="button" className="shop-catalog-filter-reset" disabled={pending} onClick={() => onReset(node.key, node.label)}>Réinitialiser cette section</button>
    </div>
    {node.referencePrice !== undefined && <div className="group-shop-policy-price" aria-label={`Comparaison du prix de ${node.label}`}>
      <div><span>Prix de référence</span><strong>{priceLabel(node.referencePrice, node.priceFormat)}</strong></div>
      <span className="group-shop-policy-price-arrow" aria-hidden="true">→</span>
      <div><span>Après modification</span><strong>{adjustedPrice === null ? 'Non commercialisable' : priceLabel(adjustedPrice, node.priceFormat)}</strong></div>
      {node.priceNote && <small>{node.priceNote}</small>}
    </div>}
    {node.children.length > 0 && <div className="group-shop-policy-children">{node.children.map((child) => <PolicyNodeEditor key={child.key} node={child} ancestors={lineage} policy={policy} impactCounts={impactCounts} onRuleChange={onRuleChange} onReset={onReset} pending={pending} />)}</div>}
  </details>
}

export function GroupShopPolicyClient({ groupId, initialPolicy, tree }: { groupId: number; initialPolicy: GroupShopPolicy; tree: ShopPolicyNode[] }) {
  const router = useRouter()
  const [policy, setPolicy] = useState<GroupShopPolicy>(initialPolicy)
  const impactCounts = useMemo(() => summarizeShopPolicyImpacts(tree, policy), [tree, policy])
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  function changeRule(key: string, rule: GroupShopRule) {
    setPolicy((current) => {
      const nextRules = { ...current.rules }
      if (rule.percentage === undefined && rule.available === undefined) delete nextRules[key]
      else nextRules[key] = rule
      return { rules: nextRules }
    })
  }

  async function save(nextPolicy: GroupShopPolicy = policy, successText = 'Les règles de cette escouade ont été enregistrées.') {
    setPending(true)
    setMessage(null)
    try {
      await saveGroupShopPolicy(groupId, nextPolicy)
      setPolicy(nextPolicy)
      setMessage({ kind: 'success', text: successText })
      router.refresh()
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'Enregistrement impossible.' })
    } finally {
      setPending(false)
    }
  }

  function resetAll() {
    void save({ rules: {} }, 'Toutes les modifications ont été réinitialisées.')
  }

  return <div className="group-shop-policy">
    <p className="group-shop-policy-intro">Les variations sont des pourcentages entiers. Une règle précise remplace celle du parent; prix et disponibilité héritent séparément. La pastille marque un élément dont le prix ou la disponibilité change; les nombres comptent les éléments concernés dans chaque branche.</p>
    {message && <p className={`shop-message ${message.kind}`} role="status">{message.text}</p>}
    <div className="group-shop-policy-tree">{tree.map((node) => <PolicyNodeEditor key={node.key} node={node} ancestors={[]} policy={policy} impactCounts={impactCounts} onRuleChange={changeRule} onReset={(key, label) => void save({ rules: removeSubtreeRules(policy.rules, key) }, `Les règles de « ${label} » ont été réinitialisées.`)} pending={pending} />)}</div>
    <div className="group-shop-policy-actions">
      <button type="button" disabled={pending} onClick={() => void save()}>{pending ? 'Enregistrement…' : 'Enregistrer les règles'}</button>
      <button type="button" className="shop-cancel-button" disabled={pending} onClick={resetAll}>Réinitialiser toutes les modifications</button>
      <Link className="shop-cancel-button" href="/characters">Retour aux personnages</Link>
    </div>
  </div>
}
