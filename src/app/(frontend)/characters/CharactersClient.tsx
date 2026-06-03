'use client'

import { useMemo, useState } from 'react'

type Group = { id: number; nom: string }

type Character = {
  id: number
  nom?: string
  sexe?: string
  origine?: string
  affiliation?: string
  pointsDeRang?: number
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

const CLASSE_LABEL: Record<string, string> = {
  alpha: 'Alpha',
  beta: 'Beta',
  gamma: 'Gamma',
  delta: 'Delta',
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

function shipName(v: Character['vaisseau']): string {
  if (!v || typeof v === 'string') return '—'
  return v.nom
}

interface Props {
  characters: Character[]
  groups: Group[]
}

export function CharactersClient({ characters, groups }: Props) {
  const [activeGroup, setActiveGroup] = useState<number | 'none' | null>(null)

  const filtered = useMemo(() => {
    if (!activeGroup) return characters
    if (activeGroup === 'none') return characters.filter((c) => !c.groupe)
    return characters.filter((c) => groupId(c.groupe) === activeGroup)
  }, [characters, activeGroup])

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
      </div>

      {/* ── Résultats ── */}
      <p className="chars-count">
        {filtered.length} personnage{filtered.length !== 1 ? 's' : ''}
        {activeGroup && activeGroup !== 'none' && (
          <> dans <strong>{groups.find((g) => g.id === activeGroup)?.nom}</strong></>
        )}
      </p>

      {filtered.length === 0 ? (
        <p className="chars-empty">Aucun personnage dans cette escouade.</p>
      ) : (
        <div className="chars-grid">
          {filtered.map((c) => (
            <a key={c.id} href={`/characters/${c.id}`} className="chars-card">
              <div className="chars-card-header">
                <h3 className="chars-card-name">{c.nom || <em>Sans nom</em>}</h3>
                <div className="chars-card-tags">
                  {c.origine && (
                    <span className="chars-tag chars-tag-origine">{c.origine}</span>
                  )}
                  {c.sexe && <span className="chars-tag">{c.sexe}</span>}
                  {c.affiliation && (
                    <span className={`chars-tag ${AFFIL_COLORS[c.affiliation] ?? ''}`}>
                      {c.affiliation}
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
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
