'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { adjustedShopPrice, legacyShopPolicyRuleKeysChangedAtNode, legacyShopPolicyRuleKeysInSubtree, resolveShopPolicy, shopPolicyNodePaths, summarizeShopPolicyImpacts, type GroupShopPolicy, type GroupShopRule, type ShopPolicyNode } from '@/lib/groupShopPolicy'
import { readShopPrice } from '@/lib/shop'
import {
  deleteGroupShopPolicyPreset,
  listGroupShopPolicyPresets,
  loadGroupShopPolicyPreset,
  saveGroupShopPolicy,
  saveGroupShopPolicyPreset,
  type GroupShopPolicyPresetSummary,
} from '../../group-policy-actions'

const money = (value: number) => `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 4 }).format(value)} Konis`

function priceLabel(value: number | string | null, format: ShopPolicyNode['priceFormat']) {
  const amount = readShopPrice(value)
  if (amount === null) return 'Non commercialisable'
  if (format === 'weapon-factor') {
    return `${new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 2 }).format(amount)} du prix de l’arme`
  }
  return money(amount)
}

function removeSubtreeRules(rules: Record<string, GroupShopRule>, key: string, legacyKeys: string[] = []) {
  const legacyKeySet = new Set(legacyKeys)
  return Object.fromEntries(Object.entries(rules).filter(([target]) => target !== key && !target.startsWith(`${key}/`) && !legacyKeySet.has(target)))
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
  const effective = resolveShopPolicy(policy, shopPolicyNodePaths(lineage, node))
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
  const [presetMenu, setPresetMenu] = useState<'save' | 'list' | null>(null)
  const [presets, setPresets] = useState<GroupShopPolicyPresetSummary[]>([])
  const [presetName, setPresetName] = useState('')
  const [selectedPresetId, setSelectedPresetId] = useState<number | ''>('')
  const [presetSearch, setPresetSearch] = useState('')
  const [presetBusy, setPresetBusy] = useState(false)
  const [presetError, setPresetError] = useState('')

  const matchingPresets = useMemo(() => {
    const query = presetSearch.trim().toLocaleLowerCase('fr-FR')
    return query ? presets.filter((preset) => preset.name.toLocaleLowerCase('fr-FR').includes(query)) : presets
  }, [presets, presetSearch])

  function changeRule(key: string, rule: GroupShopRule) {
    const obsoleteKeys = new Set(legacyShopPolicyRuleKeysChangedAtNode(tree, key))
    setPolicy((current) => {
      const nextRules = { ...current.rules }
      obsoleteKeys.forEach((obsoleteKey) => delete nextRules[obsoleteKey])
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

  async function openPresetMenu(menu: 'save' | 'list') {
    setPresetMenu(menu)
    setPresetError('')
    setPresetSearch('')
    setPresetBusy(true)
    try {
      const savedPresets = await listGroupShopPolicyPresets()
      setPresets(savedPresets)
      setSelectedPresetId((current) => current && savedPresets.some((preset) => preset.id === current)
        ? current
        : savedPresets[0]?.id ?? '')
    } catch (error) {
      setPresetError(error instanceof Error ? error.message : 'Impossible de charger vos sauvegardes.')
    } finally {
      setPresetBusy(false)
    }
  }

  async function savePreset(presetId?: number) {
    const selectedPreset = presets.find((preset) => preset.id === presetId)
    const name = presetId === undefined ? presetName : selectedPreset?.name
    if (!name) {
      setPresetError('Choisissez une sauvegarde à écraser.')
      return
    }
    setPresetBusy(true)
    setPresetError('')
    try {
      const saved = await saveGroupShopPolicyPreset(groupId, name, policy, presetId)
      const refreshed = await listGroupShopPolicyPresets()
      setPresets(refreshed)
      setSelectedPresetId(saved.id)
      setPresetName('')
      setPresetMenu(null)
      setMessage({ kind: 'success', text: presetId === undefined ? `Sauvegarde « ${saved.name} » créée.` : `Sauvegarde « ${saved.name} » écrasée.` })
    } catch (error) {
      setPresetError(error instanceof Error ? error.message : 'Impossible d’enregistrer cette sauvegarde.')
    } finally {
      setPresetBusy(false)
    }
  }

  async function loadPreset(presetId: number) {
    setPresetBusy(true)
    setPresetError('')
    try {
      const loadedPolicy = await loadGroupShopPolicyPreset(presetId)
      const preset = presets.find((item) => item.id === presetId)
      setPolicy(loadedPolicy)
      setPresetMenu(null)
      setMessage({ kind: 'success', text: `« ${preset?.name ?? 'Sauvegarde'} » chargée comme modification en cours. Appliquez les règles pour l’enregistrer sur cette escouade.` })
    } catch (error) {
      setPresetError(error instanceof Error ? error.message : 'Impossible de charger cette sauvegarde.')
    } finally {
      setPresetBusy(false)
    }
  }

  async function deletePreset(preset: GroupShopPolicyPresetSummary) {
    if (!window.confirm(`Supprimer la sauvegarde « ${preset.name} » ? Cette action est définitive.`)) return
    setPresetBusy(true)
    setPresetError('')
    try {
      await deleteGroupShopPolicyPreset(preset.id)
      const refreshed = await listGroupShopPolicyPresets()
      setPresets(refreshed)
      setSelectedPresetId((current) => current === preset.id ? refreshed[0]?.id ?? '' : current)
      setMessage({ kind: 'success', text: `Sauvegarde « ${preset.name} » supprimée.` })
    } catch (error) {
      setPresetError(error instanceof Error ? error.message : 'Impossible de supprimer cette sauvegarde.')
    } finally {
      setPresetBusy(false)
    }
  }

  function resetAll() {
    void save({ rules: {} }, 'Toutes les modifications ont été réinitialisées.')
  }

  return <div className="group-shop-policy">
    <p className="group-shop-policy-intro">Les variations sont des pourcentages entiers. Une règle précise remplace celle du parent; prix et disponibilité héritent séparément. La pastille marque un élément dont le prix ou la disponibilité change; les nombres comptent les éléments concernés dans chaque branche.</p>
    {message && <p className={`shop-message ${message.kind}`} role="status">{message.text}</p>}
    <div className="group-shop-policy-tree">{tree.map((node) => <PolicyNodeEditor key={node.key} node={node} ancestors={[]} policy={policy} impactCounts={impactCounts} onRuleChange={changeRule} onReset={(key, label) => void save({ rules: removeSubtreeRules(policy.rules, key, legacyShopPolicyRuleKeysInSubtree(tree, key)) }, `Les règles de « ${label} » ont été réinitialisées.`)} pending={pending} />)}</div>
    <div className="group-shop-policy-actions">
      <button type="button" disabled={pending || presetBusy} onClick={() => void save()}>{pending ? 'Application…' : 'Appliquer les règles'}</button>
      <button type="button" disabled={pending || presetBusy} onClick={() => void openPresetMenu('save')}>Sauvegarder</button>
      <button type="button" className="shop-cancel-button" disabled={pending || presetBusy} onClick={() => void openPresetMenu('list')}>Voir mes presets</button>
      <button type="button" className="shop-cancel-button" disabled={pending || presetBusy} onClick={resetAll}>Réinitialiser toutes les modifications</button>
      <Link className="shop-cancel-button" href="/characters">Retour aux personnages</Link>
    </div>
    {presetMenu && <div className="group-shop-preset-overlay" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !presetBusy) setPresetMenu(null)
    }}>
      <section className="group-shop-preset-dialog" role="dialog" aria-modal="true" aria-labelledby="group-shop-preset-title" onKeyDown={(event) => {
        if (event.key === 'Escape' && !presetBusy) setPresetMenu(null)
      }}>
        <div className="group-shop-preset-heading">
          <div>
            <h2 id="group-shop-preset-title">{presetMenu === 'save' ? 'Sauvegarder cette configuration' : 'Mes presets de boutique'}</h2>
            <p>{presetMenu === 'save' ? 'Les règles affichées seront enregistrées dans vos sauvegardes personnelles.' : 'Chargez un preset dans les réglages en cours, ou supprimez une sauvegarde.'}</p>
          </div>
          <button type="button" className="group-shop-preset-close" aria-label="Fermer" disabled={presetBusy} onClick={() => setPresetMenu(null)}>×</button>
        </div>
        {presetError && <p className="shop-message error" role="alert">{presetError}</p>}
        {presetBusy && <p className="group-shop-preset-status" role="status">Patientez…</p>}
        {presetMenu === 'save' ? <div className="group-shop-preset-content">
          <form className="group-shop-preset-create" onSubmit={(event) => { event.preventDefault(); void savePreset() }}>
            <h3>Créer une nouvelle sauvegarde</h3>
            <label htmlFor="group-shop-preset-name">Nom de la sauvegarde</label>
            <div className="group-shop-preset-form-row">
              <input id="group-shop-preset-name" autoFocus maxLength={100} value={presetName} disabled={presetBusy || presets.length >= 50} onChange={(event) => setPresetName(event.target.value)} placeholder="Ex. Boutique de départ" />
              <button type="submit" disabled={presetBusy || presets.length >= 50 || !presetName.trim()}>Créer</button>
            </div>
            <small>{presets.length} / 50 sauvegardes utilisées.</small>
            {presets.length >= 50 && <small>La limite est atteinte. Écrasez ou supprimez une sauvegarde pour libérer une place.</small>}
          </form>
          <div className="group-shop-preset-overwrite">
            <h3>Écraser une sauvegarde existante</h3>
            <label htmlFor="group-shop-preset-overwrite-search">Rechercher une sauvegarde</label>
            <input id="group-shop-preset-overwrite-search" value={presetSearch} disabled={presetBusy} onChange={(event) => {
              const query = event.target.value.trim().toLocaleLowerCase('fr-FR')
              const filtered = query ? presets.filter((preset) => preset.name.toLocaleLowerCase('fr-FR').includes(query)) : presets
              setPresetSearch(event.target.value)
              setSelectedPresetId(filtered[0]?.id ?? '')
            }} placeholder="Rechercher par nom" />
            <div className="group-shop-preset-form-row">
              <select aria-label="Sauvegarde à écraser" value={matchingPresets.some((preset) => preset.id === selectedPresetId) ? selectedPresetId : matchingPresets[0]?.id ?? ''} disabled={presetBusy || matchingPresets.length === 0} onChange={(event) => setSelectedPresetId(event.target.value ? Number(event.target.value) : '')}>
                {matchingPresets.length === 0 && <option value="">Aucune sauvegarde trouvée</option>}
                {matchingPresets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}
              </select>
              <button type="button" disabled={presetBusy || !matchingPresets.length} onClick={() => {
                const currentId = matchingPresets.some((preset) => preset.id === selectedPresetId) ? selectedPresetId : matchingPresets[0]?.id
                if (currentId) void savePreset(Number(currentId))
              }}>Écraser</button>
            </div>
          </div>
        </div> : <div className="group-shop-preset-content group-shop-preset-list-content">
          <label htmlFor="group-shop-preset-search">Rechercher une sauvegarde</label>
          <input id="group-shop-preset-search" autoFocus value={presetSearch} disabled={presetBusy} onChange={(event) => setPresetSearch(event.target.value)} placeholder="Rechercher par nom" />
          {matchingPresets.length === 0 ? <p className="group-shop-preset-empty">{presets.length ? 'Aucune sauvegarde ne correspond à cette recherche.' : 'Vous n’avez pas encore de preset sauvegardé.'}</p> : <ul className="group-shop-preset-list">
            {matchingPresets.map((preset) => <li key={preset.id}>
              <div><strong>{preset.name}</strong><small>Modifié le {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(preset.updatedAt))}</small></div>
              <div className="group-shop-preset-item-actions">
                <button type="button" disabled={presetBusy} onClick={() => void loadPreset(preset.id)}>Charger</button>
                <button type="button" className="shop-cancel-button" disabled={presetBusy} onClick={() => void deletePreset(preset)}>Supprimer</button>
              </div>
            </li>)}
          </ul>}
        </div>}
        <div className="group-shop-preset-footer">
          <button type="button" className="shop-cancel-button" disabled={presetBusy} onClick={() => setPresetMenu(null)}>Fermer</button>
        </div>
      </section>
    </div>}
  </div>
}
