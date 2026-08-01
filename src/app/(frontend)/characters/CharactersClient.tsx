'use client'

import { useMemo, useState } from 'react'
import { SessionRewardsDrawer } from './SessionRewardsDrawer'

type Group = { id: number; nom: string }
type Rang = { nom: string; pointsRequis: number }
type Faction = { id: number; nom: string; rangs?: Rang[] }

type Character = {
  id: number
  nom?: string
  sexe?: string
  origine?: string
  affiliation?: string | Faction | null
  pointsDeRang?: number
  pointsDeCompetence?: number
  pointsDeFaction?: number
  rangDeFaction?: string | null
  konis?: number
  legende?: number
  groupe?: Group | string | null
  vaisseau?: { id: number; nom: string; classe?: string } | string | null
  roleVaisseau?: string | null
}

const AFFIL_COLORS: Record<string, string> = {
  Alliance: 'char-affil-alliance',
  Union: 'char-affil-union',
  Guilde: 'char-affil-guilde',
}

function groupName(g: Group | string | null | undefined): string {
  if (!g) return ''
  if (typeof g === 'string') return ''
  return g.nom
}

function groupId(g: Group | string | null | undefined): string | number {
  if (!g) return ''
  if (typeof g === 'string') return g
  return g.id
}

function affiliationName(a: Character['affiliation']): string {
  if (!a) return ''
  if (typeof a === 'string') return a
  return a.nom
}

function shipName(v: Character['vaisseau']): string {
  if (!v || typeof v === 'string') return '—'
  return v.nom
}

interface Props {
  characters: Character[]
  groups: Group[]
  factions: Faction[]
}

export function CharactersClient({ characters, groups, factions }: Props) {
  const [activeGroup, setActiveGroup] = useState<number | 'none' | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [selectionMode, setSelectionMode] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const filtered = useMemo(() => {
    if (!activeGroup) return characters
    if (activeGroup === 'none') return characters.filter((c) => !c.groupe)
    return characters.filter((c) => groupId(c.groupe) === activeGroup)
  }, [characters, activeGroup])

  // Personnages ciblés par l'action "Terminer la session" :
  //  — si une sélection est active, on la privilégie,
  //  — sinon on retombe sur les personnages de l'escouade filtrée.
  const targeted = useMemo(() => {
    if (selected.size > 0) {
      return characters.filter((c) => selected.has(c.id))
    }
    if (activeGroup && activeGroup !== 'none') {
      return filtered
    }
    return []
  }, [selected, characters, activeGroup, filtered])

  const isGroupScope =
    selected.size === 0 && activeGroup !== null && activeGroup !== 'none'

  const scopeLabel = isGroupScope
    ? `Escouade ${groups.find((g) => g.id === activeGroup)?.nom ?? ''}`.trim()
    : `${selected.size} personnage${selected.size > 1 ? 's' : ''} sélectionné${selected.size > 1 ? 's' : ''}`

  function toggleSelected(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAllVisible() {
    setSelected(new Set(filtered.map((c) => c.id)))
  }

  function clearSelection() {
    setSelected(new Set())
  }

  const showActionBar = targeted.length > 0

  return (
    <div className="chars-client">
      {/* ── Filtres ── */}
      <div className="chars-filters">
        <button
          type="button"
          className={`chars-filter-btn${activeGroup === null ? ' chars-filter-btn-active' : ''}`}
          onClick={() => setActiveGroup(null)}
        >
          Toutes les escouades
          <span className="chars-filter-count">{characters.length}</span>
        </button>
        {groups.map((g) => {
          const count = characters.filter((c) => groupId(c.groupe) === g.id).length
          return (
            <button
              key={g.id}
              type="button"
              className={`chars-filter-btn${activeGroup === g.id ? ' chars-filter-btn-active' : ''}`}
              onClick={() => setActiveGroup(g.id)}
            >
              {g.nom}
              <span className="chars-filter-count">{count}</span>
            </button>
          )
        })}
        {/* Personnages sans groupe */}
        {characters.some((c) => !c.groupe) && (
          <button
            type="button"
            className={`chars-filter-btn${activeGroup === 'none' ? ' chars-filter-btn-active' : ''}`}
            onClick={() => setActiveGroup('none')}
          >
            Sans escouade
            <span className="chars-filter-count">
              {characters.filter((c) => !c.groupe).length}
            </span>
          </button>
        )}

        {/* Toggle du mode sélection */}
        <button
          type="button"
          className={`chars-filter-btn${selectionMode ? ' chars-filter-btn-active' : ''}`}
          onClick={() => {
            setSelectionMode((v) => {
              if (v) clearSelection()
              return !v
            })
          }}
          title="Activer la sélection manuelle de personnages"
        >
          {selectionMode ? 'Fin de la sélection' : 'Sélectionner…'}
        </button>
      </div>

      {/* ── Résultats ── */}
      <p className="chars-count">
        {filtered.length} personnage{filtered.length !== 1 ? 's' : ''}
        {activeGroup && activeGroup !== 'none' && (
          <> dans <strong>{groups.find((g) => g.id === activeGroup)?.nom}</strong></>
        )}
        {selected.size > 0 && (
          <> — <strong>{selected.size} sélectionné{selected.size > 1 ? 's' : ''}</strong></>
        )}
      </p>

      {filtered.length === 0 ? (
        <p className="chars-empty">Aucun personnage dans cette escouade.</p>
      ) : (
        <div className="chars-grid">
          {filtered.map((c) => {
            const affName = affiliationName(c.affiliation)
            const isSelected = selected.has(c.id)
            const CardTag: any = selectionMode ? 'div' : 'a'
            const cardProps = selectionMode
              ? {
                  role: 'button',
                  tabIndex: 0,
                  onClick: () => toggleSelected(c.id),
                  onKeyDown: (e: React.KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      toggleSelected(c.id)
                    }
                  },
                }
              : { href: `/characters/${c.id}` }
            return (
              <CardTag
                key={c.id}
                className={`chars-card${isSelected ? ' chars-card-selected' : ''}${selectionMode ? ' chars-card-selectable' : ''}`}
                {...cardProps}
              >
                {selectionMode && (
                  <span
                    className={`chars-card-check${isSelected ? ' chars-card-check-on' : ''}`}
                    aria-hidden="true"
                  >
                    {isSelected ? '✓' : ''}
                  </span>
                )}
                <div className="chars-card-header">
                  <h3 className="chars-card-name">{c.nom || <em>Sans nom</em>}</h3>
                  <div className="chars-card-tags">
                    {c.origine && (
                      <span className="chars-tag chars-tag-origine">{c.origine}</span>
                    )}
                    {c.sexe && <span className="chars-tag">{c.sexe}</span>}
                    {affName && (
                      <span className={`chars-tag ${AFFIL_COLORS[affName] ?? ''}`}>
                        {affName}
                      </span>
                    )}
                  </div>
                </div>

                <dl className="chars-card-dl">
                  <div className="chars-card-dl-row">
                    <dt>Escouade</dt>
                    <dd>{groupName(c.groupe) || '—'}</dd>
                  </div>
                  <div className="chars-card-dl-row">
                    <dt>Vaisseau</dt>
                    <dd>{shipName(c.vaisseau)}</dd>
                  </div>
                  {c.roleVaisseau && (
                    <div className="chars-card-dl-row">
                      <dt>Rôle</dt>
                      <dd>{c.roleVaisseau === 'proprietaire' ? 'Propriétaire' : 'Passager'}</dd>
                    </div>
                  )}
                </dl>

                <div className="chars-card-stats">
                  <div className="chars-stat">
                    <span className="chars-stat-label">Rang</span>
                    <span className="chars-stat-value">{c.pointsDeRang ?? 0}</span>
                  </div>
                  <div className="chars-stat">
                    <span className="chars-stat-label">Konis</span>
                    <span className="chars-stat-value">{c.konis ?? 0}</span>
                  </div>
                  <div className="chars-stat">
                    <span className="chars-stat-label">Légende</span>
                    <span className="chars-stat-value">{c.legende ?? 0}</span>
                  </div>
                </div>
              </CardTag>
            )
          })}
        </div>
      )}

      {/* ── Barre d'actions contextuelle ── */}
      {showActionBar && (
        <div className="chars-actionbar" role="region" aria-label="Actions sur la sélection">
          <div className="chars-actionbar-info">
            <strong>{scopeLabel}</strong>
            <span className="chars-actionbar-count">
              {targeted.length} fiche{targeted.length > 1 ? 's' : ''} concernée{targeted.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="chars-actionbar-actions">
            {selectionMode && selected.size < filtered.length && (
              <button
                type="button"
                className="chars-actionbar-btn chars-actionbar-btn-secondary"
                onClick={selectAllVisible}
              >
                Tout sélectionner
              </button>
            )}
            {selected.size > 0 && (
              <button
                type="button"
                className="chars-actionbar-btn chars-actionbar-btn-secondary"
                onClick={clearSelection}
              >
                Vider
              </button>
            )}
            <button
              type="button"
              className="chars-actionbar-btn chars-actionbar-btn-primary"
              onClick={() => setDrawerOpen(true)}
            >
              Terminer la session
            </button>
          </div>
        </div>
      )}

      <SessionRewardsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        characters={targeted.map((c) => ({
          id: c.id,
          nom: c.nom,
          konis: c.konis,
          pointsDeRang: c.pointsDeRang,
          pointsDeCompetence: c.pointsDeCompetence,
          pointsDeFaction: c.pointsDeFaction,
          rangDeFaction: c.rangDeFaction ?? null,
          // L'affiliation est peuplée par le server component (depth: 1) ;
          //   quand ce n'est pas un objet, on retombe sur null.
          affiliation:
            c.affiliation && typeof c.affiliation === 'object'
              ? {
                  id: c.affiliation.id,
                  nom: c.affiliation.nom,
                  rangs: c.affiliation.rangs,
                }
              : null,
        }))}
        factions={factions}
        scopeType={isGroupScope ? 'group' : 'selection'}
        groupId={isGroupScope ? (activeGroup as number) : null}
        scopeLabel={scopeLabel}
      />
    </div>
  )
}
