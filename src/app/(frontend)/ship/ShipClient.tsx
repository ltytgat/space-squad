'use client'

import { useMemo, useState } from 'react'
import { getChassis, getShipLimits, getShipStats } from '@/lib/shipStats'
import { updateCrewRole, updateShipConfiguration, updateShipState, updateShipTurretWeaponState, updateShipWeaponState } from './actions'

const object = (value: any) => typeof value === 'object' && value ? value : null
const id = (value: any) => object(value)?.id ?? value
const roleLabels: Record<string, string> = { pilote: 'Pilote', copilote: 'Copilote', canonnier: 'Canonnier', passager: 'Équipage' }
const numberFrom = (value: unknown) => { const match = String(value ?? '').replace(',', '.').match(/-?\d+(?:\.\d+)?/); return match ? Number(match[0]) : 0 }
const coolingFrom = (ammo: any) => { const match = String(ammo?.bonus ?? '').match(/refroidissement\s*:\s*([+-]?\d+)/i); return match ? Number(match[1]) : 0 }

export function ShipClient({ ship: initialShip, crew: initialCrew, readOnly = false }: { ship: any; crew: any[]; isAdmin?: boolean; readOnly?: boolean }) {
  const [ship, setShip] = useState(initialShip)
  const [crew, setCrew] = useState(initialCrew)
  const [draft, setDraft] = useState(initialShip)
  const [modified, setModified] = useState(false)
  const [saving, setSaving] = useState(false)
  const maxShield = getShipStats(initialShip).maxShield || 0
  const [shieldFront, setShieldFront] = useState(Math.ceil(maxShield / 2))
  const [shieldRear, setShieldRear] = useState(Math.floor(maxShield / 2))
  const shieldModule = object(initialShip.moduleBoucliers)
  const [shieldRecharge, setShieldRecharge] = useState(Number(shieldModule?.rechargeBouclier ?? 0))
  const [shieldCooldown, setShieldCooldown] = useState(Number(shieldModule?.cooldownBouclier ?? 0))
  const chassis = getChassis(ship)
  const limits = getShipLimits(ship)
  const stats = useMemo(() => getShipStats({ ...ship, crew }), [ship, crew])
  const shieldTotal = shieldFront + shieldRear

  const setDraftValue = (key: string, value: any) => { if (!readOnly) { setDraft((current: any) => ({ ...current, [key]: value })); setModified(true) } }
  const save = async () => {
    if (readOnly || !modified) return
    setSaving(true)
    try {
      const fields = ['moduleGenerateur', 'modulePropulseurs', 'moduleSurvie', 'moduleBoucliers', 'modulesSupplementaires', 'armesPilote', 'armesTourelles', 'consommablesVaisseau', 'inventaireModules', 'inventaireArmes', 'inventaireConsommables']
      const data: any = {}; fields.forEach((field) => { if (draft[field] !== undefined) data[field] = draft[field] })
      await updateShipConfiguration(ship.id, data); setShip(draft); setModified(false)
    } catch (error) { alert(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde.') } finally { setSaving(false) }
  }
  const updateArmor = async (value: number) => {
    if (readOnly) return
    const next = { ...ship, blindageActuel: Math.max(0, value) }; setShip(next)
    try { await updateShipState(ship.id, { blindageActuel: next.blindageActuel }) } catch { alert('Impossible de mettre à jour le blindage.') }
  }
  const changeRole = async (member: any, role: string) => {
    if (readOnly) return
    const next = crew.map((entry) => entry.id === member.id ? { ...entry, roleVaisseau: role } : entry); setCrew(next)
    try { await updateCrewRole(ship.id, member.id, role as any) } catch { setCrew(crew); alert('Impossible de modifier le poste.') }
  }
  const moduleField = (label: string, key: string) => {
    const modules = ship.inventaireModules ?? []; const current = object(draft[key])
    const choices = [...modules.map((entry: any) => object(entry.module)).filter(Boolean), current].filter((module, position, all) => module && all.findIndex((item) => id(item) === id(module)) === position)
    return <label className="ship-field"><span>{label}</span><select disabled={readOnly} value={id(draft[key]) ?? ''} onChange={(event) => setDraftValue(key, Number(event.target.value) || null)}><option value="">Aucun</option>{choices.map((module: any) => <option key={id(module)} value={id(module)}>{module.nom}</option>)}</select></label>
  }
  const updateWeapon = async (slot: 'armesPilote' | 'armesTourelles', index: number, key: string, value: number, turretIndex = -1) => {
    if (readOnly) return
    if (turretIndex >= 0) {
      const turrets = [...(ship.armesTourelles ?? [])]; turrets[turretIndex] = { ...turrets[turretIndex], armes: [...(turrets[turretIndex].armes ?? [])] }; turrets[turretIndex].armes[index] = { ...turrets[turretIndex].armes[index], [key]: value }; setShip({ ...ship, armesTourelles: turrets }); await updateShipTurretWeaponState(ship.id, turretIndex, index, { [key]: value } as any)
    } else { const entries = [...(ship[slot] ?? [])]; entries[index] = { ...entries[index], [key]: value }; setShip({ ...ship, [slot]: entries }); await updateShipWeaponState(ship.id, slot, index, { [key]: value } as any) }
  }
  const renderWeapon = (entry: any, index: number, turretIndex = -1) => {
    const weapon = object(entry.arme); if (!weapon) return null
    const thermal = weapon.type === 'thermique'; const inventoryEntries = ship.inventaireConsommables ?? []; const loaded = object(entry.chargeurRelie)
    const compatibleEntries = inventoryEntries.filter((item: any) => { const ammo = object(item.consommable); const isTypeCompatible = thermal ? /cartouche/i.test(ammo?.nom ?? '') : /cinetique|balle|munition/i.test(`${ammo?.nom} ${ammo?.categorie ?? ''}`); const sameModel = thermal || !loaded || id(ammo) === id(loaded); return isTypeCompatible && sameModel && Number(item.quantite ?? 0) > 0 })
    const compatible = compatibleEntries.map((item: any) => object(item.consommable)).filter(Boolean)
    const maxHeat = thermal ? numberFrom(loaded?.calibre) : 0; const cooling = thermal ? coolingFrom(loaded) : 0; const heat = Number(entry.chauffeActuelle ?? 0); const ammoCount = Number(entry.munitionsActuelles ?? 0)
    const fire = (key: string, value: number) => updateWeapon(turretIndex >= 0 ? 'armesTourelles' : 'armesPilote', index, key, value, turretIndex)
    const reload = async () => { const ammo = compatible[0]; const ammoEntry = compatibleEntries[0]; if (!ammo || !ammoEntry) return alert('Aucune munition compatible dans la réserve.'); const inventoryConsommables = inventoryEntries.map((item: any) => item === ammoEntry ? { ...item, quantite: Number(item.quantite ?? 1) - 1 } : item).filter((item: any) => item.quantite > 0); const data: any = { munitionsActuelles: thermal ? 0 : numberFrom(ammo.calibre) || Number(weapon.chargeur) || 0, chargeurRelie: ammo.id, chauffeActuelle: 0 }; const serverData = { ...data, inventoryConsommables }; if (turretIndex >= 0) { const turrets = [...(ship.armesTourelles ?? [])]; turrets[turretIndex] = { ...turrets[turretIndex], armes: [...turrets[turretIndex].armes] }; turrets[turretIndex].armes[index] = { ...turrets[turretIndex].armes[index], ...data }; setShip({ ...ship, armesTourelles: turrets, inventaireConsommables: inventoryConsommables }); await updateShipTurretWeaponState(ship.id, turretIndex, index, serverData) } else { const entries = [...(ship.armesPilote ?? [])]; entries[index] = { ...entries[index], ...data }; setShip({ ...ship, armesPilote: entries, inventaireConsommables: inventoryConsommables }); await updateShipWeaponState(ship.id, 'armesPilote', index, serverData) } }
    return <article className={`ship-weapon ship-weapon-${thermal ? 'thermal' : 'kinetic'}`} key={entry.id ?? index}><div className="ship-weapon-heading"><span className="ship-weapon-icon">{thermal ? '♨' : '✦'}</span><strong>{weapon.nom}</strong><span className="ship-tag">{thermal ? 'Thermique' : 'Cinétique'}</span></div><div className="ship-weapon-summary"><span>Dégâts {weapon.degats ?? '—'}</span>{weapon.cooldown != null && <span>Cooldown {weapon.cooldown} t</span>}{weapon.ballesParSalve != null && <span>{weapon.ballesParSalve} balle(s)/salve</span>}</div>{thermal ? <><div className="ship-meter"><span style={{ width: `${maxHeat ? Math.min(100, heat / maxHeat * 100) : 0}%` }} /></div><div className="ship-weapon-controls"><b>Chauffe {heat} / {maxHeat || '—'} MJ</b><button disabled={readOnly || heat <= 0} onClick={() => fire('chauffeActuelle', Math.max(0, heat - cooling))}>❄ Refroidir</button><button disabled={readOnly || (maxHeat > 0 && heat >= maxHeat)} onClick={() => fire('chauffeActuelle', Math.min(maxHeat || heat + 10, heat + (Number(weapon.chauffe) || 10)))}>♨ Tirer</button><button disabled={readOnly} onClick={reload}>Changer de cartouche</button></div><small className="ship-muted">Cartouche : {loaded?.nom ?? 'aucune'} · refroidissement {cooling}</small></> : <div className="ship-weapon-controls"><b>Munitions {ammoCount} / {Number(weapon.chargeur) || '—'}</b><button disabled={readOnly || ammoCount <= 0} onClick={() => fire('munitionsActuelles', Math.max(0, ammoCount - (Number(weapon.ballesParSalve) || 1)))}>✦ Tirer</button><button disabled={readOnly} onClick={reload}>↻ Recharger la réserve</button></div>}</article>
  }
  const weaponList = (entries: any[], turretIndex = -1, thermal?: boolean) => { const filtered = entries.filter((entry: any) => thermal === undefined || (object(entry.arme)?.type === 'thermique') === thermal); return filtered.length ? filtered.map((entry, index) => renderWeapon(entry, index, turretIndex)) : <p className="ship-muted">Aucune arme installée.</p> }
  const groupedRoles = ['pilote', 'copilote', 'canonnier', 'passager']

  return <div className={`ship-content ss-container${readOnly ? ' ship-read-only' : ''}`}>
    <div className="ship-stats-grid"><div className="ship-stat ship-stat-armor"><span>◈ Blindage</span><strong>{stats.armor} / {stats.maxArmor}</strong></div><div className={`ship-stat ${stats.overConsumption ? 'ship-stat-warning' : ''}`}><span>⚡ Consommation</span><strong>{stats.consumption} / {stats.power}</strong>{stats.overConsumption && <small>Capacité dépassée</small>}</div><div className="ship-stat"><span>◉ Esquive</span><strong>{stats.evasion}</strong><small>{stats.evasionBase} + {stats.evasionPilot} + {stats.evasionThrusters}</small></div><div className={`ship-stat ${shieldTotal > stats.maxShield ? 'ship-stat-warning' : ''}`}><span>⬡ Boucliers</span><strong>{shieldTotal} / {stats.maxShield}</strong>{shieldTotal > stats.maxShield && <small>Maximum dépassé</small>}</div></div>
    <section className="ship-card ship-crew-card"><h2 className="ship-card-title">Équipage · {crew.length}</h2><div className="ship-crew-grid">{groupedRoles.map((role) => <div className="ship-crew-group" key={role}><h3>{roleLabels[role]}</h3>{crew.filter((member) => (member.roleVaisseau || 'passager') === role).map((member) => <div className="ship-crew-item" key={member.id}><span className="ship-crew-name">{member.nom || 'Sans nom'}</span><select disabled={readOnly} value={member.roleVaisseau || 'passager'} onChange={(event) => changeRole(member, event.target.value)}>{Object.entries(roleLabels).map(([value, text]) => <option value={value} key={value}>{text}</option>)}</select></div>)}{!crew.some((member) => (member.roleVaisseau || 'passager') === role) && <p className="ship-muted">Aucun</p>}</div>)}</div></section>
    <div className="ship-main-grid"><div className="ship-column"><section className="ship-card"><h2 className="ship-card-title">État du vaisseau</h2><div className="ship-form-grid"><label className="ship-field"><span>Blindage actuel</span><input type="number" min="0" value={ship.blindageActuel ?? stats.maxArmor} disabled={readOnly} onChange={(event) => updateArmor(Number(event.target.value))} /></label><label className="ship-field"><span>Bouclier avant · local</span><input type="number" min="0" value={shieldFront} disabled={readOnly} onChange={(event) => setShieldFront(Number(event.target.value))} /></label><label className="ship-field"><span>Bouclier arrière · local</span><input type="number" min="0" value={shieldRear} disabled={readOnly} onChange={(event) => setShieldRear(Number(event.target.value))} /></label><label className="ship-field"><span>Recharge · local</span><input type="number" min="0" value={shieldRecharge} disabled={readOnly} onChange={(event) => setShieldRecharge(Number(event.target.value))} /></label><label className="ship-field"><span>Cooldown · local</span><input type="number" min="0" value={shieldCooldown} disabled={readOnly} onChange={(event) => setShieldCooldown(Number(event.target.value))} /></label></div>{shieldTotal > stats.maxShield && <p className="ship-warning">⚠ Le total des boucliers dépasse le maximum prévu ({stats.maxShield}).</p>}</section><section className="ship-card"><h2 className="ship-card-title">Modèle et châssis</h2><div className="ship-tags"><span className="ship-tag">{object(ship.modele)?.nom ?? 'Modèle indéfini'}</span><span className="ship-tag ship-tag-class">Classe {chassis?.classe ?? '—'}</span><span className="ship-tag">{chassis?.categorie ?? '—'}</span></div><dl className="ship-dl"><div className="ship-dl-row"><dt>Blindage de base</dt><dd>{chassis?.blindage ?? 0}</dd></div><div className="ship-dl-row"><dt>Capacités</dt><dd>{limits.pilotWeaponPoints} pts pilote · {limits.turretCount} tourelles</dd></div><div className="ship-dl-row"><dt>Esquive</dt><dd>{stats.evasionBase} + {stats.evasionPilot} pilote + {stats.evasionThrusters} propulseurs</dd></div></dl></section><section className="ship-card"><h2 className="ship-card-title">Modules</h2><div className="ship-form-grid">{moduleField('Générateur', 'moduleGenerateur')}{moduleField('Propulseurs', 'modulePropulseurs')}{moduleField('Survie', 'moduleSurvie')}{moduleField('Boucliers', 'moduleBoucliers')}</div><div className="ship-subtitle-line"><h3 className="ship-subtitle">Modules supplémentaires</h3><span className="ship-tag">{(draft.modulesSupplementaires ?? []).length} / {limits.moduleSlots}</span></div>{(draft.modulesSupplementaires ?? []).map((module: any, index: number) => <div className="ship-equipment-row" key={id(module) ?? index}><strong>{object(module)?.nom ?? 'Module'}</strong><button disabled={readOnly} onClick={() => setDraftValue('modulesSupplementaires', draft.modulesSupplementaires.filter((_: any, i: number) => i !== index))}>Retirer</button></div>)}</section></div><div className="ship-column"><section className="ship-card"><h2 className="ship-card-title">Armes thermiques</h2>{weaponList(ship.armesPilote ?? [], -1, true)}{(ship.armesTourelles ?? []).map((turret: any, index: number) => <div key={index}>{weaponList(turret.armes ?? [], index, true)}</div>)}</section><section className="ship-card"><h2 className="ship-card-title">Armes cinétiques</h2>{weaponList(ship.armesPilote ?? [], -1, false)}{(ship.armesTourelles ?? []).map((turret: any, index: number) => <div key={index}>{weaponList(turret.armes ?? [], index, false)}</div>)}</section><section className="ship-card"><h2 className="ship-card-title">Réserves</h2><div className="ship-inventory-grid">{(ship.inventaireConsommables ?? []).map((entry: any, index: number) => <span className="ship-tag" key={entry.id ?? index}>{object(entry.consommable)?.nom ?? 'Munition'} × {entry.quantite ?? 0}</span>)}{!(ship.inventaireConsommables ?? []).length && <p className="ship-muted">Aucune munition en réserve.</p>}</div></section></div></div>
    <div className="ship-actions">{modified && <button className="ss-button secondary" onClick={() => { setDraft(ship); setModified(false) }} disabled={saving}>Annuler</button>}<button className="ss-button primary" onClick={save} disabled={!modified || saving}>{saving ? 'Enregistrement…' : 'Valider la configuration'}</button></div>
  </div>
}
