import 'server-only'

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { strFromU8, strToU8, unzipSync, zipSync, type Zippable } from 'fflate'
import { DOMParser, XMLSerializer, type Element, type Node } from '@xmldom/xmldom'
import { calculateStats } from '@/lib/characterStats'

const TABLE_NS = 'urn:oasis:names:tc:opendocument:xmlns:table:1.0'
const OFFICE_NS = 'urn:oasis:names:tc:opendocument:xmlns:office:1.0'
const TEXT_NS = 'urn:oasis:names:tc:opendocument:xmlns:text:1.0'

const ATTRIBUTE_CELLS: Record<string, string> = {
  force: 'E13',
  habilite: 'E15',
  culture: 'E17',
  connaissances: 'E19',
  anticipation: 'E21',
  perception: 'E23',
}

const SKILL_CELLS: Record<string, string> = {
  Chasseur: 'S2',
  Bombardier: 'S3',
  'Poids Lourds': 'S4',
  'Transport de Troupes': 'S5',
  Canonnier: 'S6',
  'Médecine de terrain': 'S7',
  Concentration: 'S8',
  Mécanicien: 'S9',
  Stabilisation: 'S10',
  Assaut: 'U2',
  Sniper: 'U3',
  Shotgun: 'U4',
  'Combat rapproché': 'U5',
  Analyse: 'U6',
  Réactivité: 'U7',
  Furtivité: 'U8',
  Diplomate: 'U9',
  Culture: 'U10',
}

const ARMOR_CELLS = [
  { field: 'armureTete', row: 31 },
  { field: 'armureTorse', row: 32 },
  { field: 'armureBras', row: 33 },
  { field: 'armureJambes', row: 34 },
  { field: 'armureBackpack', row: 35 },
] as const

const WEAPON_CELLS = [
  { field: 'armePrincipale', row: 39 },
  { field: 'armeSecondaire', row: 40 },
  { field: 'armeLourde', row: 41 },
  { field: 'armeDeMelee', row: 42 },
] as const

function localElements(parent: Element, namespace: string, name: string): Element[] {
  const nodes = parent.getElementsByTagNameNS(namespace, name)
  return Array.from({ length: nodes.length }, (_, index) => nodes.item(index)).filter(
    (node): node is Element => node !== null,
  )
}

function repeatedCount(element: Element, attribute: string): number {
  const raw = element.getAttributeNS(TABLE_NS, attribute)
  return raw ? Math.max(1, Number.parseInt(raw, 10) || 1) : 1
}

function setRepeatCount(element: Element, attribute: string, count: number) {
  if (count <= 1) element.removeAttributeNS(TABLE_NS, attribute)
  else element.setAttributeNS(TABLE_NS, `table:${attribute}`, String(count))
}

function isolateRepeatedNode(
  parent: Node,
  element: Element,
  attribute: string,
  offset: number,
): Element {
  const count = repeatedCount(element, attribute)
  if (count === 1) return element

  const middle = element.cloneNode(true) as Element
  const beforeCount = offset
  const afterCount = count - offset - 1
  const before = beforeCount > 0 ? (element.cloneNode(true) as Element) : null
  const after = afterCount > 0 ? (element.cloneNode(true) as Element) : null

  if (before) setRepeatCount(before, attribute, beforeCount)
  setRepeatCount(middle, attribute, 1)
  if (after) setRepeatCount(after, attribute, afterCount)

  parent.insertBefore(middle, element)
  if (before) parent.insertBefore(before, middle)
  if (after) parent.insertBefore(after, element.nextSibling)
  parent.removeChild(element)
  return middle
}

function columnNumber(columnName: string): number {
  let number = 0
  for (const character of columnName) number = number * 26 + character.charCodeAt(0) - 64
  return number
}

function findRow(sheet: Element, targetRow: number): Element {
  let currentRow = 1
  for (const row of localElements(sheet, TABLE_NS, 'table-row')) {
    const count = repeatedCount(row, 'number-rows-repeated')
    if (targetRow >= currentRow && targetRow < currentRow + count) {
      return isolateRepeatedNode(row.parentNode!, row, 'number-rows-repeated', targetRow - currentRow)
    }
    currentRow += count
  }
  throw new Error(`La ligne ${targetRow} est absente du modèle ODS.`)
}

function findCell(sheet: Element, address: string): Element {
  const match = /^([A-Z]+)(\d+)$/.exec(address)
  if (!match) throw new Error(`Adresse de cellule invalide : ${address}`)
  const targetColumn = columnNumber(match[1]!)
  const targetRow = Number(match[2])
  const row = findRow(sheet, targetRow)
  let currentColumn = 1

  for (const cell of Array.from(row.childNodes).filter(
    (node): node is Element => node.nodeType === 1 && (node.localName === 'table-cell' || node.localName === 'covered-table-cell'),
  )) {
    const count = repeatedCount(cell, 'number-columns-repeated')
    if (targetColumn >= currentColumn && targetColumn < currentColumn + count) {
      if (cell.localName === 'covered-table-cell') {
        throw new Error(`La cellule ${address} est fusionnée dans le modèle ODS.`)
      }
      return isolateRepeatedNode(cell.parentNode!, cell, 'number-columns-repeated', targetColumn - currentColumn)
    }
    currentColumn += count
  }
  throw new Error(`La cellule ${address} est absente du modèle ODS.`)
}

function clearCellValue(cell: Element) {
  for (const attribute of ['value', 'string-value', 'date-value', 'time-value', 'boolean-value', 'currency']) {
    cell.removeAttributeNS(OFFICE_NS, attribute)
  }
  cell.removeAttributeNS(TABLE_NS, 'formula')
  cell.removeAttributeNS(OFFICE_NS, 'value-type')
  while (cell.firstChild) cell.removeChild(cell.firstChild)
}

function setCellText(sheet: Element, address: string, value: unknown) {
  const cell = findCell(sheet, address)
  const text = value == null ? '' : String(value)
  clearCellValue(cell)
  cell.setAttributeNS(OFFICE_NS, 'office:value-type', 'string')
  const paragraph = cell.ownerDocument!.createElementNS(TEXT_NS, 'text:p')
  if (text) paragraph.appendChild(cell.ownerDocument!.createTextNode(text))
  cell.appendChild(paragraph)
}

function setCellNumber(sheet: Element, address: string, value: unknown) {
  const cell = findCell(sheet, address)
  if (value == null || value === '') {
    clearCellValue(cell)
    const paragraph = cell.ownerDocument!.createElementNS(TEXT_NS, 'text:p')
    cell.appendChild(paragraph)
    return
  }
  const number = Number(value)
  clearCellValue(cell)
  if (!Number.isFinite(number)) {
    const paragraph = cell.ownerDocument!.createElementNS(TEXT_NS, 'text:p')
    cell.appendChild(paragraph)
    return
  }
  cell.setAttributeNS(OFFICE_NS, 'office:value-type', 'float')
  cell.setAttributeNS(OFFICE_NS, 'office:value', String(number))
  const paragraph = cell.ownerDocument!.createElementNS(TEXT_NS, 'text:p')
  paragraph.appendChild(cell.ownerDocument!.createTextNode(String(number)))
  cell.appendChild(paragraph)
}

function setWeaponDamage(sheet: Element, address: string, value: unknown) {
  const cell = findCell(sheet, address)
  const damage = value == null ? '' : String(value).trim()
  const formula = cell.getAttributeNS(TABLE_NS, 'formula')
  if (!formula || !damage) {
    setCellText(sheet, address, damage)
    return
  }

  const stringArgument = /(\bCONCAT\()"((?:[^"]|"")*)"/i
  if (!stringArgument.test(formula)) {
    setCellText(sheet, address, damage)
    return
  }
  const escapedDamage = `${damage.replace(/"/g, '""')}+`
  const updatedFormula = formula.replace(stringArgument, (_match, prefix: string) => `${prefix}"${escapedDamage}"`)
  cell.setAttributeNS(TABLE_NS, 'table:formula', updatedFormula)
}

function itemName(value: any): string {
  if (!value) return ''
  return typeof value === 'object' ? String(value.nom ?? '') : ''
}

function modsOf(value: any): any[] {
  return Array.isArray(value?.mods) ? value.mods.filter(Boolean) : []
}

function nameList(values: any[]): string {
  return values.map(itemName).filter(Boolean).join(', ')
}

function formatMaybePercent(value: unknown): string {
  if (value == null || value === '') return ''
  return `${value}%`
}

function inventoryLines(character: any): string[] {
  const weapons = (character.inventaireArmes ?? []).map((entry: any) => {
    const weapon = entry?.item
    if (!weapon || typeof weapon !== 'object') return ''
    const mods = nameList(entry.mods ?? [])
    const ammo = entry.munitionsActuelles == null ? '' : `, munitions ${entry.munitionsActuelles}`
    return `${weapon.nom}${mods ? ` (mods : ${mods})` : ''}${ammo}`
  }).filter(Boolean)

  const armors = (character.inventaireArmures ?? []).map((entry: any) => {
    const armor = entry?.item
    if (!armor || typeof armor !== 'object') return ''
    const mods = nameList(entry.mods ?? [])
    return `${armor.nom}${mods ? ` (mods : ${mods})` : ''}`
  }).filter(Boolean)

  const mods = nameList(character.inventaireMods ?? [])
  const chips = nameList(character.inventairePuces ?? [])
  const consumables = (character.inventaire ?? []).map((entry: any) => {
    const name = itemName(entry?.consommable)
    if (!name) return ''
    return `${name}${entry.quantite != null ? ` ×${entry.quantite}` : ''}`
  }).filter(Boolean).join(', ')

  return [
    `Armes : ${weapons.join('; ')}`,
    `Armures : ${armors.join('; ')}`,
    `Mods : ${mods}`,
    `Puces : ${chips}`,
    `Consommables : ${consumables}`,
  ]
}

function chooseSpeciesSheet(character: any, tables: Element[]): Element {
  const species = String(character.origine ?? '')
  if (!['Humain', 'Strani', 'Vada'].includes(species)) {
    throw new Error('L’espèce du personnage est absente ou inconnue.')
  }
  const tableName = `Base-${species}`
  const table = tables.find((candidate) => candidate.getAttributeNS(TABLE_NS, 'name') === tableName)
  if (!table) throw new Error(`La feuille ${tableName} est absente du modèle ODS.`)
  return table
}

function fillCharacterSheet(sheet: Element, character: any) {
  const stats = calculateStats(character)
  const rank = stats.rankInfo
  const affiliation = typeof character.affiliation === 'object' ? character.affiliation?.nom : ''
  const ship = character.vaisseau && typeof character.vaisseau === 'object' ? character.vaisseau : null
  const shipModel = ship?.modele && typeof ship.modele === 'object' ? ship.modele : null

  setCellText(sheet, 'B3', character.nom)
  setCellText(sheet, 'F3', character.sexe)
  setCellText(sheet, 'J3', character.origine)
  setCellNumber(sheet, 'B5', rank.level)
  setCellText(sheet, 'H5', affiliation || 'Non-affilié')
  setCellNumber(sheet, 'C7', rank.pointsInRank)
  setCellText(sheet, 'D7', rank.pointsForNext === null ? '—' : `/${rank.pointsForNext}`)
  setCellNumber(sheet, 'B9', character.konis ?? 0)
  setCellText(sheet, 'F9', ship?.nom)
  setCellText(sheet, 'K9', shipModel?.nom)

  setCellText(sheet, 'N4', itemName(character.puceMk1))
  setCellText(sheet, 'N5', itemName(character.puceMk2))
  setCellText(sheet, 'N6', itemName(character.puceMk3))

  for (const [field, address] of Object.entries(ATTRIBUTE_CELLS)) {
    setCellNumber(sheet, address, character[field] ?? 0)
  }

  for (const { field, row } of ARMOR_CELLS) {
    const group = character[field]
    const armor = group?.item && typeof group.item === 'object' ? group.item : null
    const mods = modsOf(group)
    setCellText(sheet, `B${row}`, armor?.nom)
    setCellText(sheet, `D${row}`, nameList(mods))
    setCellNumber(sheet, `G${row}`, armor?.valeurArmurePhysique ?? '')
    setCellNumber(sheet, `I${row}`, armor?.valeurBouclier ?? '')
    setCellText(sheet, `L${row}`, mods.map((mod) => mod?.effet).filter(Boolean).join('; '))
    setCellText(sheet, `P${row}`, armor?.valeurRupture ?? '')
  }

  for (const { field, row } of WEAPON_CELLS) {
    const group = character[field]
    const weapon = group?.item && typeof group.item === 'object' ? group.item : null
    const mods = modsOf(group)
    setCellText(sheet, `B${row}`, weapon?.nom)
    if (row !== 42) setCellNumber(sheet, `D${row}`, weapon?.poids ?? '')
    setWeaponDamage(sheet, `G${row}`, weapon?.valeurDegats)
    if (row !== 42) {
      setCellText(sheet, `L${row}`, weapon?.valeurChauffe != null
        ? formatMaybePercent(weapon.valeurChauffe)
        : weapon?.projectilesParTir != null && weapon.projectilesParTir > 1
          ? `×${weapon.projectilesParTir}`
          : '')
      setCellText(sheet, `N${row}`, weapon?.tempsRefroidissement != null
        ? formatMaybePercent(weapon.tempsRefroidissement)
        : weapon?.tempsRechargement ?? weapon?.tailleChargeur ?? '')
    }
    if (row === 39 || row === 40 || row === 42) setCellText(sheet, `P${row}`, nameList(mods))
  }

  for (const [skill, address] of Object.entries(SKILL_CELLS)) {
    const learned = (character.competences ?? []).find((entry: any) => entry?.competence === skill)
    setCellNumber(sheet, address, learned?.valeur ?? 0)
  }

  inventoryLines(character).forEach((line, index) => {
    setCellText(sheet, `R${46 + index}`, line)
  })
  for (let row = 51; row <= 54; row++) setCellText(sheet, `R${row}`, '')
}

export async function createCharacterOds(character: any): Promise<Uint8Array> {
  const templatePath = path.join(process.cwd(), 'public', 'docs', 'Fiche_de_Personnage.ods')
  const template = new Uint8Array(await readFile(templatePath))
  const archive = unzipSync(template)
  const content = archive['content.xml']
  if (!content) throw new Error('Le modèle ODS ne contient pas content.xml.')

  const document = new DOMParser().parseFromString(strFromU8(content), 'application/xml')
  const root = document.documentElement
  if (!root) throw new Error('Le modèle ODS contient un XML invalide.')
  const tables = localElements(root, TABLE_NS, 'table')
  const selectedTable = chooseSpeciesSheet(character, tables)
  for (const table of tables) {
    if (table !== selectedTable) table.parentNode?.removeChild(table)
  }
  fillCharacterSheet(selectedTable, character)
  archive['content.xml'] = strToU8(new XMLSerializer().serializeToString(document))

  const output: Zippable = {}
  if (!archive.mimetype) throw new Error('Le modèle ODS ne contient pas son type MIME.')
  output.mimetype = [archive.mimetype, { level: 0 }]
  for (const [name, contents] of Object.entries(archive)) {
    if (name !== 'mimetype') output[name] = contents
  }
  return zipSync(output, { level: 6 })
}
