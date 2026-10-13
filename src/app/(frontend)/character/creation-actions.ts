'use server'

import { randomInt } from 'node:crypto'
import { headers as getHeaders } from 'next/headers.js'
import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import config from '@/payload.config'
import { isCharacterCreationComplete } from '@/lib/characterCreation'

type CreationStep = 'caracteristiques' | 'espece' | 'equipement' | 'identite' | 'termine'
type AbilityRoll = { dice: number[]; kept: number[]; discarded: number; total: number }
type CharacterRolls = {
  caracteristiques?: AbilityRoll[]
  competences?: { dice: number[]; total: number }
  konis?: { dice: number[]; total: number }
}

const ABILITIES = ['force', 'habilite', 'connaissances', 'culture', 'anticipation', 'perception'] as const
const THERMAL_WEAPONS: Record<number, { nom: string; categorie: string }> = {
  1: { nom: "Fusil thermique de l'Alliance I", categorie: 'fusil-assaut' },
  34: { nom: "Shotgun de l'Alliance I", categorie: 'shotgun' },
  53: { nom: "Sniper thermique de l'Alliance I", categorie: 'sniper' },
  70: { nom: "Pistolet thermique de l'Alliance I", categorie: 'pistolet' },
}

class CreationError extends Error {}
function fail(message: string): never { throw new CreationError(message) }

function numericId(value: unknown): number | null {
  const raw = value && typeof value === 'object' ? (value as { id?: unknown }).id : value
  const id = Number(raw)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

function randomDie(sides: number): number { return randomInt(sides) + 1 }

function rollAbilitySet(): AbilityRoll[] {
  for (let attempt = 0; attempt < 10_000; attempt++) {
    const rolls = Array.from({ length: 6 }, () => {
      const dice = Array.from({ length: 4 }, () => randomDie(6))
      const order = [0, 1, 2, 3].sort((left, right) => dice[right] - dice[left] || left - right)
      const kept = order.slice(0, 3)
      const discarded = order[3]
      return { dice, kept, discarded, total: kept.reduce((sum, index) => sum + dice[index], 0) }
    })
    if (rolls.reduce((sum, roll) => sum + roll.total, 0) >= 72) return rolls
  }
  fail('Impossible de générer un ensemble de caractéristiques valide. Réessayez.')
}

function rollResources() {
  const skillDice = [randomDie(4)]
  const konisDice = Array.from({ length: 10 }, () => randomDie(1000))
  return {
    competences: { dice: skillDice, total: skillDice.reduce((sum, die) => sum + die, 0) },
    konis: { dice: konisDice, total: konisDice.reduce((sum, die) => sum + die, 0) },
  }
}

function parseRolls(value: unknown): CharacterRolls {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as CharacterRolls : {}
}

async function getSession() {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await getHeaders() })
  if (!user) fail('Connexion requise.')
  return { payload, user }
}

async function withOwnedCharacter<T>(characterId: number, operation: (context: {
  payload: any; user: any; character: any; req: any
}) => Promise<T>): Promise<T> {
  if (!Number.isSafeInteger(characterId) || characterId <= 0) fail('Personnage invalide.')
  const { payload, user } = await getSession()
  const transactionID = await payload.db.beginTransaction?.()
  if (!transactionID) fail('Les transactions de la base sont indisponibles.')
  const req = { transactionID } as any

  try {
    const transactionDb = (payload.db as any).sessions?.[transactionID]?.db
    if (!transactionDb) fail('Impossible d’ouvrir la transaction.')
    await payload.db.execute({ db: transactionDb, sql: sql`SELECT id FROM characters WHERE id = ${characterId} FOR UPDATE` })
    const character = await payload.findByID({ collection: 'characters', id: characterId, depth: 1, overrideAccess: true, req }) as any
    if (numericId(character.user) !== Number(user.id)) fail('Ce personnage ne vous appartient pas.')
    if (isCharacterCreationComplete(character)) fail('La création de ce personnage est déjà terminée.')

    const result = await operation({ payload, user, character, req })
    await payload.db.commitTransaction?.(transactionID)
    revalidatePath('/character')
    revalidatePath(`/characters/${characterId}`)
    revalidatePath('/shop')
    return result
  } catch (error) {
    await payload.db.rollbackTransaction?.(transactionID).catch(() => undefined)
    if (error instanceof CreationError) throw error
    throw new Error(error instanceof Error ? error.message : 'La création du personnage a échoué.')
  }
}

function assertStep(character: any, expected: CreationStep) {
  if (character.creationEtape !== expected) fail('Cette étape est déjà validée ou n’est pas encore accessible.')
}

async function ensureCurrentRolls({ payload, character, user, req }: { payload: any; character: any; user: any; req: any }) {
  const step = character.creationEtape as CreationStep
  const rolls = parseRolls(character.creationJets)
  let changed = false
  if (step === 'caracteristiques' && !Array.isArray(rolls.caracteristiques)) {
    rolls.caracteristiques = rollAbilitySet()
    changed = true
  } else if (step === 'equipement' && (!rolls.competences || !rolls.konis)) {
    const resources = rollResources()
    rolls.competences ??= resources.competences
    rolls.konis ??= resources.konis
    changed = true
  }
  if (changed) {
    await payload.update({ collection: 'characters', id: character.id, data: { creationJets: rolls }, overrideAccess: true, user, req })
  }
  return rolls
}

export async function ensureCharacterCreationRolls(characterId: number) {
  return withOwnedCharacter(characterId, async (context) => {
    const rolls = await ensureCurrentRolls(context)
    return { step: context.character.creationEtape as CreationStep, rolls }
  })
}

export async function saveCharacteristicAssignment(characterId: number, assignedRollIndexes: unknown) {
  return withOwnedCharacter(characterId, async ({ payload, user, character, req }) => {
    assertStep(character, 'caracteristiques')
    const rolls = await ensureCurrentRolls({ payload, user, character, req })
    if (!Array.isArray(rolls.caracteristiques) || rolls.caracteristiques.length !== 6) fail('Les jets de caractéristiques sont incomplets.')
    if (rolls.caracteristiques.reduce((sum, roll) => sum + Number(roll.total || 0), 0) < 72) fail('Les jets de caractéristiques doivent totaliser au moins 72.')
    if (!assignedRollIndexes || typeof assignedRollIndexes !== 'object' || Array.isArray(assignedRollIndexes)) fail('Affectation invalide.')
    const assignment = assignedRollIndexes as Record<string, unknown>
    const indexes = ABILITIES.map((ability) => assignment[ability])
    if (indexes.some((index) => !Number.isInteger(index) || Number(index) < 0 || Number(index) > 5)) fail('Affectez un résultat à chacune des six caractéristiques.')
    if (new Set(indexes).size !== 6) fail('Chaque résultat doit être affecté une seule fois.')

    const values = Object.fromEntries(ABILITIES.map((ability) => [ability, rolls.caracteristiques![Number(assignment[ability])].total]))
    await payload.update({
      collection: 'characters', id: character.id,
      data: { ...values, creationEtape: 'espece' },
      overrideAccess: true, user, req,
    })
    return { success: true }
  })
}

export async function saveCharacterSpecies(characterId: number, species: unknown) {
  return withOwnedCharacter(characterId, async ({ payload, user, character, req }) => {
    assertStep(character, 'espece')
    if (!['Humain', 'Strani', 'Vada'].includes(String(species))) fail('Choisissez une espèce valide.')
    await payload.update({
      collection: 'characters', id: character.id,
      data: { origine: species as string, creationEtape: 'equipement' },
      overrideAccess: true, user, req,
    })
    return { success: true }
  })
}

export async function saveStartingEquipment(characterId: number, input: {
  saleModelId?: unknown
  shipName?: unknown
  thermalWeaponId?: unknown
}) {
  return withOwnedCharacter(characterId, async ({ payload, user, character, req }) => {
    assertStep(character, 'equipement')
    const saleModelId = Number(input?.saleModelId)
    const thermalWeaponId = Number(input?.thermalWeaponId)
    const modelNames: Record<number, string> = { 1: 'Jason', 2: 'Ulysse' }
    const thermalWeapon = THERMAL_WEAPONS[thermalWeaponId]
    if (!modelNames[saleModelId] || !thermalWeapon) fail('Le vaisseau ou l’arme sélectionné n’est pas disponible.')

    const model = await payload.findByID({ collection: 'ship-sale-models', id: saleModelId, depth: 1, overrideAccess: true, req }) as any
    if (model.nom !== modelNames[saleModelId]) fail('Le catalogue des vaisseaux de départ a changé.')
    const weapon = await payload.findByID({ collection: 'weapons', id: thermalWeaponId, depth: 0, overrideAccess: true, req }) as any
    if (weapon.nom !== thermalWeapon.nom || weapon.categorie !== thermalWeapon.categorie || !Array.isArray(weapon.type) || !weapon.type.includes('thermique')) {
      fail('L’arme thermique de rang I sélectionnée n’est plus disponible.')
    }

    const rolls = await ensureCurrentRolls({ payload, user, character, req })
    if (!rolls.competences || !rolls.konis) fail('Les jets de ressources sont incomplets.')
    const shipNameInput = typeof input.shipName === 'string' ? input.shipName.trim() : ''
    if (shipNameInput.length > 100) fail('Le nom du vaisseau ne peut pas dépasser 100 caractères.')
    const shipName = shipNameInput || model.nom

    const ship = await payload.create({
      collection: 'ships',
      data: { nom: shipName, modele: saleModelId, proprietaire: character.id },
      overrideAccess: true, user, req,
    }) as any

    await payload.update({
      collection: 'characters', id: character.id,
      data: {
        armureTete: { item: 1, mods: [] },
        armureTorse: { item: 32, mods: [] },
        armureBras: { item: 63, mods: [] },
        armureJambes: { item: 94, mods: [] },
        armeDeMelee: { item: 90, mods: [], munitionsActuelles: 0, chargeurRelie: null },
        armePrincipale: { item: thermalWeaponId, mods: [], munitionsActuelles: 0, chargeurRelie: null },
        vaisseau: ship.id,
        pointsDeCompetence: rolls.competences.total,
        konis: rolls.konis.total,
        creationEtape: 'identite',
      },
      overrideAccess: true, user, req,
    })
    return { success: true }
  })
}

export async function saveCharacterIdentity(characterId: number, input: { nom?: unknown; sexe?: unknown }) {
  return withOwnedCharacter(characterId, async ({ payload, user, character, req }) => {
    assertStep(character, 'identite')
    const nom = typeof input?.nom === 'string' ? input.nom.trim() : ''
    const sexe = input?.sexe
    if (!nom || nom.length > 100) fail('Le nom doit contenir entre 1 et 100 caractères.')
    if (!['M', 'F', 'X'].includes(String(sexe))) fail('Choisissez un sexe valide.')
    await payload.update({
      collection: 'characters', id: character.id,
      data: { nom, sexe: sexe as string, creationEtape: 'termine' },
      overrideAccess: true, user, req,
    })
    return { success: true }
  })
}
