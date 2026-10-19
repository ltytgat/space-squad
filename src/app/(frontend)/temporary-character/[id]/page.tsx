import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { isCharacterCreationComplete } from '@/lib/characterCreation'
import { consumeWorkspaceRequest, getWorkspaceFromCookie, stripWorkspaceSecrets } from '@/lib/temporaryCharacterWorkspace'
import { CharacterClient } from '../../characters/[id]/CharacterClient'
import { CharacterCreationWizard } from '../../character/CreationWizard'
import '../../character/character.css'
import '../../character/creation.css'
import '../../shop/shop.css'

export const metadata = { title: 'Fiche temporaire — Space Squad' }

export default async function TemporaryCharacterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params
  const characterId = Number(rawId)
  if (!Number.isSafeInteger(characterId) || characterId <= 0) notFound()

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const workspace = await getWorkspaceFromCookie(payload)
  if (!workspace) notFound()
  await consumeWorkspaceRequest(payload, Number(workspace.id))

  let character: any
  try {
    character = await payload.findByID({ collection: 'characters', id: characterId, depth: 3, overrideAccess: true })
  } catch {
    notFound()
  }
  const workspaceId = typeof character.workspace === 'object' ? character.workspace?.id : character.workspace
  if (String(workspaceId) !== String(workspace.id) || character.user) notFound()
  if (!isCharacterCreationComplete(character)) {
    const [modelsResult, weaponsResult] = await Promise.all([
      payload.find({ collection: 'ship-sale-models', where: { id: { in: [1, 2] } }, depth: 4, limit: 2, overrideAccess: true }),
      payload.find({ collection: 'weapons', where: { id: { in: [1, 34, 53, 70] } }, depth: 0, limit: 4, overrideAccess: true }),
    ])
    const ships = (modelsResult.docs as any[]).map((model) => ({
      id: model.id,
      nom: model.nom,
      prix: 'Vaisseau de départ',
      description: model.description ?? null,
      image: model.image && typeof model.image === 'object' && typeof model.image.url === 'string'
        ? { url: model.image.url, alt: model.image.alt ?? model.nom }
        : null,
      chassis: typeof model.chassis === 'object' ? model.chassis?.nom ?? null : null,
      classe: typeof model.chassis === 'object' ? model.chassis?.classe ?? null : null,
      tourelles: typeof model.chassis === 'object' ? model.chassis?.tourelles ?? 0 : 0,
      components: [
        ['Générateur', model.generateur?.nom],
        ['Propulseurs', model.propulseurs?.nom],
        ['Boucliers', model.boucliers?.nom],
        ['Système de survie', model.survie?.nom],
        ...(model.modulesOptionnels ?? []).map((module: any) => ['Module optionnel', module.nom]),
        ...(model.armes ?? []).map((entry: any) => [`Arme · ${entry.emplacement ?? 'pilote'}`, entry.arme?.nom]),
      ].filter((entry: any[]) => entry[1]),
    }))
    const weapons = (weaponsResult.docs as any[]).map((weapon) => ({ id: weapon.id, nom: weapon.nom, categorie: weapon.categorie }))

    return (
      <div className="ss-root char-root creation-root">
        <SiteHeader activePage="character" />
        <CharacterCreationWizard character={stripWorkspaceSecrets(JSON.parse(JSON.stringify(character)))} ships={JSON.parse(JSON.stringify(ships))} weapons={JSON.parse(JSON.stringify(weapons))} />
        <SiteFooter />
      </div>
    )
  }

  const { docs: relatedShips } = await payload.find({
    collection: 'ships',
    where: { proprietaire: { equals: character.id } },
    depth: 4,
    limit: 20,
    overrideAccess: true,
  })
  const characterCollection = payloadConfig.collections.find((collection) => collection.slug === 'characters')
  const competencesField = characterCollection?.fields.find((field: any) => field.name === 'competences') as any
  const skillSelectField = competencesField?.fields?.find((field: any) => field.name === 'competence')
  const allBaseSkills = skillSelectField?.options?.map((option: any) => typeof option === 'string' ? option : option.value) || []

  return (
    <>
      <SiteHeader activePage="character" />
      <CharacterClient
        character={stripWorkspaceSecrets(JSON.parse(JSON.stringify(character)))}
        isAdmin={false}
        isOwner
        isTemporary
        allBaseSkills={allBaseSkills}
        relatedVehicles={[]}
        relatedShips={JSON.parse(JSON.stringify(relatedShips)).map((ship: any) => ({
          id: ship.id,
          nom: ship.nom,
          proprietaire: ship.proprietaire && typeof ship.proprietaire === 'object'
            ? { id: ship.proprietaire.id, nom: ship.proprietaire.nom }
            : ship.proprietaire,
          modele: ship.modele && typeof ship.modele === 'object'
            ? { id: ship.modele.id, nom: ship.modele.nom, chassis: ship.modele.chassis && typeof ship.modele.chassis === 'object' ? { classe: ship.modele.chassis.classe } : ship.modele.chassis }
            : ship.modele,
        }))}
      />
      <SiteFooter />
    </>
  )
}
