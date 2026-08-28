'use client'

import { useMemo, useState } from 'react'
import { getChassis, getShipLimits, getShipStats } from '@/lib/shipStats'
import { StatTooltip, type StatTooltipData } from '@/components/StatTooltip'
import {
  updateCrewRole,
  updateShipConfiguration,
  updateShipState,
  updateShipTurretWeaponState,
  updateShipWeaponState,
  logShipAmmoState,
} from './actions'

const object = (value: any) => (typeof value === 'object' && value ? value : null)
const isTurretModule = (value: any) => object(value)?.typeModule === 'tourelle'
const id = (value: any) => object(value)?.id ?? value
const numberFrom = (value: unknown) => {
  const match = String(value ?? '')
    .replace(',', '.')
    .match(/-?\d+(?:\.\d+)?/)
  return match ? Number(match[0]) : 0
}
const coolingFrom = (ammo: any) => {
  const match = String(ammo?.bonus ?? '').match(/refroidissement\s*:\s*([+-]?\d+)/i)
  return match ? Number(match[1]) : 0
}
const isAmmunition = (item: any) =>
  /cartouche|chargeur|munition|balle|obus|cinetique/i.test(`${item?.nom ?? ''} ${item?.categorie ?? ''}`)
const isKineticAmmunition = (item: any) =>
  isAmmunition(item) && !/cartouche/i.test(`${item?.nom ?? ''} ${item?.typeMunition ?? ''}`)
const ammoName = (item: any) => String(item?.nom ?? '').normalize('NFKC').replace(/\s+/gu, ' ').trim()
const sameAmmo = (left: any, right: any) => ammoName(left) === ammoName(right) && Boolean(ammoName(left))
const isExplosiveAmmoFor = (weapon: any, ammo: any) => {
  const weaponCategory = String(weapon?.categorie ?? '').toLowerCase()
  const weaponName = String(weapon?.nom ?? '').toLowerCase()
  const ammoNameValue = String(ammo?.nom ?? '').toLowerCase()
  if (weaponCategory === 'mine' || weaponName.includes('mine')) return /mine/.test(ammoNameValue)
  if (weaponCategory === 'lance-missile' || weaponName.includes('missile')) return /roquette|missile/.test(ammoNameValue)
  return false
}
const isAmmoCompatibleWith = (weapon: any, ammo: any) => {
  if (weapon?.type === 'thermique') return /cartouche/i.test(`${ammo?.typeMunition ?? ''} ${ammo?.nom ?? ''}`)
  if (weapon?.type === 'explosif') return isExplosiveAmmoFor(weapon, ammo)
  return isKineticAmmunition(ammo)
}

export function ShipClient({
  ship: initialShip,
  crew: initialCrew,
  readOnly = false,
}: {
  ship: any
  crew: any[]
  isAdmin?: boolean
  readOnly?: boolean
}) {
  const [ship, setShip] = useState(initialShip)
  const [crew, setCrew] = useState(initialCrew)
  const [draft, setDraft] = useState(initialShip)
  const [modified, setModified] = useState(false)
  const [saving, setSaving] = useState(false)
  const maxShield = getShipStats(initialShip).maxShield || 0
  const [shieldFront, setShieldFront] = useState(Math.ceil(maxShield / 2))
  const [shieldRear, setShieldRear] = useState(Math.floor(maxShield / 2))
  const shieldModule = object(initialShip.moduleBoucliers)
  const shieldRecharge = Number(shieldModule?.rechargeBouclier ?? 0)
  const shieldCooldown = Number(shieldModule?.cooldownBouclier ?? 0)
  const [hoveredStat, setHoveredStat] = useState<{
    data: StatTooltipData
    x: number
    y: number
  } | null>(null)
  const [weaponSelector, setWeaponSelector] = useState<{
    turretIndex: number
    weaponIndex: number
  } | null>(null)
  const [ammoSelector, setAmmoSelector] = useState<{
    turretIndex: number
    weaponIndex: number
  } | null>(null)
  const chassis = getChassis(ship)
  const limits = getShipLimits(ship)
  const stats = useMemo(() => getShipStats({ ...ship, crew }), [ship, crew])
  const additionalModules = (draft.modulesSupplementaires ?? [])
    .map((module: any, index: number) => ({ module, index }))
    .filter(({ module }: any) => !isTurretModule(module))
  const shieldTotal = shieldFront + shieldRear
  const showStatTooltip = (event: React.MouseEvent, data: StatTooltipData) =>
    setHoveredStat({ data, x: event.clientX, y: event.clientY })

  const setDraftValue = (key: string, value: any) => {
    if (!readOnly) {
      setDraft((current: any) => ({ ...current, [key]: value }))
      setModified(true)
    }
  }
  const save = async () => {
    if (readOnly || !modified) return
    setSaving(true)
    try {
      const fields = [
        'moduleGenerateur',
        'modulePropulseurs',
        'moduleSurvie',
        'moduleBoucliers',
        'modulesSupplementaires',
        'armesPilote',
        'armesTourelles',
        'consommablesVaisseau',
        'inventaireModules',
        'inventaireArmes',
        'inventaireConsommables',
      ]
      const data: any = {}
      fields.forEach((field) => {
        if (draft[field] !== undefined) data[field] = draft[field]
      })
      await updateShipConfiguration(ship.id, data)
      setShip(draft)
      setModified(false)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }
  const updateArmor = async (value: number) => {
    if (readOnly) return
    const next = { ...ship, blindageActuel: Math.max(0, value) }
    setShip(next)
    try {
      await updateShipState(ship.id, { blindageActuel: next.blindageActuel })
    } catch {
      alert('Impossible de mettre à jour le blindage.')
    }
  }
  const changeRole = async (member: any, role: string) => {
    if (readOnly) return
    const [nextRole, turretValue] = role.split(':')
    const turretNumber = turretValue ? Number(turretValue) : undefined
    const currentRoleValue = (entry: any) =>
      entry.roleVaisseau === 'canonnier'
        ? `canonnier:${ship.canonniers?.find((slot: any) => String(id(slot.personnage)) === String(entry.id))?.tourelle ?? ''}`
        : entry.roleVaisseau || 'passager'
    const next = crew.map((entry) => {
      const current = currentRoleValue(entry)
      const displaced =
        (nextRole === 'pilote' && current === 'pilote') ||
        (nextRole === 'copilote' && current === 'copilote') ||
        (nextRole === 'canonnier' && current === `canonnier:${turretNumber}`)
      return entry.id === member.id
        ? { ...entry, roleVaisseau: nextRole }
        : displaced
          ? { ...entry, roleVaisseau: 'passager' }
          : entry
    })
    setCrew(next)
    const nextCannoniers = (ship.canonniers ?? []).filter(
      (slot: any) =>
        String(id(slot.personnage)) !== String(member.id) && Number(slot.tourelle) !== turretNumber,
    )
    if (nextRole === 'canonnier' && turretNumber)
      nextCannoniers.push({ personnage: member.id, tourelle: turretNumber })
    setShip({
      ...ship,
      pilote:
        nextRole === 'pilote'
          ? member.id
          : String(id(ship.pilote)) === String(member.id)
            ? null
            : ship.pilote,
      copilote:
        nextRole === 'copilote'
          ? member.id
          : String(id(ship.copilote)) === String(member.id)
            ? null
            : ship.copilote,
      canonniers: nextCannoniers,
    })
    try {
      await updateCrewRole(ship.id, member.id, nextRole as any, turretNumber)
    } catch {
      setCrew(crew)
      alert('Impossible de modifier le poste.')
    }
  }
  const moduleField = (label: string, key: string) => {
    const modules = ship.inventaireModules ?? []
    const current = object(draft[key])
    const choices = [
      ...modules.map((entry: any) => object(entry.module)).filter(Boolean),
      current,
    ].filter(
      (module, position, all) =>
        module && all.findIndex((item) => id(item) === id(module)) === position,
    )
    return (
      <label className="ship-field">
        <span>{label}</span>
        <select
          disabled={readOnly}
          value={id(draft[key]) ?? ''}
          onChange={(event) => setDraftValue(key, Number(event.target.value) || null)}
        >
          <option value="">Aucun</option>
          {choices.map((module: any) => (
            <option key={id(module)} value={id(module)}>
              {module.nom}
            </option>
          ))}
        </select>
      </label>
    )
  }
  const updateWeapon = async (
    slot: 'armesPilote' | 'armesTourelles',
    index: number,
    key: string,
    value: number,
    turretIndex = -1,
  ) => {
    if (readOnly) return
    if (turretIndex >= 0) {
      const turrets = [...(ship.armesTourelles ?? [])]
      turrets[turretIndex] = {
        ...turrets[turretIndex],
        armes: [...(turrets[turretIndex].armes ?? [])],
      }
      turrets[turretIndex].armes[index] = { ...turrets[turretIndex].armes[index], [key]: value }
      setShip({ ...ship, armesTourelles: turrets })
      await updateShipTurretWeaponState(ship.id, turretIndex, index, { [key]: value } as any)
    } else {
      const entries = [...(ship[slot] ?? [])]
      entries[index] = { ...entries[index], [key]: value }
      setShip({ ...ship, [slot]: entries })
      await updateShipWeaponState(ship.id, slot, index, { [key]: value } as any)
    }
  }
  const weaponSources = () =>
    [
      ...(ship.inventaireArmes ?? [])
        .map((entry: any, index: number) => ({
          kind: 'inventory',
          label: 'Soute',
          index,
          entry,
          weapon: object(entry.arme),
        }))
        .filter((source: any) => Number(source.entry.quantite ?? 0) > 0),
      ...(ship.armesPilote ?? []).map((entry: any, index: number) => ({
        kind: 'equipped',
        label: 'Pilote',
        turretIndex: -1,
        index,
        entry,
        weapon: object(entry.arme),
      })),
      ...(ship.armesTourelles ?? []).flatMap((turret: any, turretIndex: number) =>
        (turret.armes ?? []).map((entry: any, index: number) => ({
          kind: 'equipped',
          label: `Tourelle ${turret.tourelle ?? turretIndex + 1}`,
          turretIndex,
          index,
          entry,
          weapon: object(entry.arme),
        })),
      ),
    ].filter((source) => source.weapon)
  const selectWeaponSource = (source: any) => {
    if (readOnly || !weaponSelector) return
    const targetIndex = weaponSelector.weaponIndex
    const targetTurret = weaponSelector.turretIndex
    const targetEntries =
      targetTurret >= 0 ? ship.armesTourelles[targetTurret].armes : ship.armesPilote
    const target = targetEntries[targetIndex]
    const next = { ...ship }
    const setTarget = (value: any) => {
      if (targetTurret >= 0) {
        next.armesTourelles = [...(ship.armesTourelles ?? [])]
        next.armesTourelles[targetTurret] = {
          ...next.armesTourelles[targetTurret],
          armes: [...next.armesTourelles[targetTurret].armes],
        }
        next.armesTourelles[targetTurret].armes[targetIndex] = value
      } else {
        next.armesPilote = [...(ship.armesPilote ?? [])]
        next.armesPilote[targetIndex] = value
      }
    }
    if (source.kind === 'inventory') {
      const inventory = [...(ship.inventaireArmes ?? [])]
      inventory[source.index] = {
        ...inventory[source.index],
        quantite: Number(inventory[source.index].quantite ?? 1) - 1,
      }
      const oldIndex = inventory.findIndex(
        (entry: any) => String(id(entry.arme)) === String(id(target.arme)),
      )
      if (oldIndex >= 0)
        inventory[oldIndex] = {
          ...inventory[oldIndex],
          quantite: Number(inventory[oldIndex].quantite ?? 0) + 1,
        }
      else inventory.push({ arme: target.arme, quantite: 1 })
      next.inventaireArmes = inventory.filter((entry: any) => entry.quantite > 0)
      setTarget({
        ...target,
        arme: source.weapon,
        munitionsActuelles: 0,
        chauffeActuelle: 0,
        chargeurRelie: null,
      })
    } else {
      const sourceEntries =
        source.turretIndex >= 0 ? ship.armesTourelles[source.turretIndex].armes : ship.armesPilote
      const sourceValue = sourceEntries[source.index]
      const targetValue = { ...target }
      if (source.turretIndex >= 0) {
        next.armesTourelles = [...(next.armesTourelles ?? [])]
        next.armesTourelles[source.turretIndex] = {
          ...next.armesTourelles[source.turretIndex],
          armes: [...next.armesTourelles[source.turretIndex].armes],
        }
        next.armesTourelles[source.turretIndex].armes[source.index] = targetValue
      } else {
        next.armesPilote = [...(next.armesPilote ?? [])]
        next.armesPilote[source.index] = targetValue
      }
      setTarget(sourceValue)
    }
    setShip(next)
    setDraft(next)
    setModified(true)
    setWeaponSelector(null)
  }
  const renderWeapon = (entry: any, index: number, turretIndex = -1) => {
    const weapon = object(entry.arme)
    if (!weapon) return null
    const thermal = weapon.type === 'thermique'
    const explosive = weapon.type === 'explosif'
    const kinetic = !thermal && !explosive
    const inventoryEntries = ship.inventaireConsommables ?? []
    const loaded = object(entry.chargeurRelie)
    const compatibleEntries = inventoryEntries.filter((item: any) => {
      const ammo = object(item.consommable)
      const isTypeCompatible = isAmmoCompatibleWith(weapon, ammo)
      return isTypeCompatible && Number(item.quantite ?? 0) > 0
    })
    const compatible = compatibleEntries
      .map((item: any) => object(item.consommable))
      .filter(Boolean)
    const maxHeat = thermal ? numberFrom(loaded?.calibre) : 0
    const cooling = thermal ? coolingFrom(loaded) : 0
    const heat = Number(entry.chauffeActuelle ?? 0)
    const ammoCount = Number(entry.munitionsActuelles ?? 0)
    const capacity = explosive ? 1 : Number(weapon.chargeur) || 0
    const fire = (key: string, value: number) =>
      updateWeapon(
        turretIndex >= 0 ? 'armesTourelles' : 'armesPilote',
        index,
        key,
        value,
        turretIndex,
      )
    const reload = async () => {
      if (!thermal && capacity > 0 && ammoCount >= capacity) {
        console.info('[ship-ammo] chargeur plein', { weapon: weapon.nom, ammoCount, capacity, loaded: loaded?.nom })
        return alert('Chargeur plein')
      }
      const loadedEntry = loaded
        ? inventoryEntries.find((item: any) => sameAmmo(item.consommable, loaded) && Number(item.quantite ?? 0) > 0)
        : null
      console.info('[ship-ammo] comparaisons directes', inventoryEntries.map((item: any) => {
        const reserveName = String(object(item.consommable)?.nom ?? '')
        const loadedName = String(loaded?.nom ?? '')
        return { loaded: JSON.stringify(loadedName), reserve: JSON.stringify(reserveName), loadedLength: loadedName.length, reserveLength: reserveName.length, strictEqual: loadedName === reserveName, quantity: item.quantite }
      }))
      if (loaded && !loadedEntry) {
        console.warn('[ship-ammo] comparaison sans résultat', {
          loadedRaw: JSON.stringify(loaded?.nom),
          loadedName: ammoName(loaded),
          reserveNames: inventoryEntries.map((item: any) => JSON.stringify(object(item.consommable)?.nom)),
          reserveNormalized: inventoryEntries.map((item: any) => ammoName(object(item.consommable))),
        })
      }
      if (kinetic && loaded && !loadedEntry && ammoCount <= 0) {
        await logShipAmmoState(ship.id, weapon.nom, loaded.nom)
        if (!compatible.length) return alert('Aucune munition compatible dans la rÃ©serve.')
        setAmmoSelector({ turretIndex, weaponIndex: index })
        return
      }
      const ammo = loadedEntry ? loadedEntry.consommable : (!loaded ? compatible[0] : null)
      const ammoEntry = loadedEntry ?? compatibleEntries[0]
      console.info('[ship-ammo] entrée retenue', { entryFound: Boolean(loadedEntry), entryAmmo: object(loadedEntry?.consommable)?.nom ?? null, ammo: ammo?.nom ?? null })
      console.info('[ship-ammo] recherche', { weapon: weapon.nom, loaded: loaded?.nom ?? null, ammoFound: ammo?.nom ?? null, reserve: inventoryEntries.map((item: any) => ({ name: object(item.consommable)?.nom ?? null, quantity: item.quantite })) })
      if (!ammo || !ammoEntry) await logShipAmmoState(ship.id, weapon.nom, loaded?.nom)
      if (!ammo || !ammoEntry) return alert('Aucune munition compatible dans la réserve.')
      const changingType = false
      const requiredUnits = thermal ? 1 : Math.max(0, capacity - (changingType ? 0 : ammoCount))
      const availableUnits = inventoryEntries
        .filter((item: any) => sameAmmo(item.consommable, ammo))
        .reduce((sum: number, item: any) => sum + Number(item.quantite ?? 0), 0)
      const loadUnits = thermal ? requiredUnits : Math.min(requiredUnits, availableUnits)
      if (loadUnits <= 0) return alert('Aucune munition compatible dans la réserve.')
      // A normal reload tops up the current magazine. Changing type is handled
      // by the selector below so the old magazine can be returned first.
      let remainingUnits = loadUnits
      let returnedUnits = changingType ? ammoCount : 0
      const inventoryConsommables = inventoryEntries
        .map((item: any) => {
          const itemId = id(object(item.consommable))
          let quantity = Number(item.quantite ?? 0)
          if (sameAmmo(item.consommable, ammo) && remainingUnits > 0) {
            const taken = Math.min(quantity, remainingUnits)
            quantity -= taken
            remainingUnits -= taken
          }
          if (itemId === id(loaded) && returnedUnits > 0) {
            quantity += returnedUnits
            returnedUnits = 0
          }
          return { ...item, quantite: quantity }
        })
      if (returnedUnits > 0) inventoryConsommables.push({ consommable: loaded.id, quantite: returnedUnits })
      const cleanedInventory = inventoryConsommables.filter((item: any) => item.quantite > 0)
      const data: any = {
        munitionsActuelles: thermal ? 0 : (changingType ? 0 : ammoCount) + loadUnits,
        chargeurRelie: ammo.id,
        chauffeActuelle: 0,
      }
      const serverData = { ...data, inventoryConsommables: cleanedInventory }
      const localData = { ...data, chargeurRelie: ammo }
      if (turretIndex >= 0) {
        const turrets = [...(ship.armesTourelles ?? [])]
        turrets[turretIndex] = { ...turrets[turretIndex], armes: [...turrets[turretIndex].armes] }
        turrets[turretIndex].armes[index] = { ...turrets[turretIndex].armes[index], ...localData }
        setShip({ ...ship, armesTourelles: turrets, inventaireConsommables: cleanedInventory })
        setDraft({ ...draft, armesTourelles: turrets, inventaireConsommables: cleanedInventory })
        await updateShipTurretWeaponState(ship.id, turretIndex, index, serverData)
      } else {
        const entries = [...(ship.armesPilote ?? [])]
        entries[index] = { ...entries[index], ...localData }
        setShip({ ...ship, armesPilote: entries, inventaireConsommables: cleanedInventory })
        setDraft({ ...draft, armesPilote: entries, inventaireConsommables: cleanedInventory })
        await updateShipWeaponState(ship.id, 'armesPilote', index, serverData)
      }
      setAmmoSelector(null)
    }
    const weaponType = thermal ? 'thermal' : explosive ? 'explosive' : 'kinetic'
    const weaponLabel = thermal ? 'Thermique' : explosive ? 'Explosif' : 'Cinétique'
    return (
      <article className={`ship-weapon ship-weapon-${weaponType}`} key={entry.id ?? index}>
        <div className="ship-weapon-heading">
          <span className="ship-weapon-icon">{thermal ? '♨' : explosive ? '◆' : '✦'}</span>
          <strong>{weapon.nom}</strong>
          <button
            className="ship-change-weapon"
            disabled={readOnly}
            onClick={() => setWeaponSelector({ turretIndex, weaponIndex: index })}
          >
            ⚙ Changer
          </button>
          <span className="ship-tag">{weaponLabel}</span>
        </div>
        <div className="ship-weapon-summary">
          <span>Dégâts {weapon.degats ?? '—'}</span>
          {weapon.cooldown != null && <span>Cooldown {weapon.cooldown} t</span>}
          {weapon.ballesParSalve != null && <span>{weapon.ballesParSalve} balle(s)/salve</span>}
          {explosive && weapon.distance != null && <span>Portée {weapon.distance}</span>}
          {kinetic && loaded && <span className="ship-ammo-effect">{loaded.nom} : {loaded.bonus || 'aucun bonus'}</span>}
        </div>
        {thermal ? (
          <>
            <div className="ship-meter">
              <span style={{ width: `${maxHeat ? Math.min(100, (heat / maxHeat) * 100) : 0}%` }} />
            </div>
            <div className="ship-weapon-controls">
              <b>
                Chauffe {heat} / {maxHeat || '—'} MJ
              </b>
              <button
                disabled={readOnly || heat <= 0}
                onClick={() => fire('chauffeActuelle', Math.max(0, heat - cooling))}
              >
                ❄ Refroidir
              </button>
              <button
                disabled={readOnly || (maxHeat > 0 && heat >= maxHeat)}
                onClick={() =>
                  fire(
                    'chauffeActuelle',
                    Math.min(maxHeat || heat + 10, heat + (Number(weapon.chauffe) || 10)),
                  )
                }
              >
                ♨ Tirer
              </button>
              <button
                disabled={readOnly || (!thermal && ammoCount >= Number(weapon.chargeur ?? 0))}
                onClick={reload}
              >
                Changer de cartouche
              </button>
            </div>
            <small className="ship-muted">
              Cartouche : {loaded?.nom ?? 'aucune'} · refroidissement {cooling}
            </small>
          </>
        ) : (
          <div className="ship-weapon-controls">
            <b>
              {explosive ? 'Charge' : 'Munitions'} {ammoCount} / {capacity || '—'}
            </b>
            <button
              disabled={readOnly || ammoCount <= 0}
              onClick={() =>
                fire(
                  'munitionsActuelles',
                  Math.max(0, ammoCount - (Number(weapon.ballesParSalve) || 1)),
                )
              }
            >
              ✦ Tirer
            </button>
            <button disabled={readOnly} onClick={reload}>
              ↻ Recharger
            </button>
            {(kinetic || explosive) && (
              <button disabled={readOnly} onClick={() => setAmmoSelector({ turretIndex, weaponIndex: index })}>
                Changer de munition
              </button>
            )}
          </div>
        )}
      </article>
    )
  }
  const weaponList = (entries: any[], turretIndex = -1) =>
    entries.length ? (
      entries.map((entry, index) => renderWeapon(entry, index, turretIndex))
    ) : (
      <p className="ship-muted">Aucune arme installée.</p>
    )
  const renderTurretModule = (moduleValue: any) => {
    const module = object(moduleValue)
    if (!module) return null
    const effects = [
      module.modificateurs && `Modificateurs : ${module.modificateurs}`,
      module.consommationSupplementaire != null && `Consommation supplémentaire : +${module.consommationSupplementaire}%`,
      module.portee && `Portée : ${module.portee}`,
      module.bonusDegatsPourcentage != null && `Bonus de dégâts : +${module.bonusDegatsPourcentage}%`,
      module.bonusDegatsPar100MJ != null && `Bonus de dégâts / 100 MJ : +${module.bonusDegatsPar100MJ}%`,
      module.mjMaxUtilisable != null && `MJ maximum utilisables : ${module.mjMaxUtilisable}`,
      module.angleTir && `Angle de tir : ${module.angleTir}`,
    ].filter(Boolean)
    return (
      <div className="ship-turret-module">
        <div className="ship-turret-module-heading">
          <span>Module de tourelle</span>
          <strong>{module.nom ?? 'Module'}</strong>
        </div>
        {effects.length > 0 ? (
          <div className="ship-turret-module-effects">
            {effects.map((effect, index) => <span key={index}>{effect}</span>)}
          </div>
        ) : (
          <span className="ship-muted">Aucun effet renseigné.</span>
        )}
        {module.description && <p className="ship-turret-module-description">{module.description}</p>}
      </div>
    )
  }
  const selectAmmoSource = async (source: any) => {
    if (readOnly || !ammoSelector) return
    const { turretIndex, weaponIndex } = ammoSelector
    const entries = turretIndex >= 0 ? ship.armesTourelles[turretIndex].armes : ship.armesPilote
    const entry = entries[weaponIndex]
    const weapon = object(entry?.arme)
    const loaded = object(entry?.chargeurRelie)
    if (!weapon || !source?.ammo) return
    const capacity = weapon.type === 'explosif' ? 1 : Number(weapon.chargeur) || 0
    const oldCount = Number(entry.munitionsActuelles ?? 0)
    const changingType = loaded && !sameAmmo(loaded, source.ammo)
    const needed = Math.max(0, capacity - (changingType ? 0 : oldCount))
    const available = (ship.inventaireConsommables ?? [])
      .filter((item: any) => sameAmmo(object(item.consommable), source.ammo))
      .reduce((sum: number, item: any) => sum + Number(item.quantite ?? 0), 0)
    const loadUnits = Math.min(needed, available)
    if (loadUnits <= 0) return alert('Aucune munition compatible dans la réserve.')
    let remaining = loadUnits
    let returned = changingType ? oldCount : 0
    const inventory = (ship.inventaireConsommables ?? []).map((item: any) => {
      const itemId = id(item.consommable)
      let quantity = Number(item.quantite ?? 0)
      if (sameAmmo(object(item.consommable), source.ammo) && remaining > 0) {
        const taken = Math.min(quantity, remaining)
        quantity -= taken
        remaining -= taken
      }
      if (sameAmmo(object(item.consommable), loaded) && returned > 0) { quantity += returned; returned = 0 }
      return { ...item, quantite: quantity }
    })
    if (returned > 0) inventory.push({ consommable: loaded.id, quantite: returned })
    const cleaned = inventory.filter((item: any) => item.quantite > 0)
    const data = { munitionsActuelles: (changingType ? 0 : oldCount) + loadUnits, chargeurRelie: source.ammo.id, chauffeActuelle: 0, inventoryConsommables: cleaned }
    if (turretIndex >= 0) {
      const turrets = [...(ship.armesTourelles ?? [])]
      turrets[turretIndex] = { ...turrets[turretIndex], armes: [...turrets[turretIndex].armes] }
      turrets[turretIndex].armes[weaponIndex] = { ...entry, ...data, chargeurRelie: source.ammo }
      setShip({ ...ship, armesTourelles: turrets, inventaireConsommables: cleaned })
      setDraft({ ...draft, armesTourelles: turrets, inventaireConsommables: cleaned })
      await updateShipTurretWeaponState(ship.id, turretIndex, weaponIndex, data)
    } else {
      const nextEntries = [...(ship.armesPilote ?? [])]
      nextEntries[weaponIndex] = { ...entry, ...data, chargeurRelie: source.ammo }
      setShip({ ...ship, armesPilote: nextEntries, inventaireConsommables: cleaned })
      setDraft({ ...draft, armesPilote: nextEntries, inventaireConsommables: cleaned })
      await updateShipWeaponState(ship.id, 'armesPilote', weaponIndex, data)
    }
    setAmmoSelector(null)
  }
  const renderWeaponLocation = (title: string, entries: any[], turretIndex = -1, slots = 0, turretModule?: any) => (
    <section className="ship-card" key={`${title}-${turretIndex}`}>
      <div className="ship-subtitle-line">
        <h2 className="ship-card-title">{title}</h2>
        <span className="ship-tag">{slots} emplacement(s)</span>
      </div>
      {turretModule && renderTurretModule(turretModule)}
      {weaponList(entries, turretIndex)}
    </section>
  )
  const turretNumbers = Array.from({ length: limits.turretCount }, (_, index) => index + 1)
  const memberRoleValue = (member: any) => {
    const memberId = String(member.id)
    if (String(id(ship.pilote)) === memberId || member.roleVaisseau === 'pilote') return 'pilote'
    if (String(id(ship.copilote)) === memberId || member.roleVaisseau === 'copilote')
      return 'copilote'
    if (member.roleVaisseau === 'canonnier') {
      const turret = ship.canonniers?.find(
        (slot: any) => String(id(slot.personnage)) === memberId,
      )?.tourelle
      if (turretNumbers.includes(Number(turret))) return `canonnier:${turret}`
    }
    return 'passager'
  }
  const groupedRoles = [
    { value: 'pilote', label: 'Pilote' },
    { value: 'copilote', label: 'Copilote' },
    ...turretNumbers.map((number) => ({
      value: `canonnier:${number}`,
      label: `Canonnier · Tourelle ${number}`,
    })),
    { value: 'passager', label: 'Équipage' },
  ]

  return (
    <div className={`ship-content ss-container${readOnly ? ' ship-read-only' : ''}`}>
      <div className="ship-stats-grid">
        <div className="ship-stat ship-stat-armor">
          <span>◈ Blindage</span>
          <strong>
            {stats.armor} / {stats.maxArmor}
          </strong>
        </div>
        <div
          className={`ship-stat ${stats.overConsumption ? 'ship-stat-generator-hot' : ''}`}
          onMouseEnter={(event) =>
            showStatTooltip(event, {
              label: 'Consommation',
              formula: 'Σ composants ≤ puissance générateur',
              components: [
                { label: 'Puissance générateur', value: stats.power },
                ...stats.consumptionBreakdown,
              ],
            })
          }
          onMouseMove={(event) =>
            hoveredStat && setHoveredStat({ ...hoveredStat, x: event.clientX, y: event.clientY })
          }
          onMouseLeave={() => setHoveredStat(null)}
        >
          <span>⚡ Consommation</span>
          <strong>
            {stats.consumption} / {stats.power}
          </strong>
          {stats.overConsumption && <small>Capacité dépassée</small>}
        </div>
        <div
          className="ship-stat"
          onMouseEnter={(event) =>
            showStatTooltip(event, {
              label: 'Esquive',
              formula: 'Base + bonus Habilité pilote + bonus propulseurs',
              components: [
                { label: 'Base vaisseau', value: stats.evasionBase },
                { label: 'Habilité pilote', value: stats.evasionPilot },
                { label: 'Propulseurs', value: stats.evasionThrusters },
              ],
            })
          }
          onMouseMove={(event) =>
            hoveredStat && setHoveredStat({ ...hoveredStat, x: event.clientX, y: event.clientY })
          }
          onMouseLeave={() => setHoveredStat(null)}
        >
          <span>◉ Esquive</span>
          <strong>{stats.evasion}</strong>
        </div>
        <div className={`ship-stat ${shieldTotal > stats.maxShield ? 'ship-stat-warning' : ''}`}>
          <span>⬡ Boucliers</span>
          <strong>
            {shieldTotal} / {stats.maxShield}
          </strong>
          {shieldTotal > stats.maxShield && <small>Maximum dépassé</small>}
        </div>
      </div>
      <section className="ship-card ship-crew-card">
        <h2 className="ship-card-title">Équipage · {crew.length}</h2>
        <div className="ship-crew-grid">
          {groupedRoles.map((role) => (
            <div className="ship-crew-group" key={role.value}>
              <h3>{role.label}</h3>
              {crew
                .filter((member) => memberRoleValue(member) === role.value)
                .map((member) => (
                  <div className="ship-crew-item" key={member.id}>
                    <span className="ship-crew-name">{member.nom || 'Sans nom'}</span>
                    <select
                      disabled={readOnly}
                      value={memberRoleValue(member)}
                      onChange={(event) => changeRole(member, event.target.value)}
                    >
                      {groupedRoles.map(({ value, label }) => (
                        <option value={value} key={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              {!crew.some((member) => memberRoleValue(member) === role.value) && (
                <p className="ship-muted">Aucun</p>
              )}
            </div>
          ))}
        </div>
      </section>
      <div className="ship-main-grid">
        <div className="ship-column">
          <section className="ship-card">
            <h2 className="ship-card-title">État du vaisseau</h2>
            <div className="ship-form-grid">
              <label className="ship-field">
                <span>Blindage actuel</span>
                <input
                  type="number"
                  min="0"
                  value={ship.blindageActuel ?? stats.maxArmor}
                  disabled={readOnly}
                  onChange={(event) => updateArmor(Number(event.target.value))}
                />
              </label>
              <div className="ship-field ship-shield-pair">
                <span>Boucliers</span>
                <label>
                  Avant
                  <input
                    type="number"
                    min="0"
                    value={shieldFront}
                    disabled={readOnly}
                    onChange={(event) => setShieldFront(Number(event.target.value))}
                  />
                </label>
                <label>
                  Arrière
                  <input
                    type="number"
                    min="0"
                    value={shieldRear}
                    disabled={readOnly}
                    onChange={(event) => setShieldRear(Number(event.target.value))}
                  />
                </label>
              </div>
              <div className="ship-field">
                <span>Recharge</span>
                <strong className="ship-readonly-value">{shieldRecharge}</strong>
              </div>
              <div className="ship-field">
                <span>Cooldown</span>
                <strong className="ship-readonly-value">{shieldCooldown}</strong>
              </div>
            </div>
            {shieldTotal > stats.maxShield && (
              <p className="ship-warning">
                ⚠ Le total des boucliers dépasse le maximum prévu ({stats.maxShield}).
              </p>
            )}
          </section>
          <section className="ship-card">
            <h2 className="ship-card-title">Modèle et châssis</h2>
            <div className="ship-tags">
              <span className="ship-tag">{object(ship.modele)?.nom ?? 'Modèle indéfini'}</span>
              <span className="ship-tag ship-tag-class">Classe {chassis?.classe ?? '—'}</span>
              <span className="ship-tag">{chassis?.categorie ?? '—'}</span>
            </div>
            <dl className="ship-dl">
              <div className="ship-dl-row">
                <dt>Blindage de base</dt>
                <dd>{chassis?.blindage ?? 0}</dd>
              </div>
              <div className="ship-dl-row">
                <dt>Capacités</dt>
                <dd>
                  {limits.pilotWeaponPoints} pts pilote · {limits.turretCount} tourelles
                </dd>
              </div>
              <div className="ship-dl-row">
                <dt>Esquive</dt>
                <dd>
                  {stats.evasionBase} + {stats.evasionPilot} pilote + {stats.evasionThrusters}{' '}
                  propulseurs
                </dd>
              </div>
            </dl>
          </section>
          <section className="ship-card">
            <h2 className="ship-card-title">Modules</h2>
            <div className="ship-form-grid">
              {moduleField('Générateur', 'moduleGenerateur')}
              {moduleField('Propulseurs', 'modulePropulseurs')}
              {moduleField('Survie', 'moduleSurvie')}
              {moduleField('Boucliers', 'moduleBoucliers')}
            </div>
            <div className="ship-subtitle-line">
              <h3 className="ship-subtitle">Modules supplémentaires</h3>
              <span className="ship-tag">
                {additionalModules.length} / {limits.moduleSlots}
              </span>
            </div>
            {additionalModules.map(({ module, index }: any) => (
              <div className="ship-equipment-row" key={id(module) ?? index}>
                <strong>{object(module)?.nom ?? 'Module'}</strong>
                <button
                  disabled={readOnly}
                  onClick={() =>
                    setDraftValue(
                      'modulesSupplementaires',
                      draft.modulesSupplementaires.filter((_: any, i: number) => i !== index),
                    )
                  }
                >
                  Retirer
                </button>
              </div>
            ))}
          </section>
        </div>
        <div className="ship-column">
          {renderWeaponLocation('Pilote', ship.armesPilote ?? [], -1, limits.pilotWeaponPoints)}
          {(ship.armesTourelles ?? []).map((turret: any, index: number) =>
            renderWeaponLocation(
              `Tourelle ${turret.tourelle ?? index + 1}`,
              turret.armes ?? [],
              index,
              limits.turretWeaponSlotLimits[index] ?? 0,
              turret.module,
            ),
          )}
          <section className="ship-card">
            <h2 className="ship-card-title">Munitions</h2>
            <div className="ship-inventory-grid">
              {(ship.inventaireConsommables ?? [])
                .filter((entry: any) => isAmmunition(object(entry.consommable)))
                .map((entry: any, index: number) => (
                  <span className="ship-tag" key={entry.id ?? index}>
                    {object(entry.consommable)?.nom ?? 'Munition'} × {entry.quantite ?? 0}
                  </span>
                ))}
              {!(ship.inventaireConsommables ?? []).some((entry: any) =>
                isAmmunition(object(entry.consommable)),
              ) && <p className="ship-muted">Aucune munition en réserve.</p>}
            </div>
          </section>
          <section className="ship-card">
            <h2 className="ship-card-title">Consommables</h2>
            <div className="ship-inventory-grid">
              {(ship.consommablesVaisseau ?? [])
                .filter((entry: any) => !isAmmunition(object(entry.consommable)))
                .map((entry: any, index: number) => (
                  <span className="ship-tag" key={entry.id ?? index}>
                    {object(entry.consommable)?.nom ?? 'Consommable'} · {entry.quantite ?? 0} /{' '}
                    {object(entry.consommable)?.quantiteEquipable ?? '—'} équipables
                  </span>
                ))}
              {!(ship.consommablesVaisseau ?? []).length && (
                <p className="ship-muted">Aucun consommable équipé.</p>
              )}
            </div>
            <small className="ship-muted">
              La quantité équipable est la limite embarquée ; le surplus reste en soute.
            </small>
          </section>
          <section className="ship-card">
            <h2 className="ship-card-title">Soute</h2>
            <div className="ship-inventory-grid">
              {(ship.inventaireModules ?? []).map((entry: any, index: number) => (
                <span className="ship-tag" key={`module-${entry.id ?? index}`}>
                  Module · {object(entry.module)?.nom ?? '—'} × {entry.quantite ?? 0}
                </span>
              ))}
              {(ship.inventaireArmes ?? []).map((entry: any, index: number) => (
                <span className="ship-tag" key={`arme-${entry.id ?? index}`}>
                  Arme · {object(entry.arme)?.nom ?? '—'} × {entry.quantite ?? 0}
                </span>
              ))}
              {(ship.inventaireConsommables ?? [])
                .filter((entry: any) => !isAmmunition(object(entry.consommable)))
                .map((entry: any, index: number) => (
                  <span className="ship-tag" key={`consommable-${entry.id ?? index}`}>
                    Consommable · {object(entry.consommable)?.nom ?? '—'} × {entry.quantite ?? 0}
                  </span>
                ))}
              {!(ship.inventaireModules ?? []).length &&
                !(ship.inventaireArmes ?? []).length &&
                !(ship.inventaireConsommables ?? []).some(
                  (entry: any) => !isAmmunition(object(entry.consommable)),
                ) && <p className="ship-muted">La soute est vide.</p>}
            </div>
          </section>
        </div>
      </div>
      {modified && (
        <div className="ship-actions">
          <button
            className="ss-button secondary"
            onClick={() => {
              setDraft(ship)
              setModified(false)
            }}
            disabled={saving}
          >
            Annuler
          </button>
          <button className="ss-button primary" onClick={save} disabled={saving}>
            {saving ? 'Enregistrement…' : 'Valider la configuration'}
          </button>
        </div>
      )}
      {weaponSelector && (
        <div className="ship-selector-overlay" onClick={() => setWeaponSelector(null)}>
          <div className="ship-selector-modal" onClick={(event) => event.stopPropagation()}>
            <div className="ship-selector-header">
              <h3>Changer l’arme</h3>
              <button onClick={() => setWeaponSelector(null)}>×</button>
            </div>
            <div className="ship-selector-list">
              {weaponSources()
                .filter(
                  (source: any) =>
                    !(
                      source.kind === 'equipped' &&
                      source.turretIndex === weaponSelector.turretIndex &&
                      source.index === weaponSelector.weaponIndex
                    ),
                )
                .map((source: any, index: number) => (
                  <button
                    className="ship-selector-item"
                    key={`${source.kind}-${source.turretIndex ?? 'soute'}-${source.index}-${id(source.weapon)}-${index}`}
                    onClick={() => selectWeaponSource(source)}
                  >
                    <span
                      className={`ship-weapon-icon ship-weapon-icon-${source.weapon.type ?? 'cinetique'}`}
                    >
                      {source.weapon.type === 'thermique'
                        ? '♨'
                        : source.weapon.type === 'explosif'
                          ? '◆'
                          : '✦'}
                    </span>
                    <span>
                      <strong>{source.weapon.nom}</strong>
                      <small>{source.label}</small>
                    </span>
                  </button>
                ))}
              {!weaponSources().length && <p className="ship-muted">Aucune arme disponible.</p>}
            </div>
          </div>
        </div>
      )}
      {ammoSelector && (() => {
        const targetEntries = ammoSelector.turretIndex >= 0
          ? ship.armesTourelles[ammoSelector.turretIndex]?.armes
          : ship.armesPilote
        const targetWeapon = object(targetEntries?.[ammoSelector.weaponIndex]?.arme)
        const ammoSources = (ship.inventaireConsommables ?? [])
          .map((item: any) => ({ ammo: object(item.consommable), quantity: Number(item.quantite ?? 0) }))
          .filter((source: any) => source.ammo && source.quantity > 0 && isAmmoCompatibleWith(targetWeapon, source.ammo))
          .filter((source: any, index: number, all: any[]) => all.findIndex((item) => id(item.ammo) === id(source.ammo)) === index)
        return (
          <div className="ship-selector-overlay" onClick={() => setAmmoSelector(null)}>
            <div className="ship-selector-modal" onClick={(event) => event.stopPropagation()}>
              <div className="ship-selector-header">
                <h3>Changer de munition</h3>
                <button onClick={() => setAmmoSelector(null)}>×</button>
              </div>
              <p className="ship-muted">Choisissez le chargeur pour {targetWeapon?.nom ?? 'cette arme'}.</p>
              <div className="ship-selector-list">
                {ammoSources.map((source: any) => (
                  <button className="ship-selector-item" key={id(source.ammo)} onClick={() => selectAmmoSource(source)}>
                    <span className="ship-weapon-icon ship-weapon-icon-cinetique">✦</span>
                    <span>
                      <strong>{source.ammo.nom}</strong>
                      <small>{source.quantity} disponible(s) · {source.ammo.bonus || 'Aucun bonus'}</small>
                    </span>
                  </button>
                ))}
                {!ammoSources.length && <p className="ship-muted">Aucune munition cinétique disponible.</p>}
              </div>
            </div>
          </div>
        )
      })()}
      {hoveredStat && (
        <div
          className="char-inventory-tooltip ship-stat-tooltip-floating"
          style={{ left: hoveredStat.x + 15, top: hoveredStat.y + 15 }}
        >
          <StatTooltip data={hoveredStat.data} />
        </div>
      )}
    </div>
  )
}
