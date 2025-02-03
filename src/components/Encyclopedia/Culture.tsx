import React from 'react';
import ArticleLayout from './shared/ArticleLayout';

export const articles = [
  {
    id: 'starlancer-training',
    title: 'Formation des Starlancer',
    subtitle: 'Entraînement d\'élite',
    resume: 'Le programme de formation des pilotes d\'élite Starlancer est l\'un des plus rigoureux de la galaxie.',
    sections: [
      {
        title: 'Études supérieures',
        content: [
          "La formation de Starlancer est à considérer comme une voie universitaire, elle permet d’obtenir en 3 cycles une licence de Starlancer qui permet à son détenteur d’utiliser tout modèle de vaisseaux équipé d’un GTV et les armes de guerre.",
          "Celle-ci se déroule dans l’un des nombreux centres de formation du Consortium composant un secteur d’une station spatiale. Le plus ancien étant celui de la station Loria Orbital de Hope I."
        ]
      },
      {
        title: 'Contenu',
        content: [
          "Chaque cycle est séparé en 2 Sections de 7 mois chacune.",
          "Le contenu de chaque section est le suivant :",
          "<b>Programme S1</b> : Mécanique des Chasseurs et Chasseurs Lourds, Diplomatie, Maniement des armes de poings et des Fusils d’assaut, Mécanique des véhicules légers et intermédiaires.",
          "<b>Programme S2</b> : Biologie, Cryptographie, Techniques de combat rapprochez, Stratégie des escouades, Maniement des armes lourdes et montées.",
          "<b>Programme S3</b> : Pilotage des Chasseurs et Chasseurs Lourds, Utilisation des Tourelles, Pilotage des véhicules légers et intermédiaires, Maniement des Shotgun et Canons.",
          "<b>Programme S4</b> : Maniement des Fusils de précisions, Mécanique des Corvettes et Frégates, Mécanique des Véhicules Lourds et blindés",
          "<b>Programme S5</b> : Pilotage des Corvettes et frégates, Pilotages des véhicules lourds et blindés, Utilisation des armes sur le terrain",
          "<b>Programme S6</b> : Préparation à l'épreuve finale de mise en situation réelle.",
          "Cas spécifique de l’activité physique : le « sport » ne consiste pas en une matière à part entière, mais est présente depuis le S1. Lors du premier cycle, chaque étudiant est supervisé par un coach dont la mission est de le préparer aux séances sur le terrain d’entraînement du cycle 2.",
          "À partir du cycle 3, il s’agit plus simplement d’habituer le futur Starlancer à entretenir son corps pour ses missions.",
          "Les étudiants n’utilisent pas de simulateur avant le cycle 2 et de vrais vaisseaux ou armes avant le S6."
        ]
      },
      {
        title: 'Évaluation',
        content: [
          "Pour rejoindre la formation, il est nécessaire de passer un examen d’entrée.",
          "Ce dernier consiste en une épreuve écrite qui reprend une grosse partie des enseignements du lycée (physique, mécanique, biologie, etc.) et un entretien personnel afin d’évaluer la psychologie de l’étudiant, les profils « violents » sont systématiquement rejetés.",
          "Chaque matière fera l’objet d’une évaluation (avec note plancher). La formation se termine lors d’une épreuve finale, une simulation grandeur nature.",
          "La difficulté de certaines épreuve fait que la majorité des étudiants ne valident la formation qu’au bout de 4 cycles.",
          "Les évaluations écrites suivent des sujets validés au niveau confédéral, les autres suivent un protocole de simulation extrêmement précis.",
          "Toutes les évaluations sont supervisées et validées par des inspecteurs du Consortium.",
          "Tout au long de la formation, les étudiants sont également évalués sur leur stabilité psychologique.",
          "En particulier durant les simulations, si un étudiant est déclaré comme trop sensible (stress, angoisse, panique, etc.) son cursus peut être mis en attente le temps de trouver une solution."
        ]
      },
      {
        title: "L'épreuve finale",
        content: [
          "L’étudiant est finalement noté sur son épreuve finale avec un score sur 100 points.",
          "Avec un système de bonus/malus pour la cohésion d’escouade, il est possible de dépasser les 100 points, si l’étudiant a au moins 72/100, il est reçu. Le meilleur score jamais enregistré était de 108 points.",
          "Dans le détails, cette épreuve contraint les étudiants à former une escouade de 4 à 10 personnes. Les escouades sont validées durant le S5 et préparées durant le S6.",
          "Lors de l’épreuve, l’escouade embarque dans des chasseurs (chargés à blanc) et participera à une mission simulée du Rang 1. Il peut s’agir d’escorter un vaisseau de marchandises, faire une reconnaissance dans un secteur, affronter des pirates en effectifs réduits…",
          "Une fois cette première étape finie, une autre similaire est mise en place lors d’une simulation au sol (en général sur la colonie locale). Sécuriser un site, chasser des aliens, détruire un avant-poste bandits, etc.",
          "Toutes ces simulations se font presque exclusivement avec des tirs « à blanc » et font intervenir différentes situations et événements imprévus pour évaluer les réactions de l’escouade. \"Presque\" en effet car pour garder les étudiants sur leur garde et maintenir une réelle pressions, certains tirs seront à balle réelle. Généralement tirés à des moments clés pour infliger des blessures superficielles et observer la réaction de l'escouade.",
          "Tout est filmé est évalué par plusieurs formateurs externes au centre de formation. Les notes individuelles peuvent prendre plusieurs jours à être révélées."          
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
          "Les <a href=\"#\" data-article=\"stranis\" class=\"text-blue-400 hover:text-blue-300\">Stranis</a> n’avaient pas d’unité comparable à la minute, ou du moins, une seule unité précise, aussi ont-ils accepté d’utiliser ces unités humaines.",
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
    sections: [
      {
        title: 'Apparition',
        content: [
          "L'humanité a connu beaucoup de grandes épidémies à travers les âges : peste noire, grippe espagnole, choléra...",
          "Néanmoins, aucune ne fut aussi meurtrière que la flutterite.",
          "Maladie issue de la fusion entre une bactérie Bartonella Henselae et Yersinia Pestis, celle-ci se développa en premier lieu chez le chat. Cette union ne put pas encore être identifiée, étant donné la capacité du Bartonella à ne pas présenter de symptômes chez le chat.",
          "Les premiers cas déclarés furent dans les zones fortement peuplées de la Terre, pendant l'année terrestre 2074.",
          "Cette maladie nouvelle se déclara chez des patients ayant été griffés par un chat.",
          "Les symptômes présentés ne furent, en premier lieu que des douleurs musculaires et des maux de tête, marques de la maladie des griffes de chat, bien connue de l'humanité. Ceux-ci furent alors traités en conséquence.",
          "Pendant plusieurs mois, de plus en plus de cas se déclarèrent à travers le monde, tandis que les traitements semblaient étrangement inefficaces.",
          "Les symptômes de la maladie évoluaient, commençant à affecter les organes lymphatiques, le foie ainsi que le système respiratoire, provoquant des toux plus ou moins violentes chez les patients.",
          "Plus étrange encore, certains patients contractaient les mêmes symptômes sans avoir été en contact avec un chat."
        ]
      },
      {
        title: 'Développement',
        content: [
          "Pendant l'année 2075, des recherches furent menées sur ce pathogène plus violent que ce qu'il était cru, et sa nature fut révélée. L'union entre deux bactéries, ayant acquis une grande résistance face aux médicaments.",
          "Ce nouveau pathogène semblait vicieux, se présentant comme une bête maladie des griffes de chat, avant de s'aggraver et d'affecter le système respiratoire, dévoilant de cette manière son second moyen de propagation : l'air lui-même.",
          "Ayant eu une année pour se propager et se camouflant dans la pollution terrienne, ce fut lors de cette année que la grande pandémie fut déclarée, les cas se multipliant à travers la planète.",
          "Malgré sa lenteur, cette nouvelle maladie semblait bien partie pour éliminer l'humanité. Celle-ci ayant tout le loisir d'infecter les humains, au système immunitaire affaibli par la pollution."
        ]
      },
      {
        title: 'Effets',
        content: [
          "La flutterite passe par plusieurs phases, commençant par de simples maux de tête et des douleurs musculaires, puis affecte les organes lymphatiques, affaiblissant encore plus le système immunitaire et passant ainsi dans sa seconde phase.",
          "Les maux de tête évoluent en fièvre, et le patient commence à être pris de toux de plus en plus violentes, jusqu à finir par cracher sang et pus. Cette toux se révéla être le moteur de propagation de la maladie par la voie des airs.",
          "La troisième phase se caractérise par une difficulté à respirer du malade, de plus en plus importante ainsi que par une ictère ( ou \"jaunisse\" ), causée par un arrêt progressif du foie. À ce stade, le malade finit par mourir, incapable de respirer et son foie n'est plus en mesure de remplir sa fonction."
        ]
      },
      {
        title: 'Conséquences',
        content: [
          "Malgré toutes ses tentatives, l'humanité ne fut pas en mesure de trouver un remède à la flutterite. Celle-ci ne put survivre que grâce au départ dans l'espace d'individus sains.",
          "La population terrienne fut complètement éliminée par la pandémie en 2151, bien que la maladie ne fut pas la seule cause de sa disparition.",
          "La pollution, la famine globale causée par la disparition des espèces animales et végétales ainsi que le chaos engendré par la fin imminente de l'humanité furent également des facteurs dans la disparition de la population terrienne."
        ]
      },
      {
        title: 'ID pathologique',
        content: [
          "Nom : Flutterite",
          "Agent infectieux : Une bactérie nouvelle, provenant de l'union de Bartonella Henselae et de Yersinia Pestis.",
          "Symptômes : Douleurs musculaires, maux de tête/fièvre, problèmes de foie, immunodéficience, toux ( pouvant mener à crachat de sang et de pus ), dyspnée.",
          "Moyen de propagation : Griffures de chat ou par voie aérienne."
        ]
      }
    ]
  },
  {
    id: 'languages',
    title: 'Langues',
    subtitle: 'Communication interstellaire',
    resume: 'Les différentes langues utilisées dans la galaxie.',
    sections: [
      {
        title: "Langue humaine",
        content: [
          "A l’origine, la Terre comportait de multiples nations et encore plus de langues, suite à l’exil de l’humanité sur Mars et la fondation d’<a href=\"#\" data-article=\"alcor\" class=\"text-blue-400 hover:text-blue-300\">Alcor</a> et New Gaïa, il a été décidé en 2085 (c-126) suite à l’unification des gouvernements d’instaurer une langue commune à tous.",
          "Parmi les candidats potentiels, l’Anglais était la langue que la majorité des habitants parlaient en seconde langue.",
          "A partir de cette Anglais, des linguistes ont créé l’Alcorien, qui est une version simplifiée (en grande partie sur l’orthographe et la phonétique) de l’Anglais.",
          "En 2090 (c-121), l’Alcorien est instauré comme langue unique à l’école sur Alcor et New Gaïa.",
          "Depuis, elle est restée la langue de l’humanité, et quand bien même elle a évolué au fil des siècles, elle reste l’une des pierres fondatrices de l’union des Hommes pour la conquête spatiale."
        ]
      },
      {
        title: "Langue Strani",
        content: [
          "La langue officielle des <a href=\"#\" data-article=\"stranis\" class=\"text-blue-400 hover:text-blue-300\">Stranis</a> pour les échanges diplomatiques est le Trane, il s’agit de la langue instaurée à la fondation de la <a href=\"#\" data-article=\"strani-republic\" class=\"text-blue-400 hover:text-blue-300\">république Strani</a> en 2124 (c-88). Il existe des dialectes propres à certaines planètes ou régions de la république, mais tout citoyen Strani se doit de parler le Trane.",
          "Cette langue est semblable à une suite d’onomatopées et de sifflements pour l’oreille humaine, il est donc quasi impossible pour un humain de parler le Trane.",
          "Lors du premier contact, la barrière de la langue a été franchie grâce à des interprètes robotiques et au travail des linguistes Humains sur des extraits d’écritures Stranis.",
          "De leur côté, les Stranis sont capables de comprendre l’Alcorien, même s’ils ont quelques difficultés avec les ‘s’ puisque le Trane possède tout un répertoire de sons sifflés. Ils ne peuvent en revanche pas le parler sans un énorme effort et seront limités à certaines sonorités."
        ]
      },
      {
        title: "Les Vadas",
        content: [
          "Les Vadas n’ayant pas de gouvernement unifié, il en est de même pour leur langue.",
          "Chaque clan Vada parle sa propre langue, mais elles ont toutes des points communs très marqué.",
          "Sur le plan diplomatique, les Vadas parlent la langue du clan Groluma qui les représente au Conseil Galactique.",
          "Les Vadas sont capables de comprendre l’Alcorien et le Trane mais ne peuvent parler que l’Alcorien.",
          "Les Humains peuvent eux parler le Vada alors que les Stranis en sont totalement incapables."
        ]
      },
      {
        title: "Micro-interprète",
        content: [
          "Avant 2225 (c5), tous les échanges entre Humains et Stranis nécessitaient des interprètes robotiques. Mais depuis la technologie des implants crâniens, et suite au travail de l’Union en matière de traduction instantanée, les implants sont équipés d’un micro-interprète qui va traduire toute les langues connues vers la langue de son hôte.",
          "La traduction est de l’ordre de la microseconde, rendant possible la communication entre tous ceux équipés d’implant.",
          "Cette avancé à permis d’intégrer avec une grande facilité les membres des autres races dans le Consortium.",
          "Et depuis 2240 (c19), l’interprète fait également office de traducteur, rendant la lecture de textes alien possible.",
          "Aujourd’hui, tous les membres du Consortium sont capables de communiquer entre eux que ce soit par écrit ou par oral.",
          "Les civils non équipés d’implant doivent eux utiliser un interprète robotique (chaque spatioport en possède au moins un)."
        ]
      }
    ]
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
  },
  {
    id: 'divisions',
    title: 'Divisions',
    subtitle: 'Groupe de Starlancers',
    resume: 'Regroupement de Starlancers à la place des escouades classiques.',
    sections: [
      {
        title: 'Origine',
        content: [
          "Selon les règles originelles du Consortium, il n’existe pas de limite maximale au nombre de membre d’une escouade.",
          "Des limites « naturelles » en matière de cohésion finissent invariablement par limiter ce nombre. En moyenne, on constate que la majorité des escouades sont formées de moins de 10 membres répartis sur 4 à 6 vaisseaux.",
          "Suite à la grande expansion humaine et à la rencontre avec les <a href=\"#\" data-article=\"stranis\" class=\"text-blue-400 hover:text-blue-300\">Stranis</a>, l’augmentation de l’activité des Starlancers a amené certaines escouades à s’agrandir et former des groupes de plus de 20 personnes, mais il était rare qu’elles participent toutes aux mêmes missions.",
          "C’est donc en 2230 (c9) que le Consortium créa les « Divisions » et limita les escouades à 10 membres."
        ]
      },
      {
        title: 'Fonctionnement',
        content: [
          "Au lieu de former ou rejoindre une escouade, les Starlancer peuvent rejoindre une Division. Contrairement aux escouades qui sont un groupe de Starlancer indépendants, les Divisions ont un système hiérarchique.",
          "Chaque Division est sous la supervision de 3 de ses membres désignés soit lors de la création, soit par leur prédécesseur.",
          "La Division fait office de « contact » de référence pour les offres de mission, elles présélectionne les missions selon les besoins/envies des Starlancer et indique le paiement en prenant en compte sa commission.",
          "En contrepartie de cette commission, la Division s’engage à fournir un point de chute (ou Quartier Général) à tous ses membres ainsi que divers services (prêts d’armes d’occasion, hangar à vaisseau, tarifs avantageux pour les simulateurs, etc.).",
          "Les Starlancer peuvent donc changer de coéquipiers à volonté parmi les membres de la Division.",
          "Enfin, tous les membres de la Division utilisent la même I.V. qui profite d’une puissance de calcul supérieur aux I.V. d’escouades habituelles.",
          "Seule une escouade remplissant certains critères peut demander la création d’une Division :",
          "- Avoir au moins 6 membres",
          "- Tous les membres sont de Rang 10",
          "- L’escouade possède un bâtiment aux normes pouvant accueillir au moins 10 vaisseaux et les entretenir avec leur Starlancer (réfectoire, infirmerie, dortoir, vestiaire, etc.)",
          "- Une somme d’argent conséquente (qui sera évalué suite à la demande) afin d’avoir un capital de base pour le fonctionnement courant de la base.",
          "Il est laissé une grande liberté sur le nom de la Division, la règle majeure étant qu’il ne peut pas y avoir des doublons (parmi les Divisions actives ou passées)"
        ]
      },
      {
        title: 'Quelques Divisions connues dans l\'histoire',
        content: [
          "Ici seront évoquées quelques Divisions ayant dépassé les 10 cycles d’existence, beaucoup se fondent, se réforment, changent de nom ou de QG ou disparaissent plus simplement.",
          "Les informations statistiques sont datées des informations du cycle en cours : 2576 – c333",
          "La première à voir le jour est la Warhammer Division en 2232 (c11) sur <a href=\"#\" data-article=\"alcor\" class=\"text-blue-400 hover:text-blue-300\">Alcor</a>. Plutôt que d’être transmise à des successeurs, et conformément à leurs dernières volontés, elle fut dissoute en 2274 (c50) suite à la mort de son dernier fondateur.",
          "La plus peuplée est la Vanguard Division. S’étant fait une spécialité d’accompagner les jeunes Starlancer par un système de mentorat, elle compte à ce jour 126 Starlancer actifs et des dossiers archivés de plus de 5000 Starlancer remontant à sa fondation en 2268 (c45). Elle enregistre aussi la vitesse de progression dans les Rang la plus rapide de l’histoire du Consortium.",
          "La plus durable est la Fire Tear Division fondée en 2257 (c34) et toujours en activité.",
          "La plus performante est la Iron Guardians Division avec un taux de succès de mission de 97,9 %. Fondée en 2433 (c199) sur Loria Orbital (système Hope), elle possède encore aujourd’hui l’un des QG les mieux équipés. Fière de ses résultats, elle est très sélective parmi les postulants.",
          "La plus décorée est la Dawn Star Division avec 38 « Green Star », la plus haute <a href=\"#\" data-article=\"rewards\" class=\"text-blue-400 hover:text-blue-300\">distinction</a> de la <a href=\"#\" data-article=\"confederation\" class=\"text-blue-400 hover:text-blue-300\">Confédération</a>. Fondée en 2348 (c120) sur Kloris Orbital (système Kalo), elle a été particulièrement active durant la guerre Tork.",
          "La plus riche est la Brave Circle Division fondée en 2357 (c128) sur New Quebec (système Delapiti) qui en 2431 (c197) possédait 12 colonies. C’est en 2436 (c202) que l’Union régulat les possessions coloniales et mettra fin à ce « record », le rendant indépassable avec la législation actuelle."
        ]
      }
    ]
  },
  {
    id: 'names',
    title: 'Noms',
    subtitle: "Les noms et leurs conventions",
    resume: "Conventions des noms à travers l'espace connu",
    sections: [
      {
        title: "Noms humains",
        content: [
          "Les noms des citoyens de la <a href=\"#\" data-article=\"confederation\" class=\"text-blue-400 hover:text-blue-300\">Confédération</a> sont similaires à ceux utilisés dans les pays occidentaux du 21eme siècle, à savoir un prénom (suivi parfois d’un second prénom) et d’un nom de famille.",
          "Néanmoins, l’émancipation des Starlancer étant très forte dans leur formation, la plupart préfèrent utiliser un nom d’usage qu’ils acquièrent lors de leurs études ou durant leur vie professionnelle.",
          ",Il est peu fréquent mais possible que ce nom change au cours de la vie d’un Starlancer.",
          "Ainsi, sur le plan juridique, seul le nom de famille et le prénom sont pris en compte, mais dans la vie quotidienne, le nom d’usage remplace le nom de famille.",
          "Quelques exemples de noms de Starlancer de la Confédération :",
          "Noms masculins | Noms Féminins",
          "Raymy ‘Gunner’ Barnes | Rene ‘Friction’ Kelly",
          "Gory ‘Slice’ Kera | Marthia ‘Shiny’ Richy",
          "Terey ‘Nova’ Pete | Joyce ‘ Aura’ Rodray",
          "Alten ‘Ant’ Lora | Lica ‘Coil’ Foste",
          "Emymo ‘Grim’ Garce | Mara ‘Virus’ Jenking",
          "Roby ‘Cross’ Coley | Jane ‘Chain’ Robell",
          "Wardy ‘Bells’ Belley | Mara ‘Bain’ Scampbenn",
          "Ruce ‘Lock’ Jackson | Diana ‘Dare’ Miry",
          "Stery ‘Catch’ Binson | Mildra ‘Frost’ Milly",
          "Lane ‘Hide’ Scotte | Eren ‘Barrage’ Mason"
        ]
      },
      {
        title: "Noms Stranis",
        content: [
          "Les <a href=\"#\" data-article=\"stranis\" class=\"text-blue-400 hover:text-blue-300\">Stranis</a> ont deux noms, le premier qui fait office de prénom ne peut pas s’écrire avec notre alphabet, il s’entend comme un sifflement avec une certaine mélodie, mais quasi impossible à reproduire par un corps humain.",
          "Par conséquent, les Stranis utilisent leur second nom, qui est un nom de portée (tous les individus d’une même portée portent ce même nom) qui lui se transcrit sous la forme de deux à trois syllabes.",
          "Exemples de noms (de portée) Stranis :",
          "Sr’Klos Mer Gs’Pac",
          "N’Bik Dj’Mra",
          "Ar Kl’ Lf’Spyk",
          "Cr’Ser Nk’ Ni Kptang"
        ]
      },
      {
        title: "Noms Vadas",
        content: [
          "Les <a href=\"#\" data-article=\"vadas\" class=\"text-blue-400 hover:text-blue-300\">Vadas</a> possèdent un nom composé contenant un préfixe pour leur sexe, suivie de leur prénom, puis le nom de leur clan, il est d’usage de prononcer tout le nom lorsque l’on s’adresse à un Vada.",
          "Oublier ou omettre l’un de ces éléments est perçu comme une injure. Du moins dans le contexte d’une discussion normale, en situation de combat par exemple, l’usage de diminutif n’est pas un souci du moment que l’individu est correctement identifié par ce diminutif.",
          "Mais avec un certain degré d’intimité avec un Vada, il peut tolérer une appellation plus courte.",
          "Dans le cas où un Vada n’a plus de clan, c’est le suffixe ‘Klotre’ qui est utilisé",
          "Exemples de noms Vadas :",
          "Noms masculins | Noms féminins",
          "Ker-Glarud-Kroma | Var-Jirkol-Dlit",
          "Ker-Bluros-Kroma | Var-Dreko-Vlak",
          "Ker-Artis-Dlit | Var-Lanik-Qriik",
          "Ker-Sidro-Groluma | Var-Artis-Groluma",
          "Ker-Ptakilm-Vlak | Var-Pirtan-Mlani"
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