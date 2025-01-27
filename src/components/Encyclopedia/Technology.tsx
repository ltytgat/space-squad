import React from 'react';
import ArticleLayout from './shared/ArticleLayout';

const articles = [
  {
    id: 'shields',
    title: 'Boucliers',
    subtitle: 'Protection énergétique',
    resume: 'Les boucliers sont des champs de force qui protègent les vaisseaux et les installations, une technologie fondamentale pour la survie dans l\'espace.',
    sections: [
      {
        title: 'Histoire',
        content: [
          "À la fin du 21eme siècle, le Consortium est confronté à un problème de taille à cause des débris, les vaisseaux vont à une telle vitesse que le moindre débris entraîne des dégâts très importants. Pour pallier le problème, des blindages renforcés sont mis au point, mais leur poids devient une autre source de problèmes, entraînant une consommation excessive sur les générateurs.",
          "En 2129 (c-85), une nouvelle technologie apparaît, un émetteur de champs de forces gravitationnelles. Ce dernier est capable de créer une surface déviant les projectiles dans une certaine limite, cette technologie sera appelée \"Boucliers cinétiques\", puis abrégé en \"Boucliers\" par la suite."
        ]
      },
      {
        title: "L’évolution des technologies",
        content: [
          "Les premiers prototypes d’émetteurs de champs de forces gravitationnelles permettaient de créer une surface de quelques centimètres carrés pouvant dévier de petits projectiles à faible vitesse.",
          "Il faudra attendre 8 ans avant d’avoir un modèle capable de projeter une surface sur plus de 10m² et capable de suivre le fuselage d’un vaisseau.",
          "En 2132 (c-82), les vaisseaux sont équipés de boucliers, un émetteur pour l’avant et un pour l’arrière.",
          "Même si techniquement il serait possible de couvrir tout un vaisseau avec un seul émetteur, la répartition de puissance le rendrait pratiquement inutile.",
          "A partir de cet instant, les voyages spatiaux n’engendrent plus de dommages sur les blindages des vaisseaux qui peuvent retirer leurs blindages superflus.",
          "C’est en 2195 (c-23) que la technologie des boucliers sera miniaturisée pour être intégrés dans des pièces d’armure.",
          "Puis en 2254 (c32), grâce aux théories du scientifique <a href=\"#\" data-article=\"stranis\" class=\"text-blue-400 hover:text-blue-300\">Strani</a> Kl’Tras, les boucliers d’armures pourront être harmonisés en un seul champ de forces là où ils étaient tous indépendants par avant.",
          "Enfin, en 2321 (c95), les boucliers deviennent capables de dévier des projectiles énergétiques.",
          "Depuis, les boucliers ont peu changé dans leur fonctionnement, les seules évolutions concernent leur consommation et leur efficacité."
        ]
      },
      {
        title: "Fonctionnement",
        content: [
          "Les boucliers, qu’ils soient sur des vaisseaux ou des armures fonctionnent sur le même principe.",
          "Un émetteur crée un champ de forces gravitationnelles qui prend la forme de son support. Soit le fuselage d’un vaisseau, soit le membre sur lequel se trouve la pièce d’armure.",
          "Dans le cas d’une armure, s’il y a plusieurs champs de forces proches les uns des autres, il vont se réorganiser pour former une sorte de cocon qui va englober toutes les zones émettrices.",
          "Ces champs de forces sont toujours formés avec une forme de courbe.",
          "Lorsqu’un projectile arrive sur un champ de forces, ce dernier réagi différemment selon s’il s’agit d’un projectile thermique ou physique.",
          "Dans le premier cas, la chaleur est déviée par la force du champ dans toutes les directions en dehors du point d’impact, la dépense en énergie est importante pour le bouclier.",
          "Autrement, en cas de projectile physique, ce dernier va entrer en collision avec une force cinétique. Le bouclier va chercher à faire \"glisser\" le projectile en déviant son vecteur d’approche le long de la courbe du champ.",
          "La dépense énergétique du bouclier reste minime mais dépend de la taille du projectile, si ce dernier est trop gros, le bouclier ne pourra rien faire.",
          "De même, en cas de projectile à très haute vélocité (proche de la vitesse lumière), le bouclier peut ne pas avoir le temps de reformer le champ de forces et donc laisser une ouverture pouvant (si elle est trop importante) détruire complètement ce dernier."
        ]
      },
      {
        title: "Usage",
        content: [
          "Aujourd’hui, les boucliers font partie du quotidien des Starlancer, aussi bien sur leurs vaisseaux que leurs combinaisons.",
          "Ils ne sont cependant pas infaillibles et s’ils sont mal utilisés peuvent mener à des catastrophes.",
          " ",
          "Extrait du \"Manuel de formation\" des starlancers du Consortium (Éditions 332) sur le chapitre dédié aux boucliers :",
          "« Rappel : Les boucliers peuvent dévier les projectiles thermiques au prix d’une consommation importante d’énergie.",
          "Un bouclier ne peut dévier un projectile plus important que la surface de son champ de forces ou si un projectile subit un autre vecteur de poussée durant sa déviation (ex : armes de mêlée).",
          "Un projectile à vitesse lumière peut engendrer la destruction complète d’un champ de forces gravitationnelles.",
          "Attention aux conditions météorologiques, les gouttes de pluie sont des projectiles et affaibliront votre bouclier personnel. »"
        ]
      },
    ]
  },
  {
    id: 'gtv',
    title: 'Générateur de Trou de Ver (GTV)',
    subtitle: 'Voyage spatial',
    resume: 'Le GTV permet le voyage rapide entre des points éloignés de l\'espace, révolutionnant l\'exploration galactique.',
    sections: [
      {
        title: 'Histoire',
        content: [
          "Alors que le projet <a href=\"#\" data-article=\"alcor\" class=\"text-blue-400 hover:text-blue-300\">Alcor</a> est toujours en cours et que New Gaïa commence à peine à s’émanciper, il est évident que l’humanité reste prisonnière du voisinage de la Terre. « Si nous voulons aller plus loin, il est indispensable de repenser notre technologie de voyage spatial » - Theo Hawkins (Fondateur de l’UCRS)",
          "En 2070 (c-140) est lancé le projet de l’Union des Centres de Recherches Spatiales (UCRS), consistant en deux centres de recherches sur Phobos et Déimos, les lunes de Mars regroupant tous les chercheurs spécialisés dans les technologies spatiales sur Terre.",
          "L’UCRS entre en activité en 2078 (c-132) peu après le début de pandémie de Flutterite sur Terre. Son premier objectif : révolutionner le concept de navette spatiale.",
          "C’est en 2094 (c-117) qu’est créé le premier Générateur de Trou de Ver (GTV) fonctionnel. Un an plus tard, le premier test sans incident permet un trajet Mars-Neptune en moins de 5 heures (10 heures aller-retour).",
          "Le premier trajet habité se fera en 2099 (c-112) par la pilote Elizabeth Patel.",
          "Depuis ce jour, le GTV est devenu le pilier de l’exploration extra-stellaire humaine, sans lui, l’humanité serait toujours dans le système Hélios."
        ]
      },
      {
        title: 'Fonctionnement',
        content: [
          "Le GTV utilise plusieurs propriétés des particules en physique quantique, la plus importante étant la réaction simultanée de particules liées.",
          "Il est possible de liées deux particules élémentaires par un processus complexe et très coûteux (en énergie) pour créer des singularités. Une fois liées, ces particules réagiront simultanément dans les mêmes proportions à un stimulus extérieur appliqué à seulement l’une d’entre elles. Et cette réaction sera simultanée qu’importe la distance physique qui les sépare.",
          "À partir de là, il devient possible d’établir une « connexion » longue distance entre deux points de l’espace.",
          "Or, en utilisant les bons rayonnements, il est possible d’ouvrir un trou de ver. Si ce rayonnement est ouvert sur l’une des particules jumelles, l’autre ouverture du trou de ver serra sur l’autre. Nous venons de créer un trou de ver de Lorentz (à masse négative). Il restera ouvert tant qu’il est alimenté en énergie."
        ]
      },
      {
        title: 'Usage',
        content: [
          "Dans la pratique, il y a deux méthodes : les trajets interstellaires ou interplanétaire.",
          "Entre deux systèmes, les singularités sont stockées dans les <a href=\"#\" data-article=\"communications\" class=\"text-blue-400 hover:text-blue-300\">balises de communication</a> . Lorsqu’un vaisseau demande à voyager vers un autre système, la balise regarde si la destination est disponible, et si oui, active sa singularité.",
          "Celle ce trouvant dans le système de destination réagit, et la balise l'éjecte pour créer le point de chute (en dehors de sa structure et orbite proche).",
          "S’ensuit la création du trou de ver qui reste alimenté des deux côtés par les balises.",
          "Ces trajets durent en général quelques minutes pour les systèmes voisins.",
          "Pour les trajets interplanétaires, ce sont les vaisseaux qui possèdent les deux singularités, il en projette une dans la direction voulue à la vitesse de la lumière, une fois que la particule projetée est (selon estimation) à destination, on active alors celle restant pour créer le trou de ver. Un émetteur de rayonnement monté sur drone est laissé à l’entrée pour garantir l’alimentation durant la traversée, une fois sortie, le vaisseau alimente à son tour le trou de ver pour permettre à l'émetteur sur drone de traverser.",
          "Ces trajets ont des durées variables, la traversée du trou de ver en lui-même ne dure que quelques minutes, mais le temps de préparation dépend de la distance qui sépare le vaisseau de sa destination. Ainsi, le trajet Mars-Neptune prend 4 heures et quelques minutes pour envoyer la singularité et activer le trou de ver, mais prend moins de 5 minutes à faire."
        ]
      },
      {
        title: 'Risques et incidents',
        content: [
          "Le principal risque réside dans la sous-alimentation du trou de ver. S’il n’est plus alimenté, il s’effondre à vitesse exponentielle. L’effet est similaire à une paille dont on pincerait le centre en remontant vers les deux extrémités. Tout ce qui se trouve alors dans le trou ressort d’un côté ou de l’autre sous une forme de bouilli de particule, sachant que plus l’objet est proche du milieu lors de la rupture, plus l’éjection sera violente et rapide.",
          "Il est donc théoriquement possible de se servir de trou de ver comme d’un canon spatial, mais cela n’a jamais été expérimenté, principalement à cause de la vitesse de rupture du trou, il est non seulement difficile de prévoir avec exactitude quand il va se refermer totalement, et il reste impossible d’orienter les extrémités vers une cible potentielle.",
          "Suite à un incident ayant entraîné la mort d’un équipage d’un cargo en 2245 (c23) à cause d’un défaut d’alimentation d’une balise, il a été décidé d’alimenter les trous de ver extra-stellaire des deux côtés.",
          "La principale restriction de l’utilisation des trous de ver réside dans l’environnement de déploiement. Il est nécessaire que le portail s’ouvre et se ferme sur une zone de vide spatiale.",
          "En cas d’ouverture sur une zone atmosphérique, l’air ambiant pourrait être aspiré par le trou, trois cas sont possibles alors : soit le trou agit comme un sas et empêche l’air d’y entrer, soit l’air y est aspiré et ressort de l’autre coté, soit l’air est prisonnier du trou le temps que ce dernier reste ouvert (formant un canon à air lors de la fermeture).",
          "Tous ces cas de figure restent des théories et dépendent de trop de facteurs pour déterminer quel cas serait le plus probable selon le trou ouvert.",
          "Quoi qu’il en soit, les mesures de sécurité installée sur les vaisseaux sont censées éviter ses scénarios."
        ]
      }
    ]
  },
  {
    id: 'communications',
    title: 'Communications',
    subtitle: 'Balises & Voyage',
    resume: 'Les balises de communication permettent les échanges entre les différents systèmes stellaires.',
    sections: [
      {
        title: 'Histoire',
        content: [
          "En 2240 (c19), le projet Hope I est lancé, il s’agit là de l’établissement de la première colonie en dehors du système Hélios.",
          "Lors de son élaboration, un problème de taille est mis sur la table, les moyens de communication.",
          "En effet, pour communiquer entre deux systèmes, l’usage de signaux « classiques », comme la lumière, n’est pas possible.",
          "Il devient donc nécessaire d’utiliser des vaisseaux pour transférer les informations d’un système à l’autre.",
          "Les <a href=\"#\" data-article=\"stranis\" class=\"text-blue-400 hover:text-blue-300\">Stranis</a> utilisaient à cette époque les convois marchands pour le transfert de données, ils étaient suffisamment nombreux pour permettre des échanges relativement efficaces.",
          "En 2244 (c22), le premier prototype de balise de communication est mis au point.",
          "Les phases d’essais sont très encourageantes.",
          "En 2310 (c84), les Stranis adoptent le système des balises et raccordent leur réseau à celui de la Confédération."
        ]
      },
      {
        title: 'Les balises',
        content: [
          "Chaque système comportant une construction possède une balise de communication.",
          "Elle a pour fonction de réguler les trafics des vaisseaux et le transfert des informations vers les systèmes voisins.",
          "Chaque balise de chaque système communique avec ses voisines, chaque secteur possède une balise « Maître » qui centralise certaines informations des systèmes sous son contrôle.",
          "Les balises Maître font remonter ces données aux balises serveurs qui supervisent plusieurs secteurs, et si besoin, renvoi les informations vers les serveurs centraux utiles (<a href=\"#\" data-article=\"alcor\" class=\"text-blue-400 hover:text-blue-300\">Alcor</a>, Conseil Galactique, etc.).",
          "Ce système possède une certaine latence, latence d’autant plus importante que l’information a besoin de remonter haut dans la hiérarchie.",
          "C’est l’Union qui a la charge de la maintenance et des mises à jour des balises.",
          "Et l’Alliance qui s’occupe de la protection et de la surveillance."
        ]
      },
      {
        title: 'Fonctionnement',
        content: [
          "Les balises ont une forme ellipsoïde, elles contiennent 3 parties, la partie supérieure sert à la réception, l’inférieur à l’envoi, et la centrale au stockage.",
          "Qu’elles soient simples, Maître, ou serveurs, seule la taille les différencie.",
          "La zone d’envoi comporte une certaine quantité de drones autonomes.",
          "Ces drones (de la taille d’un Homme), sont équipés d’un espace de stockage de données.",
          "La balise envoie ces drones aux systèmes voisins (un par système) afin de rependre les informations.",
          "De même, elle reçoit les drones des autres systèmes qui arrive dans la zone supérieure. Ils sont récupérés, la balise fait le plein de carburant, et récupère les informations.",
          "Les drones passent ensuite dans la section inférieure pour être réutilisés.",
          "Les données sont transmises aux zones locales par ondes radios.",
          "Afin d’éviter un usage trop important du GTV des balises, les drones sont envoyés à intervalle de temps régulier (sauf en cas d’urgence).",
          "La partie centrale traite les données pour les communiquer aux bons systèmes.",
          "Elle s’occupe aussi de la régulation du trafic, lorsqu’un vaisseau (ou drone) est en approche du système, la balise va lui communiquer les coordonnées de sortie de l’hyperespace de sorte à ne pas gêner le trafic des drones.",
          "Enfin, sur les deux sommets de la balise se trouvent deux canons automatiques qui servent à détruire les débris proches, et à dissuader (en plus des forces locales de l’Alliance) ceux qui voudraient s’en prendre aux drones."
        ]
      }
    ]
  },
  {
    id: 'weapons-usage',
    title: 'Usage des armes',
    subtitle: 'Réglementation et fabrication',
    resume: 'Un aperçu complet de la classification des armes, de leur fabrication et de leur réglementation à travers la Confédération.',
    sections: [
      {
        title: 'Civils & militaires',
        content: [
          "Il existe plusieurs catégories pour les armes :",
          "Armes de fortune",
          "Armes de défense non létales",
          "Armes de sécurité",
          "Armes de guerre",
          "Les armes de guerre sont celles utilisées par les Starlancers du Consortium, les soldats de l'Alliance ou l’armée <a href=\"#\" data-article=\"stranis\" class=\"text-blue-400 hover:text-blue-300\">Strani</a>.",
          "Les armes de sécurité concernent les armes des forces de sécurité locales des <a href=\"#\" data-article=\"colony-politics\" class=\"text-blue-400 hover:text-blue-300\">colonies</a>. Leurs usage est principalement l’intimidation d’éventuels pirates.",
          "Les armes de défense non létales servent au « maintien de la paix » par les forces de l’ordre et selon les colonies l’auto-défense des citoyens.",
          "Enfin, les armes de fortune désignent tout objet utilisé par quiconque sur un autre individu ou lui-même, il s’agit surtout d’un terme juridique plus que fonctionnel."
        ]
      },
      {
        title: "Fabricants",
        content: [
          "<b>Officiels</b>",
          "L’écrasante majorité des armes utilisées par les Starlancers sont issus des manufactures de l’Alliance, sauf quelques rares exceptions (en particulier des armes expérimentales). La conception de ces armes (ainsi que leurs améliorations) peuvent provenir de différentes sources, mais la fabrication reste l’œuvre de l’Alliance.",
          "Idem pour les Stranis, les armes de l’armée sont fabriquées par l’armée elle-même.",
          "Ces méthodes de production permettent un contrôle sur la diffusion des armes.",
          "<b>Le cas <a href=\"#\" data-article=\"cerberi\" class=\"text-blue-400 hover:text-blue-300\">Cerberi</a></b>",
          "Cerberi n’ayant pas les infrastructures de la Confédération, elle a mis au point son propre modèle de fusil et le produit pour son armée régulière.",
          "Il arrive cependant que des membres de Cerberi récupère les armes de leurs adversaires dès qu’il en ont l’occasion. Il n’est donc pas rare de les voir équipés d’armes de l’Alliance.",
          "<b>Privés</b>",
          "Rare sont les entreprises privées a avoir reçu une autorisation de fabrication d’armes. A ce jour, seuls deux peuvent le faire : Omnihim et Intrasog.",
          "Elles sont limitées aux armes de sécurité et de défense non létales et sont donc les principales fournisseurs de matériel de sécurité pour les colonies.",
          "Tout nouveau produit doit être approuvé par l’Alliance et toute transaction par la Guilde.",
          "Elles ont également l’interdiction de commercer avec Cerberi."
        ]
      },
      {
        title: "Usage",
        content: [
          "Les armes de guerre étant réservées à l’usage des Starlancers et des forces armées, toute possession d’une de ces armes par un civil est un délit selon le <a href=\"#\" data-article=\"alcor-tribunal\" class=\"text-blue-400 hover:text-blue-300\">CCA</a> : « Tout citoyen amené à se retrouver en possession d’une arme de guerre devra impérativement prévenir un représentant de l’autorité la plus proche afin de lui remettre l’arme. Ce dernier prendra soin de la sceller et de la déposer à la caserne la plus proche ».",
          "En dehors du marché noir, il est impossible pour un citoyen non-Starlancer de se procurer une telle arme. La vente est faite en caserne et uniquement à des Starlancers ou bien lors de transaction inter-espèces entre institutions armées.",
          "Toute transaction d’armes de sécurité est encadrée par la Guilde et est à destination des gouvernements coloniaux uniquement. Si une telle arme se retrouve dans les mains d’un citoyen, c’est le gouvernement qui en a fait l’acquisition qui est responsable.",
          "De même lors de toute mauvaise utilisation par les forces de sécurité, selon la faute commise, cela peut relever de l’individu lui-même ou bien du manque de formation, qui est alors la responsabilité du gouvernement.",
          "Même fonctionnement pour les armes de défense non létales, sauf qu’il est possible pour un gouvernement d’autoriser la possession de ces armes à des civils formés et porteurs d’un permis (ce permis n’est valable que dans la colonie d’acquisition)."
        ]
      }
    ]
  }
];

export default function Technology({ onBack, selectedArticleId }: { onBack: () => void, selectedArticleId?: string | null }) {
  return (
    <ArticleLayout 
      title="Technologie"
      articles={articles}
      onBack={onBack}
      selectedArticleId={selectedArticleId}
    />
  );
}