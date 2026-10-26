export type WeaponRangeRow = { label: string; mod: string }

type RangeOptions = {
  shortRangeBonus?: number
  mediumRangeBonus?: number
  shortRangeAdjustment?: number
  mediumRangeAdjustment?: number
  flatRangeAdjustment?: number
  optimalRangeMultiplier?: number
}

const signed = (value: number) => value >= 0 ? `+${value}` : String(value)

export function weaponRangeRows(weapon: Record<string, any>, options: RangeOptions = {}): WeaponRangeRow[] {
  const isMelee = weapon.categorie === 'melee'
  const isHeavy = weapon.categorie === 'lourde'
  const isSniper = weapon.categorie === 'sniper'
  const rows: { label: string; distance?: number; mod: number; optimal?: boolean }[] = []
  const shortAdjustment = (options.shortRangeAdjustment ?? 0) + (options.flatRangeAdjustment ?? 0)
  const mediumAdjustment = (options.mediumRangeAdjustment ?? 0) + (options.flatRangeAdjustment ?? 0)

  if (isMelee) rows.push({ label: `< ${weapon.porteeFixe ?? 1}m`, mod: 0 })
  else if (isHeavy) rows.push({ label: `Max ${weapon.porteeFixe ?? 50}m`, mod: 0 })
  else if (isSniper) {
    const shortDistance = (weapon.courtePortee ?? 0) + shortAdjustment
    rows.push({
      label: `< ${shortDistance}m`, distance: shortDistance,
      mod: (weapon.modCourtePortee ?? 0) + (options.shortRangeBonus ?? 0), optimal: true,
    })
    weapon.paliersSniper?.forEach((stage: any) => {
      rows.push({
        label: `< ${stage.distanceMax}m`, distance: stage.distanceMax,
        mod: (stage.modificateur ?? 0) + (options.shortRangeBonus ?? 0), optimal: true,
      })
    })
  } else {
    if (weapon.courtePortee != null) {
      const distance = weapon.courtePortee + shortAdjustment
      rows.push({
        label: `< ${distance}m`, distance,
        mod: (weapon.modCourtePortee ?? 0) + (options.shortRangeBonus ?? 0), optimal: true,
      })
    }
    if (weapon.moyennePortee != null) {
      const distance = weapon.moyennePortee + mediumAdjustment
      rows.push({
        label: `< ${distance}m`, distance,
        mod: (weapon.modMoyennePortee ?? 0) + (options.mediumRangeBonus ?? 0), optimal: true,
      })
    }
  }

  const optimalRows = rows.filter((row) => row.optimal)
  const bestBonus = optimalRows.length ? Math.max(...optimalRows.map((row) => row.mod)) : null
  const multiplier = options.optimalRangeMultiplier ?? 1
  const visibleRows = rows.map((row) => {
    const isBestRange = row.optimal && row.mod === bestBonus && multiplier !== 1
    const distance = isBestRange
      ? multiplier === Infinity ? Infinity : (row.distance ?? 0) * multiplier
      : row.distance
    return {
      label: distance === undefined ? row.label : distance === Infinity ? '< ∞m' : `< ${distance}m`,
      mod: signed(row.mod),
    }
  })

  if (!isMelee && !isHeavy && weapon.trancheMalusLonguePortee) {
    visibleRows.push({
      label: `+${weapon.trancheMalusLonguePortee}m`,
      mod: signed(weapon.malusParTranche ?? -1),
    })
  }

  return visibleRows
}
