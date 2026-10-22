import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import Link from 'next/link'

import config from '@/payload.config'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { CharacterCreationWizard } from './CreationWizard'
import { isCharacterCreationComplete } from '@/lib/characterCreation'
import { getActiveMode } from '@/lib/activeMode'
import { getActiveCharacter } from '@/lib/activeCharacter'
import './character.css'
import './creation.css'
import '../shop/shop.css'

export const metadata = {
  title: 'Mon personnage — Space Squad',
}

export default async function CharacterPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) redirect('/login')
  if ((await getActiveMode(user)) === 'mj') redirect('/characters')

  const character = await getActiveCharacter(payload, user, { depth: 1 })
  if (character && isCharacterCreationComplete(character)) redirect(`/characters/${character.id}`)

  if (character) {
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
    const weapons = (weaponsResult.docs as any[]).map((weapon) => ({
      id: weapon.id,
      nom: weapon.nom,
      categorie: weapon.categorie,
    }))

    return (
      <div className="ss-root char-root creation-root">
        <SiteHeader activePage="character" />
        <CharacterCreationWizard
          character={JSON.parse(JSON.stringify(character))}
          ships={JSON.parse(JSON.stringify(ships))}
          weapons={JSON.parse(JSON.stringify(weapons))}
        />
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="ss-root char-root">
      <SiteHeader activePage="character" />

      <div className="char-layout">
        <div className="char-page-header">
          <div className="ss-container">
            <nav className="char-breadcrumb" aria-label="Fil d'Ariane">
              <Link href="/">Accueil</Link>
              <span aria-hidden="true">›</span>
              <span>Mon personnage</span>
            </nav>

            <h1 className="char-name char-name-empty">Fiche de personnage introuvable</h1>
            <p className="char-empty-hint">
              Aucune fiche n’est associée à votre compte. <Link href="/mes-personnages">Créez votre premier personnage.</Link>
            </p>
          </div>
        </div>

        <div className="char-content ss-container">
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
