import React from 'react';
import ArticleLayout from './shared/ArticleLayout';

const articles = [
  {
    id: 'starlancer-training',
    title: 'Formation des Starlancer',
    subtitle: 'Entraînement d\'élite',
    resume: 'Le programme de formation des pilotes d\'élite Starlancer est l\'un des plus rigoureux de la galaxie.',
    sections: [
      {
        title: 'Processus de sélection',
        content: [
          'Le processus de sélection des Starlancer est extrêmement sélectif. Seuls les meilleurs candidats sont retenus après une série d\'épreuves physiques, mentales et psychologiques.',
          'Les critères de sélection incluent non seulement les capacités de pilotage, mais aussi la résistance au stress, la capacité de prise de décision rapide et l\'adaptabilité aux situations imprévues.'
        ]
      },
      {
        title: 'Programme d\'entraînement',
        content: [
          'L\'entraînement des Starlancer dure trois ans et se divise en plusieurs phases : formation théorique, simulation de vol, combat spatial, et missions d\'entraînement en conditions réelles.',
          'Les recrues doivent maîtriser non seulement le pilotage de vaisseaux, mais aussi le combat au sol, la survie en milieu hostile, et les protocoles diplomatiques.'
        ]
      },
      {
        title: 'Spécialisations',
        content: [
          'Après la formation de base, les Starlancer peuvent se spécialiser dans différents domaines : reconnaissance, combat, transport, ou diplomatie.',
          'Chaque spécialisation requiert une année supplémentaire de formation intensive.'
        ]
      }
    ]
  },
  {
    id: 'galactic-calendar',
    title: 'Calendrier Galactique',
    subtitle: 'Mesure du temps',
    resume: 'Le système de mesure du temps unifié utilisé par toutes les civilisations de la galaxie.',
    sections: [
      {
        title: 'Origine',
        content: [
          'Suite à la rencontre avec les Stranis en 2214 (c-5), une grande conférence des poids et mesures a été organisée en 2219 (c-0), cela à permis d’établir les unités standard d’un système galactique.',
          'Dans la même optique, le nouvel an terrestre de 2220 (c0) sera utilisé comme l’an 0 du calendrier galactique.'
        ]
      },
      {
        title: 'Les unités',
        content: [
          "A la vue de la précision de la définition humaine de la seconde, celle-ci est restée la même, à savoir : « La seconde est la durée de 9 192 631 770 périodes de la radiation correspondant à la transition entre les deux niveaux hyperfins de l'état fondamental de l'atome de césium 133 à la température du zéro absolu. »",
          "Sur cette définition, la minute est définie comme étant égale à 60 secondes, et une heure étant égale à 60 minutes.",
          "Les Stranis n’avaient pas d’unité comparable à la minute, ou du moins, une seule unité précise, aussi ont-ils accepté d’utiliser ces unités humaines.",
          "Un jour correspond à une rotation de l’astre de référence.",
          "Un an, ou une année, correspond à une période de révolution de l’astre de référence.",
          "Ces deux unités sont relatives à la localisation de son utilisateur et ne sont pas utilisées en dehors de l’astre de référence.",
          "L’astre en question est généralement l’objet stellaire sur lequel on se trouve, mais si ce dernier à une rotation inexistante ou excessivement lente par rapport à un autre objet (planète, étoiles, autres…), la rotation de cet autre objet pourra être utilisée pour définir un jour.",
          "Voici les unités utilisées au niveau galactique, et parfois référencés comme unités galactiques standard :",
          "Diur : correspond à une journée galactique standard, soit 25 heures",
          "Mois : un ensemble de 25 diurs",
          "Cycle : correspond à une année galactique standard, soit 15 mois",
          "A titre de comparaison, un mois équivaut à environ 26 jours Terrestres, et un cycle équivaut à environ 390 jours Terrestres, soit 1.07 an Terrestre ou 1.7586 an Martien.",
          "Dans l’usage commun, la date se note comme suit : diur/mois/cycle",
          "Lorsqu’une date du calendrier traditionnel terrestre apparaît dans un document, le cycle correspondant est noté avec la lettre c (ex : 2576 (c333))"
        ]
      },
      {
        title: "Synchronisation",
        content: [
          "Le nouvel an Terrestre 2220 marqua le début de l’an 0 du calendrier galactique.",
          "Afin de coordonner les appareils et ce en dépit des problèmes relatifs à la relativité du temps, il a été décidé que chaque balise de chaque système comporterait une horloge atomique, est que cette dernière serait synchronisée avec un temps de référence qui à l’origine se trouvait sur <a href=\"#\" data-article=\"alcor\" class=\"text-blue-400 hover:text-blue-300\">Alcor</a>.",
          "Suite à la création du Conseil Galactique en 2543 (c302), le temps de référence a été déplacé sur Matro IV.",
          "Aujourd’hui, nous sommes en l’an 2576 du calendrier Terrien, ce qui correspond au cycle 333 du calendrier galactique."
        ]
      }
    ]
  },
  {
    id: 'terran-pandemic',
    title: 'Grande Pandémie Terrienne',
    subtitle: 'Crise historique',
    resume: 'La pandémie qui a forcé l\'humanité à quitter la Terre.',
    //sections: []
  },
  {
    id: 'languages',
    title: 'Langues',
    subtitle: 'Communication interstellaire',
    resume: 'Les différentes langues utilisées dans la galaxie.',
    //sections: []
  },
  {
    id: 'viability-index',
    title: 'Indice de viabilité',
    subtitle: 'Classification planétaire',
    resume: 'Le système de classification de la viabilité des planètes.',
    sections: [
      {
      title: 'Histoire',
      content: [
        "En 2135 (c-79) les premiers projets de colonies hors du système Hélios apparaissent.",
        "De nombreuses planètes ayant déjà été découverte, l’Union décide de créer une échelle afin de mesurer la viabilité de ces mondes.",
        "En 2137 (c-77) apparaît l’indice de viabilité, il prend une valeur sur une échelle de 0 à 5 avec 4 étapes intermédiaires chacune correspondant à un niveau de danger d’un environnement.",
        "A chaque niveau est associé une procédure de colonisation. Il revient aux Pionniers de l’Union de déterminer cet indice sur le terrain."
        ]
      },
      {
      title: "Valeurs de l'indice",
      content: [
        "Voici les différentes valeurs de l’indice de viabilité :",
        " ",
        "1 – Non viable",
        "Principalement utilisé pour les environnements où la vie est impossible, des astéroïdes aux planètes telluriques sans atmosphère ou les planètes gazeuses.",
        "Ces planètes ne sont pas aptes à recevoir une colonie, mais peuvent accueillir des bases ou installations pour collecter des ressources.",
        " ",
        "2 – Hostile",
        "La vie sur ces planètes n’est pas possible sans assistance, il reste cependant possible de développer des avant-postes. La vie coloniale reste limitée, au mieux évitée.",
        " ",
        "3 – Habitable",
        "Toute planète abritant de la vie ou étant capable de l’accueillir.",
        "Les conditions de vie peuvent être difficiles ou nécessitants des aménagements, mais il est possible de déployer une colonie.",
        " ",
        "4 – Idéal",
        "Planète regroupant toutes les caractéristiques au développement de la vie humaine.",
        "Ces mondes sont prioritaires pour le déploiement de nouvelles colonies."
        ]
      },
      {
      title: "La Terre",
      content: [
        "La terre a possédé un indice de viabilité de 4 jusqu’au début du 21eme siècle à partir du quel il est passé à 3 suite au début de la Grande Pandémie de Flutterite en 2075 (c-135).",
        "En 2153 (c-61), l’indice de la Terre passe à 2 suite aux derniers relevés atmosphériques."
        ]
      }
    ]
  },
  {
    id: 'rewards',
    title: 'Disctinctions',
    subtitle: 'Les distinctions des Starlancers',
    resume: 'Liste des différentes médailles et disctinctions des Starlancers.',
    sections: [
      {
        title: '',
        content: [
          "Lors de leur carrière, les Starlancer peuvent se voir remettre des distinctions honorifiques.",
          "En voici la liste complète et leur <a href=\"#\" data-article=\"confederal-orgs\" class=\"text-blue-400 hover:text-blue-300\">organisation</a> d'origine."
        ]
      },
      {
        title: 'Plaques de service & d’honneur - Consortium',
        content: [
          "Lorsqu’un Starlancer prend sa retraite (temporaire ou non), le Consortium lui fait graver une plaque nommée « Plaque de service ».",
          "Dessus se trouve le nom du Starlancer (avec surnom(s) s’il(s) existe(nt)), le nom des escouades auxquelles il a appartenu, idem pour les Divisions.",
          "Enfin, se trouve la date d’acquisition de sa licence et la date de gravure de la plaque (qui peut être modifiée si le Starlancer reprend une activité).",
          "La plaque est créée en deux exemplaires, l’originale est envoyée au Starlancer et la copie au musée du Consortium à New Gaïa sur Mars. Elle y sera placée à la vue du public dans l’aile des « Remerciements ».",
          "Le Starlancer lui-même ou sa famille peut choisir d’envoyer la plaque originale au musée à la place de la copie (cela se fait généralement après la mort du Starlancer).",
          "La plaque en argent pur a pour dimensions 20x10x2 cm",
          "Sur le même principe que la plaque de service, la plaque d’honneur est donnée à titre posthume pour tous les Starlancer morts en mission.",
          "Le contenu est identique à la plaque de service.",
          "L’originale est envoyée à la famille du Starlancer et la copie au musée du Consortium pour l’aile des « Étoiles ».",
          "La plaque en vermeil (alliage d’or et d’argent) a pour dimensions 20x10x2 cm.",
          "A côté de leur plaque respectives, les Starlancer peuvent sur demande exposer leurs autres distinctions."
        ]
      },
      {
        title: 'Terra Coin - Guilde',
        content: [
          "Tous les 10 cycles, le conseil dirigeant de la Guilde se réunit pour choisir parmi les plus hauts gradés (Magnats) celui ou celle ayant eu l’impact le plus significatif sur le développement de l’activité de la Guilde sur les dix derniers cycles.",
          "Les discussions prennent en général plusieurs mois au bout desquels le « gagnant » se voit remettre une Terra Coin.",
          "Lors de l’exode de la Terre, beaucoup de civils possédaient sur eux des restes de monnaie utilisés alors. Toutes ces pièces ont été récupérées et refondues. La Guilde en a fait des pièces de 8cm de diamètre pour 1cm d’épaisseur frappées à l’image de la Terre (vu sur l’Eurasie et l’Afrique d’un côté et l’Amérique et l’Océanie de l’autre).",
          "Ce sont ces pièces qui sont maintenant appelées « Terra Coins ».",
          "Avant la remise, la pièce est frappée du nom du Starlancer ."          
        ]
      },
      {
        title: 'Explorator - Union',
        content: [
          "Tous les 20 cycles, le conseil dirigeant de l’Union se réunit pour récompenser leur meilleur Pionnier (plus haut grade de l’Union).",
          "Ce choix prend en compte les activités des Starlancer, leurs aides et ou investissements auprès des colonies et de la recherche, ainsi que leur attitude générale auprès des autres espèces.",
          "Le gagnant désigné se voit remettre un trophée nommé « Explorator » représentant les sondes Voyager 1 & 2 du programme spatial américain éponyme de 1977 (c-227). Le nom du Starlancer est gravé à la base du trophée."
        ]
      },
      {
        title: 'Laurels - Alliance',
        content: [
          "Lors de ses missions de catégorie 4 ou 5 en temps de paix, ou lors d'opérations de grande envergure en temps de guerre, l’Alliance désigne des commandants d’opération sur place (ou ses derniers prennent le commandement par leur grade en cas d’opération non planifiée).",
          "Dans le cas où les résultats de l’opération sont particulièrement remarquables, les instances des Divisions Opérationnelle et Stratégique peuvent récompenser les commandants de ces opérations.",
          "Il s’agit d’une médaille représentant une couronne de laurier de 4x3 cm.",
          "Le matériau du laurier représente la difficulté de l’opération jugée par les Divisions : Bronze – Argent (Silver) – Or (Gold) – Or noir (Black)",
          "Ces récompenses mettent en valeur les capacités stratégique des Starlancer et ne sont pas réservées aux membres de l’Alliance."
        ]
      },
      {
        title: 'Green Star - Confédération',
        content: [
          "Lors d’opérations critiques, généralement en temps de guerre ou bien face à de grandes menaces pirates ou aliens localisées, une escouade peut être amenée à réaliser l’impossible.",
          "Dans le cas où une escouade parvient à effectuer une telle action d’éclat sans perdre de membres, l’Organisation en charge de la mission peut faire une demande de Green Star auprès des instances dirigeantes de la Confédération.",
          "Cette demande sera soumise à l’approbation des autres Organisations (Consortium compris) et enfin votée à l’assemblée d’Alcor.",
          "Il s’agit de la plus haute distinction possible que puisse recevoir un Starlancer.",
          "Et comme mentionné, elle est accordée à tous les membres de l’escouade, et jamais à titre posthume.",
          "La Green Star est une médaille formée d’une émeraude taillée en étoile plate de 5x5 cm.",
          "Cette distinction reste exceptionnelle, et depuis sa création en 2356 (c127) jusqu’à aujourd’hui (2576 (c333)) seule 134 Green Star ont été remises (dont 88 lors de la guerre Tork)."
        ]
      }
    ]
  }

];

export default function Culture({ onBack, selectedArticleId }: { onBack: () => void, selectedArticleId?: string | null }) {
  return (
    <ArticleLayout 
      title="Culture"
      articles={articles}
      onBack={onBack}
      selectedArticleId={selectedArticleId}
    />
  );
}