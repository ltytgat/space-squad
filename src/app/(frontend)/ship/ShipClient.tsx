'use client'

import { useState } from 'react'
import { getChassis, getShipLimits, getShipStats } from '@/lib/shipStats'
import { updateShipConfiguration, updateShipState, updateShipWeaponState, updateShipTurretWeaponState } from './actions'

const object = (value: any) => typeof value === 'object' && value ? value : null
const id = (value: any) => object(value)?.id ?? value

export function ShipClient({ ship: initialShip, crew, readOnly = false }: { ship: any; crew: any[]; isAdmin?: boolean; readOnly?: boolean }) {
  const [ship, setShip] = useState(initialShip)
  const [draft, setDraft] = useState(initialShip)
  const [modified, setModified] = useState(false)
  const [saving, setSaving] = useState(false)
  const chassis = getChassis(ship)
  const limits = getShipLimits(ship)
  const stats = getShipStats(ship)

  const setDraftValue = (key: string, value: any) => { if (readOnly) return; setDraft((current: any) => ({ ...current, [key]: value })); setModified(true) }
  const save = async () => {
    if (readOnly) return
    setSaving(true)
    try {
      const fields = ['moduleGenerateur', 'modulePropulseurs', 'moduleSurvie', 'moduleBoucliers', 'modulesSupplementaires', 'armesPilote', 'armesTourelles', 'consommablesVaisseau', 'inventaireModules', 'inventaireArmes', 'inventaireConsommables']
      const data: any = {}; fields.forEach(field => { if (draft[field] !== undefined) data[field] = draft[field] })
      await updateShipConfiguration(ship.id, data); setShip(draft); setModified(false)
    } catch (error) { alert(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde.') }
    finally { setSaving(false) }
  }
  const setState = async (key: string, value: number) => {
    if (readOnly) return
    const next = { ...ship, [key]: value }; setShip(next); setDraft(next)
    try { await updateShipState(ship.id, { [key]: value }) } catch { alert('Impossible de mettre à jour l’état du vaisseau.') }
  }
  const setWeaponState = async (slot: 'armesPilote' | 'armesTourelles', index: number, key: string, value: number) => {
    if (readOnly) return
    const entries = [...(ship[slot] ?? [])]; entries[index] = { ...entries[index], [key]: value }
    const next = { ...ship, [slot]: entries }; setShip(next); setDraft(next)
    try { await updateShipWeaponState(ship.id, slot, index, { [key]: value }) } catch { alert('Impossible de mettre à jour l’arme.') }
  }
  const modules = ship.inventaireModules ?? []
  const moduleField = (label: string, key: string) => {
    const current = object(draft[key])
    const choices = [...modules.map((entry: any) => object(entry.module)).filter(Boolean), current].filter((module, index, all) => module && all.findIndex(item => id(item) === id(module)) === index)
    return <label className="ship-field">{label}<select disabled={readOnly} value={id(draft[key]) ?? ''} onChange={event => setDraftValue(key, Number(event.target.value) || null)}><option value="">Aucun</option>{choices.map((module: any) => <option key={id(module)} value={id(module)}>{module.nom}</option>)}</select></label>
  }
  const addModule = () => {
    if (readOnly) return
    const available = modules.find((entry: any) => object(entry.module)?.typeModule === 'supplementaire' && !(draft.modulesSupplementaires ?? []).some((item: any) => id(item) === id(entry.module)))
    if (available && (draft.modulesSupplementaires ?? []).length < limits.moduleSlots) setDraftValue('modulesSupplementaires', [...(draft.modulesSupplementaires ?? []), available.module])
  }
  const pilotWeaponField = (entry: any, index: number) => {
    const current = object(entry.arme)
    const choices = [...(ship.inventaireArmes ?? []).map((item: any) => object(item.arme)).filter(Boolean), current].filter((weapon, position, all) => weapon && all.findIndex(item => id(item) === id(weapon)) === position)
    const entries = draft.armesPilote ?? []
    return <div className="ship-equipment-row" key={entry.id ?? index}><select disabled={readOnly} value={id(entry.arme) ?? ''} onChange={event => { const next = [...entries]; next[index] = { ...next[index], arme: Number(event.target.value) }; setDraftValue('armesPilote', next) }}>{choices.map((weapon: any) => <option key={id(weapon)} value={id(weapon)}>{weapon.nom}</option>)}</select>{!readOnly && <button type="button" className="ship-remove-button" onClick={() => setDraftValue('armesPilote', entries.filter((_: any, i: number) => i !== index))}>Retirer</button>}</div>
  }
  const addPilotWeapon = () => {
    const used = (draft.armesPilote ?? []).map((entry: any) => id(entry.arme))
    const available = (ship.inventaireArmes ?? []).find((entry: any) => !used.includes(id(entry.arme)))
    if (!readOnly && available) setDraftValue('armesPilote', [...(draft.armesPilote ?? []), { arme: available.arme }])
  }
  const addConsumable = () => {
    if ((draft.consommablesVaisseau ?? []).length >= limits.consumableSlots) return
    const available = (ship.inventaireConsommables ?? [])[0]
    if (!readOnly && available) setDraftValue('consommablesVaisseau', [...(draft.consommablesVaisseau ?? []), { consommable: available.consommable, quantite: 1 }])
  }
  const weapons = (slot: 'armesPilote' | 'armesTourelles', entries: any[], turretIndex = -1) => <div className="ship-equipment-list">{entries.length ? entries.map((entry: any, index: number) => { const weapon = object(entry.arme); const update = (key: string, value: number) => { if (turretIndex >= 0) { const turrets = [...(ship.armesTourelles ?? [])]; turrets[turretIndex] = { ...turrets[turretIndex], armes: [...turrets[turretIndex].armes] }; turrets[turretIndex].armes[index] = { ...turrets[turretIndex].armes[index], [key]: value }; setShip({ ...ship, armesTourelles: turrets }); setDraft({ ...draft, armesTourelles: turrets }); updateShipTurretWeaponState(ship.id, turretIndex, index, { [key]: value }).catch(() => alert('Impossible de mettre à jour l’arme.')) } else setWeaponState(slot, index, key, value) }; return <div className="ship-equipment-row" key={entry.id ?? index}><strong>{weapon?.nom ?? 'Arme'}</strong><span>{weapon?.degats ?? '—'}</span>{weapon?.chargeur != null && <label>Mun. <input type="number" min="0" value={entry.munitionsActuelles ?? weapon.chargeur} onChange={event => update('munitionsActuelles', Number(event.target.value))} /></label>}{weapon?.chauffe != null && <label>Chauffe <input type="number" min="0" value={entry.chauffeActuelle ?? 0} onChange={event => update('chauffeActuelle', Number(event.target.value))} /></label>}</div> }) : <p className="ship-muted">Aucune arme installée.</p>}</div>

  return <div className={`ship-content ss-container${readOnly ? ' ship-read-only' : ''}`}>
    <div className="ship-stats-grid">{[['Blindage', stats.armor, stats.maxArmor], ['Boucliers', stats.shield, stats.maxShield], ['Esquive', stats.evasion, null], ['Puissance', stats.power, null], ['Consommation', stats.consumption, null]].map(([label, value, max]) => <div className="ship-stat" key={String(label)}><span>{label}</span><strong>{value}{max ? ` / ${max}` : ''}</strong></div>)}</div>
    <section className="ship-card"><h2 className="ship-card-title">État actuel</h2><div className="ship-state-grid">{[['blindageActuel', 'Blindage', stats.maxArmor], ['bouclierActuel', 'Boucliers', stats.maxShield], ['esquiveActuelle', 'Esquive', null]].map(([key, label, max]) => <label className="ship-field" key={String(key)}>{label}<input type="number" min="0" max={max ? Number(max) : undefined} value={ship[key] ?? 0} onChange={event => setState(String(key), Number(event.target.value))} /></label>)}</div></section>
    <section className="ship-card"><h2 className="ship-card-title">Modèle et châssis</h2><dl className="ship-dl"><div className="ship-dl-row"><dt>Modèle</dt><dd>{object(ship.modele)?.nom ?? 'Non défini'}</dd></div><div className="ship-dl-row"><dt>Châssis</dt><dd>{chassis?.nom ?? 'Non défini'}</dd></div><div className="ship-dl-row"><dt>Classe / catégorie</dt><dd>{chassis?.classe ?? '—'} · {chassis?.categorie ?? '—'}</dd></div><div className="ship-dl-row"><dt>Capacités</dt><dd>{limits.pilotWeaponPoints} pts pilote · {limits.turretCount} tourelles · {limits.moduleSlots} modules · {limits.consumableSlots} consommables</dd></div></dl></section>
    <section className="ship-card"><h2 className="ship-card-title">Modules</h2><div className="ship-form-grid">{moduleField('Générateur', 'moduleGenerateur')}{moduleField('Propulseurs', 'modulePropulseurs')}{moduleField('Survie', 'moduleSurvie')}{moduleField('Boucliers', 'moduleBoucliers')}</div><div className="ship-subtitle-line"><h3 className="ship-subtitle">Modules supplémentaires ({(draft.modulesSupplementaires ?? []).length} / {limits.moduleSlots})</h3><button type="button" className="ship-remove-button" onClick={addModule}>Ajouter</button></div><div className="ship-equipment-list">{(draft.modulesSupplementaires ?? []).map((module: any, index: number) => <div className="ship-equipment-row" key={id(module) ?? index}><strong>{object(module)?.nom ?? 'Module'}</strong><button type="button" className="ship-remove-button" onClick={() => setDraftValue('modulesSupplementaires', (draft.modulesSupplementaires ?? []).filter((_: any, i: number) => i !== index))}>Retirer</button></div>)}{!(draft.modulesSupplementaires ?? []).length && <p className="ship-muted">Aucun module installé.</p>}</div></section>
    <section className="ship-card"><div className="ship-subtitle-line"><h2 className="ship-card-title">Armement du pilote</h2><button type="button" className="ship-remove-button" onClick={addPilotWeapon}>Ajouter</button></div>{(draft.armesPilote ?? []).map(pilotWeaponField)}{!(draft.armesPilote ?? []).length && <p className="ship-muted">Aucune arme installée.</p>}</section>
    <section className="ship-card"><h2 className="ship-card-title">Tourelles</h2>{(ship.armesTourelles ?? []).map((turret: any, index: number) => <div className="ship-turret" key={turret.id ?? index}><h3 className="ship-subtitle">Tourelle {turret.tourelle ?? index + 1}</h3>{weapons('armesTourelles', turret.armes ?? [], index)}</div>)}{!(ship.armesTourelles ?? []).length && <p className="ship-muted">Aucune tourelle configurée.</p>}</section>
    <section className="ship-card"><div className="ship-subtitle-line"><h2 className="ship-card-title">Consommables</h2><button type="button" className="ship-remove-button" onClick={addConsumable}>Ajouter</button></div>{(draft.consommablesVaisseau ?? []).map((entry: any, index: number) => <div className="ship-equipment-row" key={entry.id ?? index}><strong>{object(entry.consommable)?.nom ?? 'Consommable'}</strong><span>Qté : {entry.quantite}</span><button type="button" className="ship-remove-button" onClick={() => setDraftValue('consommablesVaisseau', (draft.consommablesVaisseau ?? []).filter((_: any, i: number) => i !== index))}>Retirer</button></div>)}{!(draft.consommablesVaisseau ?? []).length && <p className="ship-muted">Aucun consommable embarqué.</p>}</section>
    <section className="ship-card"><h2 className="ship-card-title">Inventaire</h2><p className="ship-muted">Modules : {(ship.inventaireModules ?? []).length} · Armes : {(ship.inventaireArmes ?? []).length} · Consommables : {(ship.inventaireConsommables ?? []).length}</p></section>
    <section className="ship-card"><h2 className="ship-card-title">Équipage ({crew.length})</h2><div className="ship-crew-list">{crew.map((member: any) => <div className="ship-crew-item" key={member.id}><span className="ship-crew-name">{member.nom || 'Sans nom'}</span><span className="ship-crew-role">{member.roleVaisseau || 'Passager'}</span></div>)}</div></section>
    <div className="ship-actions">{modified && <button className="ss-button secondary" onClick={() => { setDraft(ship); setModified(false) }} disabled={saving}>Annuler</button>}<button className="ss-button primary" onClick={save} disabled={!modified || saving}>{saving ? 'Enregistrement…' : 'Valider la configuration'}</button></div>
  </div>
}
