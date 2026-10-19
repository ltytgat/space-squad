'use client'

import { useEffect, useMemo, useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { isAmmoCompatibleWith } from '@/lib/shipWeaponAmmo'
import { equipVehicleWeapon, fireVehicleWeapon, reloadVehicleWeapon, updateVehicleArmor } from '../actions'

const object = (value: any) => value && typeof value === 'object' ? value : null
const idOf = (value: any) => object(value)?.id ?? value
const roundHeat = (value: number) => Math.round(value * 100) / 100
const numberFrom = (value: unknown) => {
  const match = String(value ?? '').replace(',', '.').match(/-?\d+(?:\.\d+)?/)
  return match ? Number(match[0]) : 0
}
const coolingFrom = (ammo: any) => {
  const match = String(ammo?.bonus ?? '').match(/refroidissement\s*:\s*([+-]?\d+)/i)
  return match ? Number(match[1]) : 0
}
const VEHICLE_CLASS_SIZE: Record<string, number> = { alpha: 1, beta: 2, gamma: 3 }
const VEHICLE_CLASS_LABEL: Record<string, string> = { alpha: 'Alpha', beta: 'Bêta', gamma: 'Gamma' }

export function VehicleClient({
  vehicle,
  ownerName,
  canEdit,
  canManageEquipment,
  activeShipName,
  weapons,
  ammunition,
}: {
  vehicle: any
  ownerName: string | null
  canEdit: boolean
  canManageEquipment: boolean
  activeShipName: string | null
  weapons: any[]
  ammunition: any[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [armorDraft, setArmorDraft] = useState(String(vehicle.blindageActuel ?? 0))
  const [selectedAmmo, setSelectedAmmo] = useState('')
  const [localHeat, setLocalHeat] = useState(0)
  const [error, setError] = useState('')
  const model = object(vehicle.modele) ?? {}
  const weapon = object(vehicle.armeTourelle)
  const magazine = object(vehicle.chargeurRelie)
  const armorMax = Number(model.blindageMax) || 0
  const currentWeaponId = String(idOf(vehicle.armeTourelle) ?? '')
  const currentAmmoId = String(idOf(vehicle.chargeurRelie) ?? '')
  const turretClass = String(model.tourelleClasseMax ?? '')
  const turretSize = VEHICLE_CLASS_SIZE[turretClass] ?? 0
  const compatibleWeapons = weapons.filter((item) => Number(item.taille) <= turretSize)
  const compatibleAmmo = useMemo(() => ammunition.filter((item) => weapon && isAmmoCompatibleWith(weapon, item)), [ammunition, weapon])
  const selectedAmmoItem = compatibleAmmo.find((item) => String(item.id) === selectedAmmo)

  useEffect(() => setArmorDraft(String(vehicle.blindageActuel ?? 0)), [vehicle.blindageActuel])
  useEffect(() => setLocalHeat(0), [currentWeaponId])
  useEffect(() => {
    if (!compatibleAmmo.some((item) => String(item.id) === selectedAmmo)) {
      const preferred = compatibleAmmo.find((item) => String(item.id) === currentAmmoId) ?? compatibleAmmo[0]
      setSelectedAmmo(preferred ? String(preferred.id) : '')
    }
  }, [compatibleAmmo, currentAmmoId, selectedAmmo])

  const runAction = (action: () => Promise<unknown>, onSuccess?: () => void) => {
    setError('')
    startTransition(async () => {
      try {
        await action()
        onSuccess?.()
        router.refresh()
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'La modification a échoué.')
      }
    })
  }

  const saveArmor = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = Number(armorDraft)
    if (!Number.isSafeInteger(value) || value < 0 || value > armorMax) {
      setError(`Le blindage doit être un entier compris entre 0 et ${armorMax}.`)
      return
    }
    runAction(() => updateVehicleArmor(vehicle.id, value))
  }

  const changeWeapon = (value: string) => {
    const weaponId = value ? Number(value) : null
    runAction(() => equipVehicleWeapon(vehicle.id, weaponId))
  }

  const thermal = weapon?.type === 'thermique'
  const kinetic = weapon?.type === 'cinetique'
  const explosive = weapon?.type === 'explosif'
  const ammoCount = Number(vehicle.munitionsActuelles) || 0
  const ammoCapacity = explosive ? 1 : Number(weapon?.chargeur) || 0
  const ammoCost = explosive ? 1 : Number(weapon?.ballesParSalve) || 1
  const maxHeat = thermal ? numberFrom(magazine?.calibre) : 0
  const heatCost = Number(weapon?.chauffe) || 10
  const cooling = thermal ? coolingFrom(magazine) : 0
  const canFireThermal = maxHeat <= 0 || localHeat + heatCost <= maxHeat

  return <div className="ss-container vehicle-sheet">
    {error && <p className="vehicle-error" role="alert">{error}</p>}
    {!canEdit && <p className="vehicle-readonly-note">Consultation en lecture seule · propriétaire : {ownerName ?? 'inconnu'}</p>}

    <section className="vehicle-sheet-card">
      <div className="vehicle-section-heading"><div><span className="vehicle-eyebrow">État actuel</span><h2>Blindage</h2></div><span className="vehicle-tag">{vehicle.blindageActuel ?? 0} / {armorMax}</span></div>
      {canEdit ? <form className="vehicle-armor-form" onSubmit={saveArmor}>
        <label>Blindage courant<input type="number" required min={0} max={armorMax} step={1} value={armorDraft} onChange={(event) => setArmorDraft(event.target.value)} /></label>
        <button type="submit" disabled={pending || Number(armorDraft) === Number(vehicle.blindageActuel)}>Enregistrer</button>
      </form> : <p className="vehicle-stat-value">{vehicle.blindageActuel ?? 0} / {armorMax}</p>}
    </section>

    <section className="vehicle-sheet-card">
      <div className="vehicle-section-heading"><div><span className="vehicle-eyebrow">Caractéristiques fixes</span><h2>{model.nom ?? 'Modèle inconnu'}</h2></div><span className="vehicle-tag">{model.variante?.nom ?? 'Véhicule'}</span></div>
      <div className="vehicle-stats-grid">
        <VehicleStat label="Places" value={model.places} />
        <VehicleStat label="Emports d’armes des personnages" value={model.emportsArmesPersonnages} />
        <VehicleStat label="Blindage maximal" value={model.blindageMax} />
        <VehicleStat label="Bouclier maximal" value={model.bouclierMax} />
        <VehicleStat label="Recharge du bouclier" value={model.rechargeBouclier} />
        <VehicleStat label="Mouvement" value={model.mouvement} />
        {model.prix != null && <VehicleStat label="Prix du modèle" value={`${model.prix} konis`} />}
        {Number(model.turboBonus) > 0 && <VehicleStat label="Bonus Turbo" value={`+${model.turboBonus}`} />}
        {Number(model.remorqueIndicePoids) > 0 && <VehicleStat label="Indice de poids de remorque" value={model.remorqueIndicePoids} />}
      </div>
      {(model.toutTerrain || model.supportArme) && <div className="vehicle-options">{model.toutTerrain && <span>Tout-terrain</span>}{model.supportArme && <span>Support d’arme</span>}</div>}
      {model.image?.url && <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="vehicle-model-image" src={model.image.url} alt={model.image.alt ?? model.nom ?? 'Illustration du véhicule'} />
      </>}
    </section>

    {turretClass ? <section className="vehicle-sheet-card">
      <div className="vehicle-section-heading"><div><span className="vehicle-eyebrow">Tourelle · classe {VEHICLE_CLASS_LABEL[turretClass] ?? turretClass}</span><h2>Armement</h2></div><span className="vehicle-tag">Taille maximale {turretSize}</span></div>
      {weapon ? <div className="vehicle-weapon-summary">
        <strong>{weapon.nom}</strong>
        <div className="vehicle-stats-grid">
          <VehicleStat label="Type" value={weapon.type} />
          <VehicleStat label="Taille" value={weapon.taille} />
          {weapon.degats && <VehicleStat label="Dégâts" value={weapon.degats} />}
          {weapon.categorie && <VehicleStat label="Catégorie" value={weapon.categorie} />}
          {weapon.type === 'thermique' && weapon.chauffe != null && <VehicleStat label="Chauffe" value={`${weapon.chauffe} MJ`} />}
          {weapon.type === 'cinetique' && weapon.chargeur != null && <VehicleStat label="Capacité" value={weapon.chargeur} />}
          {weapon.type === 'cinetique' && weapon.ballesParSalve != null && <VehicleStat label="Balles par salve" value={weapon.ballesParSalve} />}
          {weapon.type === 'explosif' && weapon.distance && <VehicleStat label="Distance / champ d’action" value={weapon.distance} />}
          {weapon.cooldown != null && <VehicleStat label="Cooldown" value={`${weapon.cooldown} t`} />}
        </div>
        {thermal
          ? <p className="vehicle-ammo-state">Cartouche liée : {magazine?.nom ?? 'aucune'}{magazine?.calibre ? ` · calibre ${magazine.calibre}` : ''} · refroidissement {cooling}</p>
          : <p className="vehicle-ammo-state">Munitions : {ammoCount} / {ammoCapacity || '—'} · {magazine?.nom ?? 'aucune munition liée'}{kinetic && magazine?.bonus ? ` · ${magazine.bonus}` : ''}</p>}
      </div> : <p className="vehicle-muted">Aucune arme équipée.</p>}

      {weapon && thermal && <div className="vehicle-weapon-operation">
        <div className="vehicle-heat-meter" role="meter" aria-label="Chauffe de l’arme" aria-valuenow={localHeat} aria-valuemin={0} aria-valuemax={maxHeat || 0}>
          <span style={{ width: `${maxHeat ? Math.min(100, (localHeat / maxHeat) * 100) : 0}%` }} />
        </div>
        <div className="vehicle-weapon-controls">
          <b>Chauffe {localHeat} / {maxHeat || '—'} MJ</b>
          {canEdit && <>
            <button type="button" disabled={localHeat <= 0} onClick={() => setLocalHeat(roundHeat(Math.max(0, localHeat - cooling)))}>❄ Refroidir</button>
            <button type="button" disabled={!canFireThermal} onClick={() => setLocalHeat(roundHeat(localHeat + heatCost))}>☼ Tirer</button>
          </>}
        </div>
      </div>}

      {weapon && (kinetic || explosive) && <div className="vehicle-weapon-controls vehicle-weapon-operation">
        <b>{explosive ? 'Charge' : 'Munitions'} {ammoCount} / {ammoCapacity || '—'}</b>
        {canEdit && <button type="button" disabled={pending || ammoCount < ammoCost} onClick={() => runAction(() => fireVehicleWeapon(vehicle.id))}>✦ Tirer{ammoCost > 1 ? ` (${ammoCost} par salve)` : ''}</button>}
      </div>}

      {canEdit && <div className="vehicle-equipment-controls">
        <label>Arme présente dans la soute du vaisseau actif<select value={currentWeaponId} disabled={!canManageEquipment || pending} onChange={(event) => changeWeapon(event.target.value)}>
          <option value="">Retirer l’arme / laisser la tourelle vide</option>
          {weapon && !compatibleWeapons.some((item) => String(item.id) === currentWeaponId) && <option value={currentWeaponId}>{weapon.nom} · déjà équipée</option>}
          {compatibleWeapons.map((item) => <option key={item.id} value={item.id}>{item.nom} · taille {item.taille} · {item.quantity} disponible(s)</option>)}
        </select></label>
        {!canManageEquipment && <p className="vehicle-muted">{activeShipName ? `Vous ne pouvez pas modifier ${activeShipName}.` : 'Un vaisseau actif modifiable est nécessaire pour gérer la tourelle.'}</p>}
      </div>}

      {weapon && (thermal || kinetic || explosive) && canEdit && <div className="vehicle-reload-controls">
        <label>Munition disponible dans la soute du vaisseau actif<select value={selectedAmmo} disabled={!canManageEquipment || pending || compatibleAmmo.length === 0} onChange={(event) => setSelectedAmmo(event.target.value)}>
          <option value="">Aucune munition compatible</option>
          {compatibleAmmo.map((item) => <option key={item.id} value={item.id}>{item.nom} · {item.quantity} disponible(s)</option>)}
        </select></label>
        <button type="button" disabled={!canManageEquipment || pending || !selectedAmmoItem} onClick={() => runAction(() => reloadVehicleWeapon(vehicle.id, Number(selectedAmmo)), () => { if (thermal) setLocalHeat(0) })}>
          {magazine && currentAmmoId !== selectedAmmo ? 'Changer de munition et recharger' : weapon.type === 'thermique' ? 'Changer de cartouche' : 'Recharger'}
        </button>
        {!canManageEquipment && <p className="vehicle-muted">Le rechargement utilise uniquement les réserves du vaisseau actif modifiable.</p>}
      </div>}
    </section> : <section className="vehicle-sheet-card"><div className="vehicle-section-heading"><h2>Tourelle</h2></div><p className="vehicle-muted">Ce modèle ne dispose pas d’emplacement de tourelle.</p></section>}
  </div>
}

function VehicleStat({ label, value }: { label: string; value: unknown }) {
  if (value == null || value === '') return null
  return <div className="vehicle-stat"><span>{label}</span><strong>{String(value)}</strong></div>
}
