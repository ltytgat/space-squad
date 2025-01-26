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
    sections: [
      {
        title: 'Direction',
        content: [
          "L’Alliance est divisée en différentes structures, chacune dirigé par un amiral :",
          "Division Opérationnelle, chargé de la gestion des Starlancer affiliés à la flotte ainsi que de l’attribution des missions courantes",
          "Division Stratégique, chargé du développement de l’Alliance ainsi que de l’attribution des missions critiques",
          "Division Logistique, chargé de l’approvisionnement des stations de l’Alliance et de la gestion des installations",
          "Division Technologique, chargé de la conception du matériel et de la recherche dans le domaine militaire",
          "L’Alliance est dirigé par l’amirauté, un conseil où l'on trouve les quatre amiraux dirigeant les quatre Divisions, ainsi que des vice-amiraux tirés au hasard parmi tous les vice-amiraux pour un durée de 4 <a href=\"#\" data-article=\"galactic-calendar\" class=\"text-blue-400 hover:text-blue-300\">cycles</a>, ainsi que le Premier Amiral de la flotte qui est par tradition l’amiral du Secteur Hélios.",
          "Le QG de l’Alliance est basé au sein de la station spatiale <a href=\"#\" data-article=\"alcor\" class=\"text-blue-400 hover:text-blue-300\">Alcor</a> où il occupe une grande partie de la station et accueil tous les organismes décisionnaires de l’Alliance ainsi que certains de ses plus performants chantiers spatiaux.",
          "L’Alliance divise l’espace de la <a href=\"#\" data-article=\"confederation\" class=\"text-blue-400 hover:text-blue-300\">Confédération</a> en secteurs regroupant 4 à 6 systèmes exploités. Chaque secteur est dirigé par un vice-amiral basé sur une station spatiale situé en orbite de la planète la plus développee du secteur. Ces stations font offices de quartier général régionale et regroupe tout le materiel nécessaire aux Starlancer de l’Alliance ou en cas de besoin aux autres. L’Alliance possède aussi de nombreux avant-postes situés dans les systèmes de chaque secteur ainsi que des garnisons sur les planètes en cours de colonisation ou de monde demandant une surveillance particulière (c’est le cas de certaines planètes rendu non-viable par la guerre contre les Torks).",
          "Quand bien même les forces armées <a href=\"#\" data-article=\"stranis\" class=\"text-blue-400 hover:text-blue-300\">Strani</a> ont rejoint l’Alliance, celle-ci ne couvre pas les systèmes Stranis ou Vadas, chaque race gère la sécurité des ses systèmes indépendamment des autres.",
          "Cette supervision des systèmes aliens ne serait utilisé qu’en temps de guerre."
        ]
      },
      {
        title: 'Divisions',
        content: [
          "La Division Opérationnel",
          "La Division opérationnel est chargée d’accuser réception des demandes d’aides des gouvernements planétaires ainsi que des ordres de missions des stations de l’Alliance. Il s’agit de la Division la plus administrative de l’Alliance et possède au minimum un bureau dans toutes les colonies, même les avant-postes.",
          "On retrouve au sein de cette Division un grand nombre de secrétaires et d’employés de bureau qui s’occupe du fonctionnement quotidien de l’Alliance ainsi que de jeunes officiers en début de carrière.",
          "La Division Stratégique",
          "La Division stratégique est chargée de planifier le développement de l’Alliance et, à ce titre, s’occupe de l’attribution des missions de premières importances. On retrouve au sein de cette Division aussi bien des stratèges, des théoriciens militaires, des diplomates ou des politiciens dont la mission est de s’assurer que l’Alliance puisse toujours répondre aux menaces pesant sur le Consortium.",
          "De par sa fonction, il s’agit de la Division la plus petite et la plus prestigieuse de l’Alliance et on ne la retrouve qu’au sein des stations principales de chaque secteur.",
          "La Division Logistique",
          "La Division logistique est la seconde Division la plus importante en termes d’effectifs de l’Alliance. Elle s’occupe de la gestion, de l’entretient du matériel et des infrastructures de l’Alliance. C’est également elle qui se charge de l’approvisionnement de toutes les garnisons de l’Alliance et, de ce fait, elle possède au moins un bureau dans toutes celles-ci. Enfin, elle est chargée du fonctionnement de nombreux chantiers spatiaux de l’Alliance qui fournissent à ses Starlancer les vaisseaux nécessaire pour accomplir leurs missions.",
          "La Division Technologique",
          "La Division technologique est une ancienne sous division de la Division logistique, elle a gagné son indépendance afin de se détacher de la lourdeur administrative de celle-ci et pour pouvoir collaborer plus facilement avec ses homologues de la Guilde et de l’Union. Elle est chargée du développement technologique et scientifique de l’Alliance, allant de la recherche en physique théorique à la psychologie humaine et extraterrestre en situation d’isolement (domaine qui s’est révélé capital pour les longs voyages spatiaux).",
          "Elle dispose de locaux dans les stations principales des secteurs de l’Alliance mais fonctionne principalement grâce à ses propres station-laboratoires.",
          "La sous-division de garnison",
          "La sous-section de garnison est une subdivision de la Division opérationnel chargé de la gestion des garnisons planétaire de l’Alliance, bien que très importante en terme d’effectif, elle ne constitue pas une Division propre du fait de son extrême dispersion et des liens étroits entre les garnisons et les gouvernements locaux.",
          "Chaque garnison est gérée par un commandant, sa première tâche sera la formation des forces de sécurité locale."
        ]
      },
      {
        title: 'Catégorisation des missions',
        content: [
          "L’Alliance utilise un système de catégories pour classer les différentes missions qu’elle propose au Starlancer, cette catégorisation est menée par la division opérationnel mais la division stratégique peut se saisir de n’importe qu’elle mission.",
          "Catégorie 1",
          "Les missions de catégorie 1 sont les plus faciles que propose l’Alliance, il s’agit de mission très variables dans leur objectif (escorte de transport de marchandise ou de voyageur, élimination de faune hostile peu dangereuse, etc…) mais ne présentant pas de dangerosité particulière et ne demandant pas de compétence importante.",
          "Ce genre de mission est très peu rémunéré mais sert souvent de départ pour les débutants et de bonus dans le cas d’un voyage.",
          "Catégorie 2",
          "Les missions de catégorie 2 sont les plus courantes, les objectifs de ce type de mission sont également très variable mais implique souvent de faire face à une menace particulière ou nécessite des compétences spécifiques (chasse au pirate, convoyage de matériel ou de personnel important, chasse à la faune dangereuse, destruction d’astéroïdes, etc.).",
          "Ces missions sont d’avantage rémunéré mais attirent surtout des Starlancer moyennement expérimenté.",
          "Catégorie 3",
          "Les missions de catégorie 3 représentent les missions courantes présentant un niveau de dangers plus élevé ou une plus grande importance pour l’Alliance, elles sont aussi variable que celles de catégorie 2 mais nécessite des Starlancer plus expérimenté.",
          "Ces missions sont bien rémunérées et attirent tout type de Starlancer expérimentés.",
          "Catégorie 4",
          "La catégorie 4 regroupe les missions difficiles de l’Alliance demandant la mobilisation de Starlancer chevronnés, on retrouve dans cette catégorie essentiellement des missions d’élimination de menace importante (bande de pirates, chef pirates, criminel de haut niveau, destruction d’installations, ect.).",
          "Catégorie 5/Mission stratégique",
          "La catégorie 5 est attribué aux missions fournis par la branche stratégique de l’Alliance, celles-ci sont souvent très difficiles et ont toujours des objectifs très spécifiques, voir exotique. Elles ne sont pas proposé sur les tableaux de missions mais c’est la division stratégique qui se charge de contacter des escouades à même de les accomplir, elles restent toutefois non-obligatoire mais la récompense est toujours à la hauteur de la difficulté.",
          "Mission urgentes",
          "Les missions urgentes sont aussi fournis par la division stratégique mais sont cette fois-ci sont obligatoire pour les Starlancer de l’Alliance, il s’agit de mobiliser un grand nombre de Starlancer pour faire face à une urgence.",
          "Elles ne sont toutefois pas aussi difficiles que les missions de catégorie 5.",
          "Ces missions sont en règle général bien rémunéré mais surtout, toute absence non justifiée peut faire l’objet de sanctions.",
          "Remarque : La division stratégique sélectionne le type de Starlancer mobilisé ainsi des débutant ne risque pas d’être envoyé dans une mission suicidaire pour eux.",
          "La re-catégorisation",
          "Il arrive parfois que la branche opérationnel face une erreur dans la catégorisation d’une mission, dans ce cas, les Starlancer peuvent faire une demande (avec justification) pour que la récompense soit réévaluée après la mission.",
          "Cette réévaluation ne peut se faire qu’à l’avantage des Starlancer (mission de catégorie 2 réévaluée en catégorie 3 avec augmentation de prime mais pas catégorie 2 vers catégorie 1 avec baisse de prime).",
          "Des demandes de re-catégorisation trop fréquentes et injustifiées peuvent faire l’objet de sanction."
        ]
      },
      {
        title: 'Les Stranis dans l\'Alliance',
        content: [
          "Après plus de deux siècles de présence des Stranis dans l’Alliance, ceux-ci se sont parfaitement intégrés à cette organisation et la hiérarchie ne tient pratiquement plus compte des différences entre humain et Stranis.",
          "De ce fait, on retrouve des membres de cette espèce en très grand nombre dans l’Alliance (bien qu’ils restent moins nombreux que les humains) et à tous les postes qu’elle peut proposer, y compris dans les plus hautes instances décisionnaires.",
          "Malgré tout, les différences naturelles entre humains et Stranis font qu’il existe une tendance à encourager les membres d’un ou l’autre peuple dans certaines voies.",
          "Étant donné qu’il n’existe pas de réelle différence entre les capacités cognitives des deux espèces, toutes les divisions sont ouvertes à part égale à leurs membres. Il existe toutefois une spécialisation forte des Stranis appartenant à la division logistique pour le travail de précision, le travail en environnement légèrement toxique et pour la maintenance où les caractéristiques naturelles des membres de cette espèce sont très supérieures à celles d'humains.",
          "De plus, les Stranis ont tendance à préférer le travail en apesanteur où leur faiblesse physique est moins handicapante."
        ]
      },
      {
        title: 'Installations notables',
        content: [
          "Le Quartier Général d’Alcor",
          "Le Quartier Général d’Alcor, souvent appelé QGA, est le plus haut lieu de commandement de l’Alliance, situé au sein de la station Alcor.",
          "On retrouve au sein de ce quartier, la direction général de toutes les branches et divisions de l’Alliance, c’est également dans ce lieu que siège l’Amirauté, le conseil chargé de la direction de l’Alliance.",
          "En plus d’être un gigantesque centre administratif, la station regroupe tous les services nécessaires aux Starlancer de l’Alliance, tel que des casernes, terrains d’entraînements, armureries, hangars, hôpitaux militaires, etc. Enfin, la station regroupe sous son commandement direct les chantiers spatiaux de l’Alliance dans le système Hélios.",
          "Du fait de son importance, seuls les Starlancer affiliés à l’Alliance et les Starlancer spécifiquement invités ont le droit de se rendre dans les zones protégées du QG.",
          "Le multi-complexe Laste",
          "Le multi-complexe Laste est le regroupement administratif de tous les complexes de recherche de l’Alliance au sein du système Hélios.",
          "Il consiste en de nombreuses stations et installations dans tout le système tel que (liste non exhaustive):",
          "- Laste, se trouvant sur Deimos, qui archive les recherches du complexe.",
          "- Arès, sur Phobos, il s’agit de la principale station du complexe et regroupe les recherches en matière d’armement ainsi que de nombreux projets exotiques.",
          "- Vénus, en orbite de cette planète, qui étudie le comportement des vaisseaux et des équipements en condition climatique extrême.",
          "- Amalthée, sur la lune éponyme de Jupiter, qui teste le matériel de l’Alliance dans la grande variété de condition que sont les lunes de Jupiter.",
          "- Cérès, situé dans la ceinture d’astéroïde intérieur du système Hélios, elle étudie les systèmes de navigation et de combat en utilisant la ceinture d’astéroïde comme terrain d’essai.",
          "La base Vigilance",
          "Il s’agit de l’une des plus grande base de l’Alliance car son rôle est de surveiller Cerberi et d’assurer l’influence de la Confédération au niveau de la frontière. Le commandement de cette base est l’un des postes les plus critique de l’Alliance du fait de son côté très sensible."
        ]
      }
    ]
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