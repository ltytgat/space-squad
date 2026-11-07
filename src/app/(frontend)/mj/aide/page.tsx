import { headers } from 'next/headers.js'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { MAX_NPC_CHARACTERS, MAX_PLAYER_CHARACTERS } from '@/lib/characterLimits'
import '../../account/account.css'
import './aide.css'

export const metadata = {
  title: 'Aide MJ — Space Squad',
}

export default async function MJHelpPage() {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect('/login')
  if (user.role !== 'admin' && user.isMJ !== true) redirect('/account')

  return (
    <div className="ss-root account-root">
      <SiteHeader />
      <div className="account-layout">
        <div className="account-page-header">
          <div className="ss-container">
            <nav className="account-breadcrumb" aria-label="Fil d’Ariane">
              <Link href="/">Accueil</Link>
              <span aria-hidden="true">›</span>
              <Link href="/account">Mon compte</Link>
              <span aria-hidden="true">›</span>
              <span>Aide MJ</span>
            </nav>
            <h1 className="account-page-title">Aide MJ</h1>
          </div>
        </div>
        <main className="account-content ss-container mj-help-content">
          <div className="mj-help-intro">
            <p>Préparez vos personnages, rassemblez votre escouade et gérez les récompenses de vos sessions. Ouvrez une rubrique pour retrouver les étapes utiles.</p>
            <p>Pour gérer vos escouades et leurs personnages, passez en <strong>mode MJ</strong> depuis le sélecteur de mode en haut du site.</p>
          </div>

          <div className="mj-help-sections">
            <details className="mj-help-section">
              <summary><h2>Modifier une fiche de personnage</h2></summary>
              <div className="mj-help-body">
                <p>Le mode édition permet de préparer une fiche ou de corriger les valeurs d’un personnage de votre escouade.</p>
                <ol>
                  <li>Dans <Link href="/characters">Personnages</Link>, ouvrez la fiche concernée, puis cliquez sur <strong>Mode Edition</strong>, à côté du nom.</li>
                  <li>Modifiez les informations utiles : identité, espèce, faction, caractéristiques, Konis, points de rang ou de compétence. Les compétences, l’inventaire et les informations de faction disposent aussi de commandes d’édition dans leurs sections.</li>
                  <li>Pour l’inventaire, utilisez <strong>Ajouter à la section</strong> ou les commandes de gestion des objets déjà présents.</li>
                  <li>Cliquez sur <strong>Valider</strong> dans la barre de modification pour enregistrer, ou sur <strong>Annuler</strong> pour abandonner vos changements. Revenez ensuite en <strong>Mode Lecture</strong>.</li>
                </ol>
                <p className="mj-help-note"><strong>À retenir :</strong> validez avant de quitter la fiche ou de changer de mode. Les notes s’enregistrent séparément avec <strong>Enregistrer les Notes</strong>.</p>
              </div>
            </details>

            <details className="mj-help-section">
              <summary><h2>Créer une escouade et inviter les joueurs</h2></summary>
              <div className="mj-help-body">
                <p>Une escouade rassemble les personnages que vous accompagnez en tant que MJ. Vous pouvez en créer jusqu’à cinq.</p>
                <ol>
                  <li>En mode MJ, ouvrez <Link href="/escouade">Mes escouades</Link>, saisissez le nom de l’escouade puis cliquez sur <strong>Créer</strong>.</li>
                  <li>Retrouvez le <strong>code d’invitation de huit caractères</strong> sur la carte de l’escouade et transmettez-le aux joueurs.</li>
                  <li>Chaque joueur sélectionne le personnage à rattacher depuis <Link href="/mes-personnages">Mes personnages</Link>, puis ouvre <strong>Mon escouade</strong> en mode joueur.</li>
                  <li>Il saisit le code et clique sur <strong>Rejoindre</strong>. Vous pouvez ensuite retrouver les membres dans votre escouade et leurs fiches dans <strong>Personnages</strong>.</li>
                </ol>
                <p className="mj-help-note"><strong>À retenir :</strong> le code rattache le personnage actif, pas tous les personnages du compte. Utiliser le code d’une autre escouade change son escouade et retire son affectation à un vaisseau. S’il possède des vaisseaux, leurs affectations d’équipage sont également réinitialisées.</p>
              </div>
            </details>

            <details className="mj-help-section">
              <summary><h2>Créer et préparer un PNJ</h2></summary>
              <div className="mj-help-body">
                <p>Créez un personnage non joueur pour vos alliés, adversaires ou compagnons de mission. Vous disposez de {MAX_NPC_CHARACTERS} emplacements de PNJ, distincts des {MAX_PLAYER_CHARACTERS} emplacements de personnages Joueur.</p>
                <ol>
                  <li>Ouvrez <Link href="/mes-personnages">Mes personnages</Link> et cliquez sur <strong>Créer un PNJ vierge</strong>.</li>
                  <li>La fiche s’ouvre directement en mode édition, sans passer par le parcours de création d’un personnage Joueur. Renseignez son identité, ses caractéristiques, ses compétences et son équipement, puis cliquez sur <strong>Valider</strong>.</li>
                  <li>Pour le rattacher à une escouade, assurez-vous qu’il est le personnage actif dans <strong>Mes personnages</strong>. Passez en mode joueur, ouvrez <Link href="/escouade">Mon escouade</Link>, puis saisissez le code d’invitation et cliquez sur <strong>Rejoindre</strong>.</li>
                  <li>Repassez en mode MJ pour retrouver le PNJ parmi les membres de l’escouade.</li>
                </ol>
                <p className="mj-help-note"><strong>À retenir :</strong> un PNJ peut rejoindre une escouade dont vous êtes le MJ. Votre propre personnage de type Joueur ne peut pas rejoindre une escouade que vous dirigez : utilisez un PNJ dédié.</p>
              </div>
            </details>

            <details className="mj-help-section">
              <summary><h2>Terminer une session et attribuer les récompenses</h2></summary>
              <div className="mj-help-body">
                <p>L’outil de fin de session applique les récompenses aux personnages participants en une seule opération.</p>
                <ol>
                  <li>Dans <Link href="/characters">Personnages</Link>, filtrez une escouade pour cibler ses membres, ou sélectionnez manuellement les participants. Cliquez sur <strong>Terminer la session</strong>.</li>
                  <li>Cochez les récompenses à appliquer. Les <strong>Konis</strong> sont répartis à parts égales, arrondies à l’entier inférieur, à partir du total saisi ; vous pouvez ajuster chaque part dans le tableau. Les <strong>points de rang</strong> sont identiques pour tous ; les <strong>points de compétence</strong> se saisissent individuellement.</li>
                  <li>Pour la <strong>Renommée de faction</strong> (réputation), choisissez la faction concernée puis saisissez le gain de chaque personnage dans le tableau.</li>
                  <li>Pour les <strong>points de faction</strong>, renseignez le commanditaire, les cibles abattues ou capturées et si la mission se déroule hors Confédération. Le calcul tient aussi compte de l’affiliation, du grade de faction et des Konis gagnés par chaque personnage.</li>
                  <li>Vérifiez les personnages ciblés et les valeurs finales dans <strong>Récapitulatif &amp; ajustements</strong>, puis cliquez sur <strong>Valider</strong> pour appliquer les récompenses aux fiches.</li>
                </ol>
                <p className="mj-help-note"><strong>À retenir :</strong> une sélection manuelle est prioritaire sur le filtre d’escouade. Décochez les récompenses inutilisées et vérifiez que les PNJ ou les absents ne sont pas inclus si vous ne souhaitez pas les récompenser.</p>
              </div>
            </details>

            <details className="mj-help-section">
              <summary><h2>Modifier la boutique et utiliser les presets</h2></summary>
              <div className="mj-help-body">
                <p>Adaptez les prix et les articles en vente pour une escouade, puis conservez vos configurations dans des presets personnels réutilisables.</p>
                <ol>
                  <li>Dans <Link href="/characters">Personnages</Link>, filtrez l’escouade concernée puis cliquez sur <strong>Modifier la boutique</strong>.</li>
                  <li>Dépliez les catégories jusqu’au niveau souhaité. Saisissez une <strong>Variation du prix (%)</strong> entière : positive pour une hausse, négative pour une réduction, jusqu’à −100 %. Utilisez <strong>Disponibilité</strong> pour laisser un article en vente ou le retirer.</li>
                  <li>Un champ de prix vide ou le choix <strong>Hériter</strong> reprend la règle du parent. Une règle plus précise remplace celle du parent ; prix et disponibilité héritent séparément. Consultez les prix de référence et après modification sur les articles.</li>
                  <li>Cliquez sur <strong>Appliquer les règles</strong> pour enregistrer la configuration sur cette escouade.</li>
                </ol>
                <p className="mj-help-example"><strong>Exemple :</strong> avec une catégorie à +20 % et un article de cette catégorie à −10 %, cet article bénéficie de −10 % sur son prix de référence. Les pourcentages ne s’additionnent pas.</p>
                <h3>Enregistrer et réutiliser une configuration</h3>
                <ul>
                  <li><strong>Sauvegarder</strong> conserve les réglages affichés dans un preset personnel : donnez-lui un nom et cliquez sur <strong>Créer</strong>, ou recherchez une sauvegarde existante pour l’écraser.</li>
                  <li><strong>Voir mes presets</strong> permet de rechercher une configuration par nom, de la <strong>Charger</strong> dans les réglages en cours ou de la <strong>Supprimer</strong>. Vous pouvez conserver jusqu’à 50 presets et les réutiliser sur vos autres escouades.</li>
                </ul>
                <p className="mj-help-note"><strong>À retenir :</strong> sauvegarder un preset n’applique pas les règles à l’escouade. Après avoir chargé un preset, cliquez aussi sur <strong>Appliquer les règles</strong>. En revanche, <strong>Réinitialiser cette section</strong> et <strong>Réinitialiser toutes les modifications</strong> enregistrent directement la réinitialisation sur l’escouade ; la réinitialisation d’une section inclut ses sous-sections.</p>
              </div>
            </details>
          </div>

          <div><Link href="/account" className="ss-btn ss-btn-ghost">Retour à mon compte</Link></div>
        </main>
      </div>
      <SiteFooter />
    </div>
  )
}
