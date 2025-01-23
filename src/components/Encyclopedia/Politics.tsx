import React from 'react';
import ArticleLayout from './shared/ArticleLayout';

const articles = [
  {
    id: 'alcor',
    title: 'Alcor',
    subtitle: 'Capitale de l\'humanité',
    resume: 'Alcor est la station spatiale qui sert de capitale à la Confédération, symbole de la renaissance de l\'humanité après l\'exode terrestre.',
    sections: [
      {
        title: 'Histoire',
        content: [
          "En 2051 (c-158), alors que l’humanité se sait condamnée sur Terre, le Projet Alcor voit le jour.",
          "Ce dernier consiste en la mise en orbite de Mars d’une station spatiale servant de transit entre l’espace et la surface de la planète rouge afin d’y établir la première colonie extraterrestre.",
          "Le premier module est lancé en 2060 (c-149) et marque la fondation de la Station Alcor.",
          "Suite à la fondation de l’UCH en 2114 (c-99), Alcor est nommé capitale.",
          "Aujourd’hui, Alcor est la capitale du système Hélios, de la <a href=\"#\" data-article=\"confederation\" class=\"text-blue-400 hover:text-blue-300\">Confédération</a> et communément de l’humanité."
        ]
      },
      {
        title: 'Construction',
        content: [
          "Le premier module à arriver en orbite de Mars se nomme le cœur central, il contient tous les systèmes, protocoles et robots autonomes pour permettre d’y accrocher d’autres modules.",
          "Le deuxième module baptisé « Archives » contient les serveurs de l’encyclopédie humaine. Ainsi, même si l’humanité ne parvenait pas à survivre, il resterait une trace de ses connaissances.",
          "Les modules 3 et 4 contenaient tout le nécessaire pour la production de nourriture en orbite pour un équipage réduit.",
          "Le cinquième module contenait lui le matériel de contrôle à distance pour les premiers appareils de colonisations.",
          "Les modules 6 et 7 furent les premiers quartiers d’habitations. Ces modules furent envoyés avec 32 membres d’équipage.",
          "Nous sommes alors en 2068 (c-142), l’équipage d’Alcor doit préparer au mieux la station pour rediriger la première arche de colon vers la nouvelle colonie New Gaïa sur Mars. Ils disposaient pour cela de 4 ans.",
          "En 2072 (c-138), la liaison est établie entre les colons de New Gaïa et la station Alcor.",
          "Entre-temps, la station aura reçu 8 nouveaux modules et 128 membres d’équipage.",
          "L’épidémie de Flutterite sur Terre augmente la vitesse de production des modules.",
          "En 2084 (c-127), le projet Alcor est terminé et la station est opérationnelle.",
          "La station est capable d’accueillir jusqu’à 1000 personnes.",
          "Au fil des siècles, Alcor a été agrandis, la station d’origine est aujourd’hui la pièce centrale de la station, un cylindre de 1000m de haut avec à sa base une structure circulaire la reliant aux 3 autres secteurs cylindriques de 3050 m (3380 m pour celui de l’Alliance)."
        ]
      },
      {
          title: "Secteurs",
          content: [
          "Alcor est composée de 5 secteurs :",
          "Secteur central",
          "Secteur systèmes",
          "Secteur de l’<a href=\"#\" data-article=\"alliance-org\" class=\"text-blue-400 hover:text-blue-300\">Alliance</a>",
          "Secteur Agricole",
          "Secteur des habitations",
          "Le secteur central (vert) est la station d’origine de 2084 (c-127), elle contient toutes les institutions administratives de la Confédération dont le parlement et la constitution originale de 2114 (c-99).",
          "Le secteur système (rouge) regroupe tous les modules de gestion dont le cœur central.",
          "C’est d’ici qu’est géré toute la station et c’est par ses ascenseurs express que l’on peut passer d’un secteur à l’autre.",
          "Le secteur de l’Alliance est le QG de cette <a href=\"#\" data-article=\"confederal-orgs\" class=\"text-blue-400 hover:text-blue-300\">Organisation</a>, il regroupe un chantier spatial, le conseil de l’amirauté et les différentes divisions.",
          "Le secteur Agricole regroupe toutes les zones de culture permettant de fournir la station en nourriture, eau et air. La production de ce secteur peut permettre de faire vivre jusqu’à 100.000 habitants.",
          "Enfin le secteur des habitations contient tous les quartiers d’habitations des membres de la station.",
          "<img src='/images/Alcor.png' alt='Station Alcor' class='w-full rounded-lg shadow-lg my-4' />"
          ]
      },
      {
          title: "Données statistiques",
          content: [
          "Gravité rotationnelle dans les secteurs : 1 g",
          "Gravité rotationnelle dans le secteur central : 0,7 g",
          "Gravité rotationnelle dans le secteur système : 0,9 g",
          "Longueur totale : 3,7 km",
          "Diamètre : 1,6 km",
          "Longueur des Secteurs : 3,05 km",
          "Diamètre des Secteurs : 400 m",
          "Diamètre de l'anneau du secteur système : 1,2 km",
          "Largeur de l'anneau du secteur système : 75 m",
          "Hauteur de la tour du secteur central : 1050 m",
          "Épaisseur du blindage externe : 8 m",
          "Population : 80 453 habitants",
          "Capacité maximum : évalué à 100.000 habitants",
          "Masse totale : 1,15 milliard de tonnes",
          ]
      }
    ]
  },
  {
    id: 'confederation',
    title: 'Confédération',
    subtitle: 'Union des colonies humaines',
    resume: 'La Confédération est l\'organisation politique qui unit toutes les colonies humaines, établie pour assurer la survie et la prospérité de l\'humanité.',
    sections: [
      {
        title: 'Histoire',
        content: [
          "Tout commence en 2084 (c-126), lorsque des membres de certains gouvernements de la Terre se sont exilés sur <a href=\"#\" data-article=\"alcor\" class=\"text-blue-400 hover:text-blue-300\">Alcor</a>, ils avaient la charge de préparer une structure politique pour Alcor et New Gaïa et de laisser ce système aux réfugiés de la Terre au plus tard en 2094.",
          "On retiendra en particulier l’instauration de l’Alcorien comme langue unique en 2090 (c-121), et la création du Consortium en 2097 (c-115).",
          "Les colons de New Gaïa prennent le pouvoir en 2093, les gouvernements se succèdent et permettent à la colonie de se développer et accueillir plus de monde.",
          "C’est en 2113 (c-100) qu’entre en vigueur le CCA, ce qui sera la pierre fondatrice de l’Union Confédérale Humaine (UCH) l’année suivante.",
          "L’UCH deviendra la Confédération en 2184 (c-33)."
        ]
      },
      {
        title: 'Système politique',
        content: [
          "La Confédération est fondée sur deux textes : le CCA, et le Traité d’Alcor.",
          "Le premier est la Loi, le second est la constitution.",
          "Ainsi, chaque colonie pourra être autonome et indépendante, ou bien ratifier le traité d’Alcor et faire partie de la Confédération.",
          "Chaque colonie est donc indépendante en matière de politique, d’économie et de sécurité. En contrepartie, la gestion de l’éducation, la formation, les échanges extra-planétaires, l’armée, la recherche, l’exploration et la justice sont appliquées par de grandes <a href=\"#\" data-article=\"confederal-orgs\" class=\"text-blue-400 hover:text-blue-300\">organisations</a> extra-stellaires.",
          "Ces organisations que sont le Consortium, l’Alliance, la Guilde, l’Union et le Tribunal d’Alcor sont indépendantes et fonctionnent en circuit fermé.",
          "Chaque organisation doit également désigner deux membres de leur conseil dirigeant qui feront partie de la délégation représentative de la Confédération au <a href=\"#\" data-article=\"galactic-council\" class=\"text-blue-400 hover:text-blue-300\">Conseil Galactique</a>.",
          "C’est cette délégation qui représente l’humanité lors des rencontres avec d’autres espèces. Elle nomme également l’un de ses membres pour faire partie du Conseil Galactique sur Matro IV."
        ]
      },
      {
        title: 'Citoyenneté',
        content: [
          "Tout individu acquiert la citoyenneté à sa majorité (20 cycles / 21,39 ans pour les humains) et après un service de 2 ans effectué dans l’une des Organisations au choix. Ce statut confère les droits suivants garantis par la constitution :",
          "« Tout citoyen doit être libre de pouvoir quitter la colonie avec ses biens en toute sécurité. »",
          "« Tout citoyen peut exprimer son opinion lors des référendums de réforme du CCA et/ou du Traité d’Alcor. »",
          "« Tout citoyen peut exercer son droit d’expression et de liberté de parole. »",
          "Néanmoins, chaque colonie ayant son propre système politique, le statut de citoyen peut ne pas être suffisant pour accéder à certaines fonctions locales."
        ]
      },
      {
        title: 'Relations extérieures',
        content: [
          'La Confédération maintient des relations diplomatiques étroites avec la République Strani et participe activement au Conseil Galactique.',
          'Sa politique étrangère est marquée par un équilibre entre coopération et préservation des intérêts humains.'
        ]
      }
    ]
  },
  {
    id: 'confederal-orgs',
    title: 'Organisations confédérales',
    subtitle: 'Structures administratives',
    resume: 'Les différentes organisations qui composent la Confédération.',
    //sections: []
  },
  {
    id: 'alcor-tribunal',
    title: 'Tribunal d\'Alcor',
    subtitle: 'Justice confédérale',
    resume: 'Le Tribunal d\'Alcor est la plus haute instance judiciaire de la Confédération.',
    //sections: []
  },
  {
    id: 'cerberi',
    title: 'Cerberi',
    subtitle: 'Faction dissidente',
    resume: 'Cerberi est une nation indépendante issue d\'une scission avec la Confédération.',
    sections: [
      {
        title: 'Origine',
        content: [
          "En 2355 (c126), la guerre totale contre les Torks est décrétée.",
          "Les Stranis intègrent l’Alliance l’annee suivante.",
          "En 2358 (c129), face à la puissance des Torks et leur capacité d’invasion, l’Alliance lance l’initiative Cerberi : une organisation au commandement autonome ayant pour but de surveiller les frontières de l’espace coloniale et de prévenir toute invasion Tork.",
          "Face à la gestion de la guerre par l’Alliance, l’Amiral Cramer dirigeant de Cerberi déclare la sécession en 2368 (c138).",
          "Les « rebelles » de Cerberi sont considéré par l’Alliance comme des ennemis potentiels, mais vu leur puissance de feu, leur effectif, et le faible nombre de systèmes sur lesquelles ils se trouvent, leur capacité défensive est suffisante pour tenir tête aux Torks sur ces systèmes.",
          "En 2397 (c165), les Torks ont été repoussés hors de l’espace colonial, l’annee suivante, la sécession de Cerberi est acté par l’Alliance et la Confédération.",
          "Cerberi déclare l’indépendance en 2399 (c167)."
        ]
      },
      {
        title: "L'initiative",
        content: [
          "En 2358 (c129), alors que la guerre n’a commencé que depuis 2 ans, l’Alliance se retrouve face à un problème de taille, les Torks sont capables d’envahir des systèmes à une telle vitesse qu’il est impossible de préparer une riposte à temps pour les empêcher de s’installer sur une planète.",
          "Il devient donc nécessaire de poster des guetteurs dans les systèmes frontaliers. Ils devront également être suffisamment autonomes pour pouvoir agir sans attendre d’ordre du commandement supérieur.",
          "L’initiative Cerberi est lancée, avec à sa tête le Vice-Amiral Cramer, il sera posté dans une base frontalière et aura pour tâche de coordonner les ripostes de tous les postes frontaliers.",
          "Pour ce faire, il obtient les pleins pouvoirs sur toutes ces bases",
          "Après 5 ans, l’initiative Cerberi est un succès, l’avancée des Torks est presque immobilisée sur le front humain. Cramer est promu Amiral.",
          "En 2368 (c138), face à cette résistance, les Torks ont contourné les secteurs frontaliers et sont passés par des systèmes inhabités pour atteindre l’espace Strani.",
          "L’Alliance ordonne à Cerberi de se coordonner avec les défenses Stranis.",
          "Face au risque d’exposer ses mondes aux Torks, l’Amiral Cramer refuse d’envoyer des troupes.",
          "Cette décision entraînera la perte de 3 mondes Stranis, alors que l’espace humain restera intouché.",
          "C’est le début de la rébellion de Cerberi."
        ]
      },
      {
        title: "La Rébellion",
        content: [
          "Suite au refus d’assistance envers les Stranis de l’Amiral Cramer, ce dernier proclame la sécession de Cerberi envers le commandement de l’Alliance.",
          "Il continueras de protéger les mondes sous son commandement, mais ne rendra aucun compte à l’Alliance.",
          "Du point de vue de l’Alliance, les systèmes sous la protection de Cerberi représentais un rempart inviolable pour les Torks, les troupes furent donc envoyés sur le front Strani.",
          "Un an plus tard, en 2369 (c139), Cerberi fait sécession avec la Confédération. Le Consortium, l’Union, la Guilde et le Tribunal d’Alcor n’ont plus d’influences sur ces systèmes.",
          "Durant les années suivantes, Cerberi défendra avec efficacité ses frontières face aux Torks. Une seule planète fut envahie, mais aucune ne fut perdue.",
          "La guerre Tork prit officiellement fin en 2397 (c165)."
        ]
      },
      {
        title: "Nation",
        content: [
          "Deux ans après la fin de la guerre, en 2399 (c167), et alors âgé de 76 ans (71 cycles), l’Amiral Cramer déclare l’indépendance de Cerberi.",
          "La Confédération ne voulant pas d’une guerre civile prit acte de la déclaration et reconnut les frontières de Cerberi sur 17 systèmes.",
          "Cerberi devient une dictature sous le commandement du Général Cramer.",
          "Elle instaure son propre Code Civil nommé Code d’Honneur, et ses propres institutions.",
          "Le pouvoir est exercé par les militaires, il existe un système de grade où chaque officier peut demander la promotion d’un individu moins gradé à ses paires.",
          "Le Général est le dirigeant suprème, secondé et conseillé par un conseil de Colonels, chacun dirigeant une partie des troupes avec une chaîne de sous-commandement.",
          "Lorsque le Général vient à mourir, les Colonels votent parmi eux pour désigner le successeur (à noter que le Général peut laisser son propre vote parmi les successeurs possibles)."
        ]
      },
      {
        title: "Le Code d’Honneur",
        content: [
          "Ce texte est ce qui fait office de loi, depuis sa publication par le Général Cramer en 2401 (c169), il n’a jamais été modifié.",
          "Pour la plus grande part, il est très simple : ne pas voler, ne pas tuer, ne pas attaquer les autres sans raison (bien qu'il existe une longue liste d'exceptions).",
          "Un tribunal militaire se charge de juger les affaires dans chaque ville.",
          "En cas de litiges, il existe deux moyens de régler les problèmes, dans un premier temps on propose une compensation financière, si « l’accusé » ne peut on ne veut pas payer, le prix du sang peut être proposé, soit par une dette de travail forcé, soit par un duel (généralement au premier sang versé et non à mort).",
          "Les modalités se font entre le tribunal et les parties impliquées.",
          "De manière générale, si deux individus se battent, un officier peut intervenir et organiser un duel dans les règles pour conclure la dispute.",
          "Chaque citoyen est donc encouragé à savoir manier une arme et être prêt à défendre la nation contre les envahisseurs."
        ]
      },
      {
        title: "Développement",
        content: [
          "Aujourd’hui, en 2576 (c333), Cerberi compte 34 systèmes dont : 41 Colonies, 52 villes, 64 Avant-postes militaires, 12 Spatioports et 3 Chantiers spatiaux.",
          "La population est composée à 92 % d’humains, 7 % de Vadas et 1 % de Stranis.",
          "La grande majorité de cette population est composée d’individus étant en désaccord avec leur gouvernement respectif.",
          "Cerberi n’est pas à proprement parler pro-humain ou anti-non-humain, mais simplement pro-Cerberi, les Stranis ou Vadas ne sont pas isolés du moment qu’ils adhérent à la faction.",
          "De plus, il est fréquent que des personnes jugées comme des criminels par le Conseil se réfugient dans l’espace de Cerberi."
        ]
      }
    ]
  },
  {
    id: 'galactic-council',
    title: 'Conseil Galactique',
    subtitle: 'Coopération interstellaire',
    resume: 'Le Conseil Galactique est l\'organe de coopération entre les différentes espèces.',
    sections: [
      {
        title: "Histoire",
        content: [
          "En 2543 (c302), les Vadas atteignent les limites de leur système d’origine.",
          "Ce faisant, les Humains et les <a href=\"#\" data-article=\"stranis\" class=\"text-blue-400 hover:text-blue-300\">Stranis</a> entrent en contact avec eux.",
          "L’Union propose alors la création d’un conseil galactique, une assemblée composée de représentants de chaque race afin de réguler les expansions de chacune et de fournir une base neutre diplomatique.",
          "Les Stranis approuvèrent l’idée et proposèrent aux Vadas de l’intégrer.",
          "Le Conseil Galactique fut alors fondé sur Matro IV planète permettant aux trois races de pouvoirs s’y déplacer sans équipement extérieur, que ce soit en matière d’atmosphère ou de gravité."
        ]
      },
      {
        title: "Rôle",
        content: [
          "Le Conseil Galactique a 3 rôles à jouer, tout d’abord, un rôle de médiateur, tout conflit opposant la Confédération (ou l’une de ses <a href=\"#\" data-article=\"confederal-orgs\" class=\"text-blue-400 hover:text-blue-300\">organisations</a>), la République Strani ou un clan Vada pourra être arbitré par le Conseil.",
          "Deuxièmement, le Conseil peut proposer des projets communs aux trois races, on citera en exemple le projet Ω lancé en 2572 (c329) ayant pour objectif la création d’une station spatiale géante capable accueillir le Conseil et de former une forteresse face à une attaque ennemie (Torks ou Tr’Trari).",
          "Enfin, le Conseil est en charge de l’attribution des permis de colonisation, il régule les expansions de chaque race en fonction de ses besoins. L’ensemble de l’espace régulé est nommé « Espace Concilien »."
        ]
      },
      {
        title: "Composition",
        content: [
          "Le Conseil est formé d’une petite assemblée de 100 individus (ce nombre peut être changé en fonction des populations et possibles autres races).",
          "Ses membres sont nommés par les différentes races proportionnellement à leur population.",
          "La méthode de nomination est propre à chaque race.",
          "Sur ces 100 membres, chaque race choisit 2 de ses membres en tant que représentants, ce sont eux qui parleront au nom du Conseil.",
          "À ce jour (2576 – c333), l’assemblée est composée de 44 Stranis, 38 Humains, et 18 Vadas.",
          "Les Humains sont choisis parmi les représentants des différents conseils dirigeants des organisations. Ils restent au Conseil tant qu’ils sont soutenus par leurs mandats respectifs de leur organisation.",
          "Les Stranis sont choisis par le président, en suivant l’idée de leur constitution, 50 % des nommés appartiennent au parti du président, les autres sont des représentants des autres partis proportionnellement à l’assemblée Strani.",
          "Les Vadas n’ayant pas de gouvernement unifié, ils ont choisi le Clan Groluma pour les représenter. Ce dernier nomme certains de ses membres selon les choix du chef de clan."
        ]
      }
    ]
  },
  {
    id: 'strani-republic',
    title: 'République Strani',
    subtitle: 'État Strani unifié',
    resume: 'La République Strani est l\'organisation politique qui unit tous les Stranis.',
    //sections: []
  },
  {
    id: 'alliance-org',
    title: 'Organisation interne de l\'Alliance',
    subtitle: 'Structure militaire',
    resume: 'L\'organisation interne de l\'Alliance, la force militaire unifiée.',
    //sections: []
  },
];

export default function Politics({ onBack, selectedArticleId }: { onBack: () => void, selectedArticleId?: string | null }) {
  return (
    <ArticleLayout 
      title="Politique"
      articles={articles}
      onBack={onBack}
      selectedArticleId={selectedArticleId}
    />
  );
}