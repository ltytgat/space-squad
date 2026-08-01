'use client'

import { useMemo, useState } from 'react'
import { applySessionRewards, type SessionRewardsInput } from './session-rewards-actions'
import { computeFactionPoints, type FactionLite } from './session-rewards-formula'

type Rang = { nom: string; pointsRequis: number }
type Faction = { id: number; nom: string; rangs?: Rang[] }

export type DrawerCharacter = {
  id: number
  nom?: string
  konis?: number
  pointsDeRang?: number
  pointsDeCompetence?: number
  pointsDeFaction?: number
  rangDeFaction?: string | null
  /** Affiliation peuplée avec ses rangs (nécessaire au calcul des points de faction). */
  affiliation?: FactionLite | null
}

interface Props {
  open: boolean
  onClose: () => void
  characters: DrawerCharacter[]
  factions: Faction[]
  /** Type de portée : escouade filtrée ou sélection manuelle. */
  scopeType: 'group' | 'selection'
  /** Id d'escouade quand scopeType==='group'. */
  groupId?: number | null
  /** Libellé de la portée (nom d'escouade ou "X personnages sélectionnés"). */
  scopeLabel: string
}

/**
 * Panneau latéral "Terminer la session" — formulaire d'application en masse
 * des récompenses de fin de mission.
 *
 * Les toggles à gauche activent/désactivent chaque type de récompense.
 * Le tableau permet d'ajuster individuellement Konis et Points de compétence
 * (certains joueurs ont pu recevoir un bonus/malus).
 * Le récapitulatif se met à jour en temps réel.
 */
export function SessionRewardsDrawer({
  open,
  onClose,
  characters,
  factions,
  scopeType,
  groupId,
  scopeLabel,
}: Props) {
  // — Toggles (True par défaut, conformément à la spec).
  const [applyKonis, setApplyKonis] = useState(true)
  const [applyPR, setApplyPR] = useState(true)
  const [applyPC, setApplyPC] = useState(true)
  const [applyRep, setApplyRep] = useState(true)
  const [applyFaction, setApplyFaction] = useState(true)

  // — Valeurs générales.
  const [konisTotal, setKonisTotal] = useState<number>(0)
  const [pr, setPR] = useState<number>(0)
  const [factionId, setFactionId] = useState<number | ''>('')
  const [repValeur, setRepValeur] = useState<number>(0)

  // — Fin de mission : commanditaire + cibles + hors Confédération.
  //   `commanditaire === 'other'` = option « Autre » (pas de faction commanditaire).
  const [commanditaire, setCommanditaire] = useState<number | 'other' | ''>('')
  const [ciblesAbattues, setCiblesAbattues] = useState<number>(0)
  const [ciblesCapturees, setCiblesCapturees] = useState<number>(0)
  const [horsConfederation, setHorsConfederation] = useState<boolean>(false)

  // — Ajustements par personnage.
  //   konis : par défaut floor(konisTotal / N), mais si l'admin a saisi une
  //   valeur manuelle on ne l'écrase plus.
  const [perCharKonis, setPerCharKonis] = useState<Record<number, number>>({})
  const [perCharPC, setPerCharPC] = useState<Record<number, number>>({})
  const [touchedKonis, setTouchedKonis] = useState<Record<number, boolean>>({})

  // — État de soumission.
  const [batchId] = useState<string>(() =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `batch-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const N = characters.length
  const konisPart = useMemo(
    () => (N > 0 ? Math.floor((konisTotal || 0) / N) : 0),
    [konisTotal, N],
  )

  // Nom de la faction commanditaire (utilisé par la règle Union) + son id
  //   normalisé pour la formule (null = « Autre »).
  const commanditaireId: number | null =
    typeof commanditaire === 'number' ? commanditaire : null
  const commanditaireName: string | null = useMemo(() => {
    if (typeof commanditaire !== 'number') return null
    return factions.find((f) => f.id === commanditaire)?.nom ?? null
  }, [commanditaire, factions])

  // Récap : compose les deltas effectifs par personnage.
  const preview = useMemo(() => {
    return characters.map((c) => {
      const dKonis = applyKonis
        ? touchedKonis[c.id]
          ? perCharKonis[c.id] ?? 0
          : konisPart
        : 0
      const dPR = applyPR ? pr || 0 : 0
      const dPC = applyPC ? perCharPC[c.id] ?? 0 : 0
      const dRep = applyRep && factionId && repValeur !== 0 ? repValeur : 0
      const fpts = applyFaction
        ? computeFactionPoints({
            affiliation: c.affiliation ?? null,
            rangDeFaction: c.rangDeFaction ?? null,
            konisGain: dKonis,
            commanditaireId,
            commanditaireName,
            ciblesAbattues,
            ciblesCapturees,
            horsConfederation,
          })
        : { total: 0, commanditaire: 0, faction: 0, factionLabel: null }
      return {
        c,
        dKonis,
        dPR,
        dPC,
        dRep,
        dPF: fpts.total,
        dPFBreakdown: fpts,
        nextKonis: (c.konis ?? 0) + dKonis,
        nextPR: (c.pointsDeRang ?? 0) + dPR,
        nextPC: (c.pointsDeCompetence ?? 0) + dPC,
        nextPF: (c.pointsDeFaction ?? 0) + fpts.total,
      }
    })
  }, [
    characters,
    applyKonis,
    applyPR,
    applyPC,
    applyRep,
    applyFaction,
    touchedKonis,
    perCharKonis,
    perCharPC,
    konisPart,
    pr,
    factionId,
    repValeur,
    commanditaireId,
    commanditaireName,
    ciblesAbattues,
    ciblesCapturees,
    horsConfederation,
  ])

  const nothingToApply =
    (!applyKonis || (konisTotal === 0 && Object.keys(perCharKonis).length === 0)) &&
    (!applyPR || pr === 0) &&
    (!applyPC || Object.values(perCharPC).every((v) => !v)) &&
    (!applyRep || !factionId || repValeur === 0) &&
    (!applyFaction || preview.every((p) => p.dPF === 0))

  async function handleSubmit() {
    if (submitting) return
    setError(null)
    setSubmitting(true)
    try {
      const payload: SessionRewardsInput = {
        batchId,
        scopeType,
        groupId: scopeType === 'group' ? groupId ?? null : null,
        characterIds: characters.map((c) => c.id),
        apply: {
          konis: applyKonis,
          pr: applyPR,
          pointsDeCompetence: applyPC,
          reputation: applyRep,
          faction: applyFaction,
        },
        values: {
          konisTotal: applyKonis ? konisTotal : 0,
          pr: applyPR ? pr : 0,
          factionId: applyRep && factionId ? Number(factionId) : null,
          reputationValeur: applyRep ? repValeur : 0,
          commanditaireId: applyFaction && typeof commanditaire === 'number' ? commanditaire : null,
          ciblesAbattues: applyFaction ? ciblesAbattues : 0,
          ciblesCapturees: applyFaction ? ciblesCapturees : 0,
          horsConfederation: applyFaction ? horsConfederation : false,
        },
        perCharacter: Object.fromEntries(
          characters.map((c) => [
            String(c.id),
            {
              konis: applyKonis
                ? touchedKonis[c.id]
                  ? perCharKonis[c.id] ?? 0
                  : konisPart
                : 0,
              pointsDeCompetence: applyPC ? perCharPC[c.id] ?? 0 : 0,
            },
          ]),
        ),
      }
      const res = await applySessionRewards(payload)
      setDone(true)
      // Petite pause visuelle avant de fermer et de laisser Next revalider.
      setTimeout(() => {
        onClose()
        // Rechargement pour refléter les nouvelles valeurs sur les cartes.
        if (typeof window !== 'undefined' && !res.alreadyApplied) {
          window.location.reload()
        }
      }, 800)
    } catch (e: any) {
      setError(e?.message ?? 'Erreur inconnue')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="sr-drawer-root" role="dialog" aria-modal="true" aria-label="Terminer la session">
      <div className="sr-drawer-overlay" onClick={submitting ? undefined : onClose} />
      <aside className="sr-drawer">
        <header className="sr-drawer-header">
          <div>
            <h2 className="sr-drawer-title">Terminer la session</h2>
            <p className="sr-drawer-subtitle">{scopeLabel} — {N} personnage{N > 1 ? 's' : ''}</p>
          </div>
          <button
            type="button"
            className="sr-drawer-close"
            onClick={onClose}
            disabled={submitting}
            aria-label="Fermer"
          >
            ×
          </button>
        </header>

        <div className="sr-drawer-body">
          {/* ── Champs généraux ── */}
          <section className="sr-section">
            <h3 className="sr-section-title">Récompenses à appliquer</h3>

            <div className="sr-field">
              <label className="sr-toggle">
                <input
                  type="checkbox"
                  checked={applyKonis}
                  onChange={(e) => setApplyKonis(e.target.checked)}
                />
                <span>Konis</span>
              </label>
              <div className="sr-field-row">
                <label className="sr-inline">
                  Total à répartir
                  <input
                    type="number"
                    disabled={!applyKonis}
                    value={konisTotal}
                    onChange={(e) => setKonisTotal(Number(e.target.value) || 0)}
                  />
                </label>
                <span className="sr-hint">
                  ≈ {konisPart} par personnage ({N})
                </span>
              </div>
            </div>

            <div className="sr-field">
              <label className="sr-toggle">
                <input
                  type="checkbox"
                  checked={applyPR}
                  onChange={(e) => setApplyPR(e.target.checked)}
                />
                <span>Points de rang (PR)</span>
              </label>
              <div className="sr-field-row">
                <label className="sr-inline">
                  Valeur (identique pour tous)
                  <input
                    type="number"
                    disabled={!applyPR}
                    value={pr}
                    onChange={(e) => setPR(Number(e.target.value) || 0)}
                  />
                </label>
              </div>
            </div>

            <div className="sr-field">
              <label className="sr-toggle">
                <input
                  type="checkbox"
                  checked={applyPC}
                  onChange={(e) => setApplyPC(e.target.checked)}
                />
                <span>Points de compétence (individuel)</span>
              </label>
              <p className="sr-hint">À saisir par personnage dans le tableau ci-dessous.</p>
            </div>

            <div className="sr-field">
              <label className="sr-toggle">
                <input
                  type="checkbox"
                  checked={applyRep}
                  onChange={(e) => setApplyRep(e.target.checked)}
                />
                <span>Réputation de faction</span>
              </label>
              <div className="sr-field-row">
                <label className="sr-inline">
                  Faction
                  <select
                    disabled={!applyRep}
                    value={factionId}
                    onChange={(e) =>
                      setFactionId(e.target.value ? Number(e.target.value) : '')
                    }
                  >
                    <option value="">— Choisir —</option>
                    {factions.map((f) => (
                      <option key={f.id} value={f.id}>{f.nom}</option>
                    ))}
                  </select>
                </label>
                <label className="sr-inline">
                  Valeur
                  <input
                    type="number"
                    disabled={!applyRep}
                    value={repValeur}
                    onChange={(e) => setRepValeur(Number(e.target.value) || 0)}
                  />
                </label>
              </div>
              <p className="sr-hint">
                Ajouté à la catégorie existante si trouvée (par nom), sinon nouvelle entrée.
              </p>
            </div>
          </section>

          {/* ── Fin de mission (points de faction) ── */}
          <section className="sr-section">
            <h3 className="sr-section-title">Fin de mission</h3>

            <div className="sr-field">
              <label className="sr-toggle">
                <input
                  type="checkbox"
                  checked={applyFaction}
                  onChange={(e) => setApplyFaction(e.target.checked)}
                />
                <span>Points de faction</span>
              </label>

              <div className="sr-field-row">
                <label className="sr-inline">
                  Commanditaire
                  <select
                    disabled={!applyFaction}
                    value={commanditaire}
                    onChange={(e) => {
                      const v = e.target.value
                      if (v === '' || v === 'other') {
                        setCommanditaire(v as '' | 'other')
                      } else {
                        setCommanditaire(Number(v))
                      }
                    }}
                  >
                    <option value="">— Choisir —</option>
                    {factions.map((f) => (
                      <option key={f.id} value={f.id}>{f.nom}</option>
                    ))}
                    <option value="other">Autre</option>
                  </select>
                </label>
              </div>

              <div className="sr-field-row">
                <label className="sr-inline">
                  Cibles abattues
                  <input
                    type="number"
                    min={0}
                    disabled={!applyFaction}
                    value={ciblesAbattues}
                    onChange={(e) => setCiblesAbattues(Number(e.target.value) || 0)}
                  />
                </label>
                <label className="sr-inline">
                  Cibles capturées
                  <input
                    type="number"
                    min={0}
                    disabled={!applyFaction}
                    value={ciblesCapturees}
                    onChange={(e) => setCiblesCapturees(Number(e.target.value) || 0)}
                  />
                </label>
                <label className="sr-toggle sr-toggle-inline">
                  <input
                    type="checkbox"
                    disabled={!applyFaction}
                    checked={horsConfederation}
                    onChange={(e) => setHorsConfederation(e.target.checked)}
                  />
                  <span>Mission hors Confédération</span>
                </label>
              </div>

              <p className="sr-hint">
                Bonus commanditaire : 10 × grade actuel pour les personnages affiliés.
                {' '}Alliance : 2/cible abattue, 6/cible capturée.
                {' '}Guilde : palier selon konis gagnés (doublé si hors Confédération).
                {' '}Union : 15 pts (+10 hors Conf. ; +5 si commanditaire ≠ Union).
              </p>
            </div>
          </section>

          {/* ── Ajustements individuels + récap ── */}
          <section className="sr-section">
            <h3 className="sr-section-title">Récapitulatif &amp; ajustements</h3>
            <div className="sr-table-wrap">
              <table className="sr-table">
                <thead>
                  <tr>
                    <th>Fiche</th>
                    <th>Konis</th>
                    <th>PR</th>
                    <th>Pts compétence</th>
                    <th>Réputation</th>
                    <th>Pts faction</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map(({
                    c,
                    dKonis,
                    dPR,
                    dPC,
                    dRep,
                    dPF,
                    dPFBreakdown,
                    nextKonis,
                    nextPR,
                    nextPC,
                    nextPF,
                  }) => (
                    <tr key={c.id}>
                      <td className="sr-td-name">{c.nom || <em>Sans nom</em>}</td>
                      <td>
                        <input
                          type="number"
                          className="sr-td-input"
                          disabled={!applyKonis}
                          value={
                            touchedKonis[c.id]
                              ? perCharKonis[c.id] ?? 0
                              : konisPart
                          }
                          onChange={(e) => {
                            const v = Number(e.target.value) || 0
                            setPerCharKonis((s) => ({ ...s, [c.id]: v }))
                            setTouchedKonis((s) => ({ ...s, [c.id]: true }))
                          }}
                        />
                        <div className="sr-td-preview">
                          {(c.konis ?? 0)} → <strong>{nextKonis}</strong>
                          {dKonis !== 0 && (
                            <span className={dKonis > 0 ? 'sr-plus' : 'sr-minus'}>
                              {' '}({dKonis > 0 ? '+' : ''}{dKonis})
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="sr-td-preview">
                          {(c.pointsDeRang ?? 0)} → <strong>{nextPR}</strong>
                          {dPR !== 0 && (
                            <span className={dPR > 0 ? 'sr-plus' : 'sr-minus'}>
                              {' '}({dPR > 0 ? '+' : ''}{dPR})
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <input
                          type="number"
                          className="sr-td-input"
                          disabled={!applyPC}
                          value={perCharPC[c.id] ?? 0}
                          onChange={(e) =>
                            setPerCharPC((s) => ({
                              ...s,
                              [c.id]: Number(e.target.value) || 0,
                            }))
                          }
                        />
                        <div className="sr-td-preview">
                          {(c.pointsDeCompetence ?? 0)} → <strong>{nextPC}</strong>
                          {dPC !== 0 && (
                            <span className={dPC > 0 ? 'sr-plus' : 'sr-minus'}>
                              {' '}({dPC > 0 ? '+' : ''}{dPC})
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {applyRep && factionId && dRep !== 0 ? (
                          <span className={dRep > 0 ? 'sr-plus' : 'sr-minus'}>
                            {dRep > 0 ? '+' : ''}{dRep}
                          </span>
                        ) : (
                          <span className="sr-td-preview">—</span>
                        )}
                      </td>
                      <td>
                        {applyFaction && dPF !== 0 ? (
                          <>
                            <div className="sr-td-preview">
                              {(c.pointsDeFaction ?? 0)} → <strong>{nextPF}</strong>
                              <span className={dPF > 0 ? 'sr-plus' : 'sr-minus'}>
                                {' '}({dPF > 0 ? '+' : ''}{dPF})
                              </span>
                            </div>
                            {(dPFBreakdown.commanditaire !== 0 || dPFBreakdown.faction !== 0) && (
                              <div className="sr-td-hint">
                                {dPFBreakdown.commanditaire !== 0 && (
                                  <>+{dPFBreakdown.commanditaire} commanditaire</>
                                )}
                                {dPFBreakdown.commanditaire !== 0 && dPFBreakdown.faction !== 0 && ' · '}
                                {dPFBreakdown.faction !== 0 && dPFBreakdown.factionLabel && (
                                  <>+{dPFBreakdown.faction} {dPFBreakdown.factionLabel}</>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="sr-td-preview">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <footer className="sr-drawer-footer">
          {error && <p className="sr-error">{error}</p>}
          {done && <p className="sr-success">Récompenses appliquées !</p>}
          <div className="sr-actions">
            <button
              type="button"
              className="sr-btn sr-btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Annuler
            </button>
            <button
              type="button"
              className="sr-btn sr-btn-primary"
              onClick={handleSubmit}
              disabled={submitting || done || nothingToApply}
              title={nothingToApply ? 'Aucune récompense à appliquer' : undefined}
            >
              {submitting ? 'Application…' : 'Valider'}
            </button>
          </div>
        </footer>
      </aside>
    </div>
  )
}
