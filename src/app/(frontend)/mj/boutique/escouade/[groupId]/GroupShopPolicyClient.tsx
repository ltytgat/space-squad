'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { resolveShopPolicy, type GroupShopPolicy, type GroupShopRule, type ShopPolicyNode } from '@/lib/groupShopPolicy'
import { saveGroupShopPolicy } from '../../group-policy-actions'

function removeSubtreeRules(rules: Record<string, GroupShopRule>, key: string) {
  return Object.fromEntries(Object.entries(rules).filter(([target]) => target !== key && !target.startsWith(`${key}/`)))
}

function PolicyNodeEditor({
  node,
  ancestors,
  policy,
  onRuleChange,
  onReset,
  pending,
}: {
  node: ShopPolicyNode
  ancestors: string[]
  policy: GroupShopPolicy
  onRuleChange: (key: string, rule: GroupShopRule) => void
  onReset: (key: string, label: string) => void
  pending: boolean
}) {
  const lineage = [...ancestors, node.key]
  const rule = policy.rules[node.key] ?? {}
  const effective = resolveShopPolicy(policy, lineage)
  return <details className="group-shop-policy-node" open={ancestors.length < 1}>
    <summary>{node.label}<span>{effective.available ? 'En vente' : 'Retiré de la vente'} · {effective.percentage > 0 ? '+' : ''}{effective.percentage}%</span></summary>
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
    {node.children.length > 0 && <div className="group-shop-policy-children">{node.children.map((child) => <PolicyNodeEditor key={child.key} node={child} ancestors={lineage} policy={policy} onRuleChange={onRuleChange} onReset={onReset} pending={pending} />)}</div>}
  </details>
}

export function GroupShopPolicyClient({ groupId, initialPolicy, tree }: { groupId: number; initialPolicy: GroupShopPolicy; tree: ShopPolicyNode[] }) {
  const router = useRouter()
  const [policy, setPolicy] = useState<GroupShopPolicy>(initialPolicy)
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
    <p className="shop-empty">Les variations sont des pourcentages entiers. Une règle précise remplace celle du parent; prix et disponibilité héritent séparément.</p>
    {message && <p className={`shop-message ${message.kind}`} role="status">{message.text}</p>}
    <div className="group-shop-policy-tree">{tree.map((node) => <PolicyNodeEditor key={node.key} node={node} ancestors={[]} policy={policy} onRuleChange={changeRule} onReset={(key, label) => void save({ rules: removeSubtreeRules(policy.rules, key) }, `Les règles de « ${label} » ont été réinitialisées.`)} pending={pending} />)}</div>
    <div className="group-shop-policy-actions">
      <button type="button" disabled={pending} onClick={() => void save()}>{pending ? 'Enregistrement…' : 'Enregistrer les règles'}</button>
      <button type="button" className="shop-cancel-button" disabled={pending} onClick={resetAll}>Réinitialiser toutes les modifications</button>
      <Link className="shop-cancel-button" href="/characters">Retour aux personnages</Link>
    </div>
  </div>
}
