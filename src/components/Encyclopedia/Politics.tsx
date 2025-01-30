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
    sections: [
      {
        title: 'Définition',
        content: [
          "Une Organisation est une entité appartenant à la <a href=\"#\" data-article=\"confederation\" class=\"text-blue-400 hover:text-blue-300\">Confédération</a> et régissant un ou plusieurs domaines gouvernementaux au service des citoyens.",
          "Les Organisations sont auto-financées et autonomes dans leur fonctionnement. Elles n’ont pas de supérieurs en dehors de la loi de la Confédération (CCA), et de la constitution. Elles restent néanmoins dépendantes les unes des autres et leurs actions sont sous la surveillance de l'assemblée."
        ]
      },
      {
        title: 'Histoire',
        content: [
          "La première Organisation fut le Consortium créé en 2097 (c-114) alors même que la Confédération n’existait pas encore.",
          "À cette époque, le Consortium était une institution de formation des pilotes.",
          "Suite à la création de l’UCH puis de la Confédération, le Consortium devient une Organisation chargée de l’éducation et de la formation des citoyens.",
          "En 2215 (c-4), suite à la rencontre avec les Stranis, trois Organisations furent créées, l’Alliance, la Guilde Marchande et l’Union Planétaire, respectivement chargés de la sécurité, du commerce et de l’exploration.",
          "Enfin, en 2250 (c28), le Tribunal d’Alcor est créé pour s’occuper de la justice."
        ]
      },
      {
        title: 'Consortium',
        content: [
          "Le Consortium est la plus ancienne des Organisations, elle s’occupe de l’éducation jusqu’à la majorité, puis de l’accompagnement durant le service obligatoire de 2 <a href=\"#\" data-article=\"galactic-calendar\" class=\"text-blue-400 hover:text-blue-300\">cycles</a>, et enfin de la <a href=\"#\" data-article=\"starlancer-training\" class=\"text-blue-400 hover:text-blue-300\">formation</a> (de 3 cycles) des Starlancers.",
          "Tout individu souhaitant piloter un vaisseau (en dehors des petits véhicules non prévus pour les voyages interstellaires) doit être enregistré au Consortium et avoir suivi la formation ou être capable de passer tous les examens pour les postulants externes.",
          "Un Starlancer du Consortium reçoit la possibilité de travailler à son compte pour les Organisations, avec l’assistance et le soutien du Consortium.",
          "La formation fournit un entraînement au pilotage (des chasseurs aux frégates) et à leur entretien, à l’usage des armes montées, au combat terrestre (maniement des armes thermiques et cinétiques, déplacement en terrain hostile, usage des armes de combat rapproché), aux négociations et à la diplomatie, et aux techniques de premiers soins.",
          "Tout ceci permet aux Starlancers de pourvoir à la plupart des situations auxquelles ils pourront être exposés au cours de leur carrière.",
          "La devise du Consortium est : « <b>Révélez votre potentiel</b> »"
        ]
      },
      {
        title: 'Alliance',
        content: [
          "Fondée en 2215 (c-4) avec la Guilde et l’Union, l’Alliance représente la force armée de la Confédération.",
          "À l’origine uniquement humaine, le premier Strani à y entrer le fit en 2240 (c19).",
          "En pleine guerre contre les Torks, les forces armées extérieures Stranis fusionnent avec l’Alliance en 2356 (c127). Depuis l’Alliance est une organisation inter-espèce mais reste sous la juridiction de la Confédération.",
          "Le fonctionnement interne de l’Alliance reste donc en théorie régie par la loi et la constitution confédérale, mais cette dernière étant très générale, l’Alliance reste très indépendante de son évolution.",
          "En temps de guerre, c’est elle qui envoie les Starlancers au combat et choisi les stratégies à appliquer : quels systèmes défendre, quelles planètes attaquer, où seront effectués les ravitaillements, etc.",
          "Dans ces circonstances, l’Alliance peut réquisitionner tout vaisseau de la Confédération pour l’effort de guerre, peu importe son affiliation.",
          "Pour plus de détails: -> <a href=\"#\" data-article=\"alliance-org\" class=\"text-blue-400 hover:text-blue-300\">Organisation interne de l'Alliance</a>",
          "Tous les Starlancers affiliés à l’Alliance ont obligation de répondre aux missions de guerre sous peine d’être classifié comme déserteur et de voir leur licence révoquée et leur vaisseau saisi.",
          "En temps de paix, l’Alliance s’occupe du maintien de la paix extra-stellaire.",
          "Chaque système possède sa propre force de police indépendante.",
          "Néanmoins, ces forces doivent suivre les directives de l’Alliance le cas échéant.",
          "Ainsi, les missions les plus fréquentes de l’Alliance sont :",
          "- la surveillance des frontières (Cerberi et Torks)",
          "- la poursuite et la capture ou élimination de criminels en fuite",
          "- la protection rapprochée de convois",
          "- faire de la reconnaissance dans des secteurs hostiles",
          "La devise de l’Alliance est : « <b>Gardiens de la civilisation</b> »."
        ]
      },
      {
        title: 'Guilde Marchande',
        content: [
          "Fondée en 2215 (c-4) avec l’Alliance et l’Union, la Guilde représente la gestion économique de la Confédération.",
          "Il fut décidé de fusionner toutes les instances économiques et financières de la Confédération en une seule entité qui deviendra la Guilde Marchande (simplement appelé Guilde).",
          "Cette organisation est en charge de l’équilibre économique des colonies de la Confédération, et de tout ce qui a trait à la création, extraction et transport de marchandises.",
          "Dès la création, il fut instaurer une règle d’or inscrite dans la loi de la Confédération, elle ne peut donc être changée que par référendum :",
          "Une part de 50 % minimums des bénéfices nets de la Guilde Marchande devra être redistribuée aux autres organisations. La répartition de cette somme sera décidé par les autorités dirigeantes de la Guilde Marchande en accord avec les dirigeants des autres organisations.",
          "La Guilde supervise toutes les infrastructures en dehors des colonies servant à l’extraction ou la fabrication/transformation de ressources.",
          "Elle s’occupe en plus du transport de ses marchandises, et de toute ressource quittant une colonie.",
          "Enfin, la Guilde dispose d’une branche chargé de surveiller les demandes des colonies et des autres factions en fonction des traités commerciaux.",
          "Le but étant d’adapter l’offre à la demande et d’éviter toute forme de spéculation sur les ressources dont la production est contrôlée.",
          "Les traités commerciaux de la Guilde sont également de puissantes armes diplomatiques pour la Confédération. Ces derniers ayant permis une relation amicale avec les Stranis dès le premier échange.",
          "La devise de la Guilde est : « <b>Tissons les liens de l’avenir</b> »"
        ]
      },
      {
        title: "Union",
        content: [
          "Fondée en 2215 (c-4) avec l’Alliance et la Guilde, l’Union est en charge de la recherche, de l’exploration, et de la supervision des colonies.",
          "À l’origine l’Union des Centres de Recherches Spatiales (UCRS) était le regroupement de tous les organismes de recherche de la Confédération.",
          "Mais suite à la première colonisation en dehors du système Hélios sur Hope I en 2248 (c26), le tout nouvel Institut Colonial fut intégré à l’UCRS pour former l’Union Planétaire.",
          "Chaque colonie possède son propre <a href=\"#\" data-article=\"colony-politics\" class=\"text-blue-400 hover:text-blue-300\">système politique</a>, aussi l’Union n’est là que pour accompagner les gouvernements coloniaux dans leur gestion et leur organisation locale, ainsi que pour les relations avec l’extérieur.",
          "Concrètement, si une colonie a besoin d’un apport de ressources, le gouvernement local en fait part à la branche locale de l’Union, et c’est ce dernier qui va s’occuper de contacter les bonnes personnes (via la Guilde) pour effectuer la livraison au nom du gouvernement.",
          "Distinction avec la Guilde, l'Union est responsable du transport des personnes (et leurs biens), là où la Guilde ne s'occupe que des marchandises",
          "En plus de cela, l’Union possède et gère tout un réseau de stations de recherche. Et quand bien même l’Alliance mène ses propres recherches dans le domaine militaire exclusivement, ses chercheurs restent en contact avec ceux de l’Union dont les champs de recherches sont beaucoup plus vastes.",
          "Enfin l’Union est en charge de la cartographie de la galaxie, elle gère donc les frontières de l’espace confédéré et choisi les systèmes à explorer et répertorier. Le droit de colonisation étant donnée par le <a href=\"#\" data-article=\"galactic-council\" class=\"text-blue-400 hover:text-blue-300\">Conseil galactique</a>.",
          "La devise de l’Union est : « Explorer, chercher, apprendre »."
        ]
      },
      {
        title: 'Tribunal d\'Alcor',
        content: [
          "Fondé en 2250 (c28), le Tribunal d’Alcor diffère des autres Organisations.",
          "Chaque colonie de la Confédération possède un Tribunal qui est là pour juger les affaires d’infractions au CCA.",
          "Chaque colonie finance la tenue du Tribunal et ce dernier ne requiert le service des Starlancer que de manière exceptionnelle et très particulière.",
          "Article détaillé: -> <a href=\"#\" data-article=\"alcor-tribunal\" class=\"text-blue-400 hover:text-blue-300\">Tribunal d'Alcor</a>",
        ]
      }
    ]
  },
  {
    id: 'alcor-tribunal',
    title: 'Tribunal d\'Alcor',
    subtitle: 'Justice confédérale',
    resume: 'Le Tribunal d\'Alcor est la plus haute instance judiciaire de la Confédération.',
    sections: [
      {
        title: 'Histoire',
        content: [
          "En 2113 (c-100) entre en vigueur le Code Civil d’Alcor (CCA), il prend effet dans la station <a href=\"#\" data-article=\"alcor\" class=\"text-blue-400 hover:text-blue-300\">Alcor</a> et sur New Gaïa, il s’étendra par la suite aux autres spatioports et colonies humaines.",
          "En 2217 (c-1) ont lieu les premiers échanges diplomatiques avec les <a href=\"#\" data-article=\"stranis\" class=\"text-blue-400 hover:text-blue-300\">Stranis</a>, en 2219 (c-0) les Stranis s’engagent à respecter le CCA dans l’espace humain, mais demandent de juger toute infraction commise par l’un des leur avec leur propre justice.",
          "La loi Strani et le CCA ajoute ensemble une nouvelle infraction : « Non respect d’une loi alien. ».",
          "Suite à la première colonie hors du système Hélios en 2248 (c26), le Tribunal d’Alcor est fondé en 2250 (c28) sur la station Alcor.",
          "Cette institution est garante du CCA, aussi, chaque colonie et spatioport devra être équipé d’un tribunal.",
          "Chaque citoyen possède un casier judiciaire géré par le Tribunal.",
          "Les Vadas intègrent le conseil et le Consortium en 2543 (c302) et 2544 (c303), tout comme les Stranis en 2217 (c-1), ils acceptent de respecter le CCA dans l’espace humain, néanmoins,leur système judiciaire et leur concept même de justice étant assez éloignée du notre, le Tribunal recommande d’accompagner les Vadas dans les colonies et de faire preuve de compréhension à leur égard."
        ]
      },
      {
        title: "Procédures",
        content: [
          "Peu importe l’infraction, c’est aux forces de police locale d’interpeller le contrevenant.",
          "Tous les procès sont présidés par un juge indépendant nommé sur place pour une durée fixe.",
          "Tout citoyen jugé ou juré se verra noté dans son casier judiciaire les informations relatives au procès : accusé, infraction(s), faits, sentences, peine, juge, jurés.",
          "Le Tribunal détermine trois types d’infractions :",
          "<b>Infraction au CCA</b>",
          "En cas d’infraction au CCA, la procédure est très automatisé, le prévenu est emmené au Tribunal disponible le plus proche.",
          "Le nombre de jurés dépend de la gravité de l'infraction, ces derniers sont tirés au hasard parmi tous les citoyens de la Confédération.",
          "Ils assistent au procès par visioconférence s'ils ne sont pas à proximité du Tribunal.",
          "La police expose les faits et les preuves.",
          "L’accusé à le droit de remettre en cause les preuves, si tel est le cas, une commission nommée par le juge devra vérifier si les preuves en question sont recevables.",
          "Si une preuve est considérée comme irréfutable, le prévenu risque de voir sa peine alourdie pour avoir fait perdre du temps à la cour.",
          "Si au contraire elle est jugé irrecevable, elle est retirée.",
          "Une fois toutes les preuves acceptées, les jurés sont appelés au procès.",
          "Leur sont alors présentés les faits, suite à quoi le juge expose le ou les articles du CCA relatif à la situation et la ou les peines associées si il y a jurisprudence.",
          "Les jurés ont ensuite un temps de réflexion puis doivent voter : coupable, innocent ou indécis.",
          "Innocent implique la relaxe de l’individu, indécis donne à la police du temps (fixé par le juge) pour assembler d’autres preuves avant un autre procès.",
          "Si l’individu est reconnu coupable, le juge propose une peine (généralement par jurisprudence) aux jurés.",
          "Suite à un vote, si la majorité refuse la peine proposée, c’est à eux de définir par concertation une peine plus adéquate. S’ils n’y parviennent pas, la sentence initiale est gardée.",
          "Pour ce type d'infraction, l'accusé ou la partie civile peut faire appel. Un nouveau procès aura alors lieu avec un nouveau juge (et donc sur une autre colonie/station).",
          "<b>Infraction à la loi locale</b>",
          "La procédure est très similaire à la précédente, à trois différences, le prévenu est emmené dans le Tribunal local, et le juge dispose d’un adjoint volontaire ayant connaissance des lois locales.",
          "Enfin les jurés proviendront à 50 % de la colonie locale.",
          "Le reste de la procédure est identique à une infraction au CCA",
          "En cas d'appel, la règle des 50% des jurés de la colonie locale est maintenue.",
          "<b>Infraction d’une loi alien</b>",
          "Dans ce cas particulier, l’individu devra être ammené au Tribunal le plus proche disponible en collaboration avec les forces de l’ordre alien locales.",
          "Le juge quo-présidera la séance avec un émissaire alien.",
          "Il y aura également un second jury composé uniquement de membres de la faction alien en question.",
          "Le reste de la procédure est similaire, mais il revient aux juges de trancher en cas de différences de sentences entre les deux jurys.",
          "La sentence est sans appel, cependant il reste possible de demander un avis diplomatique auprès de l'Assemblé confédérale."
        ]
      },
      {
        title: 'Cassation et avis diplomatique',
        content: [
          "Suite à un procès (en appel ou non), il est possible de demander la cassation de la sentence, dans ce cas, c'est la haute juridiction du Tribunal d’Alcor qui juge la procédure.",
          "S'ils estiment qu'il y a eu une ou des erreurs suffusantes pouvant affecter la décision du tribunal lors de l'audiance, ils peuvent \"casser\" le jugement. Un nouveau jugement aura donc lieu à la place de celui cassé.",
          "Dans le cadre de l'infraction de loi alien, si l'accusé est reconnu coupable, il peut demander un avis diplomatique. Dans ce cas, c'est l'Assemblée confédérale qui doit juger si la sentence est justifiée.",
          "Elle peut demander à la faction alien en question de pouvoir elle meme prendre en charge le prevenu. Cela se fait au cours de tractations diplomatiques."
        ]
      },
      {
        title: 'Peines',
        content: [
          "Le CCA autorise quatre sortes de peines :",
          "- Compensation financière",
          "- Travail de compensation",
          "- Emprisonnement/isolation pour une durée finie",
          "- Exil/bannissement pour une durée infinie",
          "Le travail de compensation peut être au profit des victimes (ou famille de victimes) ou bien à la colonie.",
          "Il est délimité par un temps de travail et/ou bien un montant total de bénéfice.",
          "L’isolation se fait selon les infrastructures de la colonie, si elle n’en a pas les moyens, elle peut demander à faire transférer le prisonnier dans une autre colonie (aux frais de ce dernier).",
          "Si l’exil est prononcé, la colonie s’engage à transporter l’individu jusqu’au spatioport le plus proche.",
          "Ces peines peuvent se cumuler selon la gravité des faits ou selon l’avis du jury."
        ]
      }
    ]
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
    sections: [
      {
        title: "Histoire",
        content: [
          "La république <a href=\"#\" data-article=\"stranis\" class=\"text-blue-400 hover:text-blue-300\">Strani</a> tel qu’elle existe aujourd’hui a été fondée en l’an terrestre 2124 (c-88)",
          "Elle verra la rébellion des <a href=\"#\" data-article=\"trtraris\" class=\"text-blue-400 hover:text-blue-300\">Tr’Traris</a> en 2170 (c-45) et la rencontre avec l’humanité en 2214 (c-4).",
          "Ce système a prouvé sa stabilité dans la société Strani, et quand bien même il a des détracteurs, la majorité de la population le soutien."
        ]
      },
      {
        title: "Fonctionnement",
        content: [
          "Il existe plusieurs partis politiques qui comme pour les humains ont des similitudes et des points de divergences.",
          "Chaque parti est dirigé par un conseil élu par les membres, et chaque conseil désigne un représentant.",
          "Lorsqu’une élection a lieu, chaque citoyen vote pour l’un des partis présents.",
          "A la suite de ce tour, le parti ayant reçu le moins de voix est éliminé et on passe au tour suivant, et ainsi de suite jusqu’à ce qu’il ne reste plus qu’un parti.",
          "Le représentant du Parti restant devient Président pour une durée indéterminée. Ce dernier a les pleins pouvoirs hormis sur deux choses : la loi, et la constitution, tout changement dans la loi ou la constitution doit être approuvé par l’assemblée.",
          "A la suite des résultats du premier tour, une assemblée est formée à la proportionnelle.",
          "L’assemblée est élue pour un mandat de 4 ans, celle-ci peut à tout moment demander un referendum pour valider la position du président (sur un projet spécifique, ou bien sur son règne de manière générale).",
          "Si le peuple s’oppose au président, ce dernier doit stopper son projet ou bien abdiquer, une nouvelle élection aura alors lieu.",
          "Les votes blancs et les votes non exprimés sont cumulés pour former une part de l’assemblée avec des citoyens tirés au hasard sur une liste de volontaires.",
          "Ces votes ne sont plus comptabilisés après le premier tour."
        ]
      },
      {
        title: "Les grands partis",
        content: [
          "Il existe trois grands partis politiques ayant chacun dirigé à plusieurs reprises depuis leur création.",
          "Chacun de ces partis est basé sur l’une des valeurs fondatrices de la République: Équité, Ordre et Liberté.",
          "<b>Équité</b> :",
          "Le parti de l'équité veut donner à chaque Strani le nécessaire pour pouvoir vivre une vie décente, certains ont besoin de plus, d’autres de moins, aussi, il n’est pas question ici d'égalité, mais bien d'équité. Son idéologie comporte des similitudes avec le \"Communisme\" humain.",
          "<b>Ordre</b> :",
          "Le parti de l'ordre cherche à encadrer les actions de chacun, il s’appuie sur les traditions et le respect de l’autre. Il a tendance à lancer de grands projets fédérateurs que ce soit au niveau national comme extra-raciale.",
          "<b>Liberté</b> :",
          "Le parti de la liberté cherche à émanciper les citoyens de toute forme de soutien.",
          "L’autonomie de l’individu est mise en avant afin qu’il puisse vivre selon ses propres choix.",
          "A eux trois, ils comptabilisent en moyenne 64% des voix, le reste allant à un vote blanc (10%) ou des partis plus petits principalement présents à l’Assemblé.",
          "En cette année 2576 (c332), c’est le parti de l'Ordre qui gouverne depuis 6,5 <a href=\"#\" data-article=\"galactic-calendar\" class=\"text-blue-400 hover:text-blue-300\">cycles</a>."
        ]
      },
      {
        title: "Ministères",
        content: [
          "Lorsqu’un parti arrive au pouvoir, il doit nommer des ministres, les ministères et leurs fonctions sont figés par la Constitution.",
          "Le Parti au pouvoir peut nommer jusqu’à 5 de ses membres comme ministres, les autres postes doivent être proposés à au moins deux autres partis (présents à l’assemblé avec au moins 5%).",
          "Liste des ministères (ordre alphabétique):",
          "Agriculture",
          "Armées",
          "Culture",
          "Économie",
          "Éducation",
          "Justice",
          "Santé",
          "Travail",
          "Diplomatie",
          "Recherche",
          "Le budget des ministères est proposé par le président et accepté ou débattu puis accepté par l’Assemblé.",
          "Lors de la présentation des ministres, l'ordre d'annonce des ministères indique les priorités du gouverment."
        ]
      },
      {
        title: "Forces armées et l'Alliance",
        content: [
          "Le ministère des Armées est le seul ministère qui est directement lié à une entité extèrieure (la <a href=\"#\" data-article=\"confederation\" class=\"text-blue-400 hover:text-blue-300\">Confédération humaine</a> ).",
          "De fait, ce ministère est en charge de la \"police\" sur le térritoire Strani, les forces armées étant quand à elles sous la supervision de l'Alliance.",
          "La police Strani comporte donc aussi bien des officiers civils que des militaires, mais dans tous les cas, ces forces ne peuvent opérer que dans l'espace Strani.",
          "Les forces de l'Alliance sont elles autorisées à opérer dans l'espace Strani, mais uniquement en collaboration avec des représentants du ministère des Armées.",
        ]
      }
    ]
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
          "<b>La Division Opérationnel</b>",
          "La Division opérationnel est chargée d’accuser réception des demandes d’aides des gouvernements planétaires ainsi que des ordres de missions des stations de l’Alliance. Il s’agit de la Division la plus administrative de l’Alliance et possède au minimum un bureau dans toutes les colonies, même les avant-postes.",
          "On retrouve au sein de cette Division un grand nombre de secrétaires et d’employés de bureau qui s’occupe du fonctionnement quotidien de l’Alliance ainsi que de jeunes officiers en début de carrière.",
          "<b>La Division Stratégique</b>",
          "La Division stratégique est chargée de planifier le développement de l’Alliance et, à ce titre, s’occupe de l’attribution des missions de premières importances. On retrouve au sein de cette Division aussi bien des stratèges, des théoriciens militaires, des diplomates ou des politiciens dont la mission est de s’assurer que l’Alliance puisse toujours répondre aux menaces pesant sur le Consortium.",
          "De par sa fonction, il s’agit de la Division la plus petite et la plus prestigieuse de l’Alliance et on ne la retrouve qu’au sein des stations principales de chaque secteur.",
          "<b>La Division Logistique</b>",
          "La Division logistique est la seconde Division la plus importante en termes d’effectifs de l’Alliance. Elle s’occupe de la gestion, de l’entretient du matériel et des infrastructures de l’Alliance. C’est également elle qui se charge de l’approvisionnement de toutes les garnisons de l’Alliance et, de ce fait, elle possède au moins un bureau dans toutes celles-ci. Enfin, elle est chargée du fonctionnement de nombreux chantiers spatiaux de l’Alliance qui fournissent à ses Starlancer les vaisseaux nécessaire pour accomplir leurs missions.",
          "<b>La Division Technologique</b>",
          "La Division technologique est une ancienne sous division de la Division logistique, elle a gagné son indépendance afin de se détacher de la lourdeur administrative de celle-ci et pour pouvoir collaborer plus facilement avec ses homologues de la Guilde et de l’Union. Elle est chargée du développement technologique et scientifique de l’Alliance, allant de la recherche en physique théorique à la psychologie humaine et extraterrestre en situation d’isolement (domaine qui s’est révélé capital pour les longs voyages spatiaux).",
          "Elle dispose de locaux dans les stations principales des secteurs de l’Alliance mais fonctionne principalement grâce à ses propres station-laboratoires.",
          "<b>La sous-division de garnison</b>",
          "La sous-section de garnison est une subdivision de la Division opérationnel chargé de la gestion des garnisons planétaire de l’Alliance, bien que très importante en terme d’effectif, elle ne constitue pas une Division propre du fait de son extrême dispersion et des liens étroits entre les garnisons et les gouvernements locaux.",
          "Chaque garnison est gérée par un commandant, sa première tâche sera la formation des forces de sécurité locale."
        ]
      },
      {
        title: 'Catégorisation des missions',
        content: [
          "L’Alliance utilise un système de catégories pour classer les différentes missions qu’elle propose au Starlancer, cette catégorisation est menée par la division opérationnel mais la division stratégique peut se saisir de n’importe qu’elle mission.",
          "<b>Categori 1</b>",
          "Les missions de catégorie 1 sont les plus faciles que propose l’Alliance, il s’agit de mission très variables dans leur objectif (escorte de transport de marchandise ou de voyageur, élimination de faune hostile peu dangereuse, etc…) mais ne présentant pas de dangerosité particulière et ne demandant pas de compétence importante.",
          "Ce genre de mission est très peu rémunéré mais sert souvent de départ pour les débutants et de bonus dans le cas d’un voyage.",
          "<b>Categori 2</b>",
          "Les missions de catégorie 2 sont les plus courantes, les objectifs de ce type de mission sont également très variable mais implique souvent de faire face à une menace particulière ou nécessite des compétences spécifiques (chasse au pirate, convoyage de matériel ou de personnel important, chasse à la faune dangereuse, destruction d’astéroïdes, etc.).",
          "Ces missions sont d’avantage rémunéré mais attirent surtout des Starlancer moyennement expérimenté.",
          "<b>Categori 3</b>",
          "Les missions de catégorie 3 représentent les missions courantes présentant un niveau de dangers plus élevé ou une plus grande importance pour l’Alliance, elles sont aussi variable que celles de catégorie 2 mais nécessite des Starlancer plus expérimenté.",
          "Ces missions sont bien rémunérées et attirent tout type de Starlancer expérimentés.",
          "<b>Categori 4</b>",
          "La catégorie 4 regroupe les missions difficiles de l’Alliance demandant la mobilisation de Starlancer chevronnés, on retrouve dans cette catégorie essentiellement des missions d’élimination de menace importante (bande de pirates, chef pirates, criminel de haut niveau, destruction d’installations, ect.).",
          "<b>Catégorie 5/Mission stratégique</b>",
          "La catégorie 5 est attribué aux missions fournis par la branche stratégique de l’Alliance, celles-ci sont souvent très difficiles et ont toujours des objectifs très spécifiques, voir exotique. Elles ne sont pas proposé sur les tableaux de missions mais c’est la division stratégique qui se charge de contacter des escouades à même de les accomplir, elles restent toutefois non-obligatoire mais la récompense est toujours à la hauteur de la difficulté.",
          "<b>Mission urgentes</b>",
          "Les missions urgentes sont aussi fournis par la division stratégique mais sont cette fois-ci sont obligatoire pour les Starlancer de l’Alliance, il s’agit de mobiliser un grand nombre de Starlancer pour faire face à une urgence.",
          "Elles ne sont toutefois pas aussi difficiles que les missions de catégorie 5.",
          "Ces missions sont en règle général bien rémunéré mais surtout, toute absence non justifiée peut faire l’objet de sanctions.",
          "Remarque : La division stratégique sélectionne le type de Starlancer mobilisé ainsi des débutant ne risque pas d’être envoyé dans une mission suicidaire pour eux.",
          "</b>La re-catégorisation</b>",
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
          "<b>Le Quartier Général d’Alcor</b>",
          "Le Quartier Général d’Alcor, souvent appelé QGA, est le plus haut lieu de commandement de l’Alliance, situé au sein de la station Alcor.",
          "On retrouve au sein de ce quartier, la direction général de toutes les branches et divisions de l’Alliance, c’est également dans ce lieu que siège l’Amirauté, le conseil chargé de la direction de l’Alliance.",
          "En plus d’être un gigantesque centre administratif, la station regroupe tous les services nécessaires aux Starlancer de l’Alliance, tel que des casernes, terrains d’entraînements, armureries, hangars, hôpitaux militaires, etc. Enfin, la station regroupe sous son commandement direct les chantiers spatiaux de l’Alliance dans le système Hélios.",
          "Du fait de son importance, seuls les Starlancer affiliés à l’Alliance et les Starlancer spécifiquement invités ont le droit de se rendre dans les zones protégées du QG.",
          "<b>Le multi-complexe Laste</b>",
          "Le multi-complexe Laste est le regroupement administratif de tous les complexes de recherche de l’Alliance au sein du système Hélios.",
          "Il consiste en de nombreuses stations et installations dans tout le système tel que (liste non exhaustive):",
          "- Laste, se trouvant sur Deimos, qui archive les recherches du complexe.",
          "- Arès, sur Phobos, il s’agit de la principale station du complexe et regroupe les recherches en matière d’armement ainsi que de nombreux projets exotiques.",
          "- Vénus, en orbite de cette planète, qui étudie le comportement des vaisseaux et des équipements en condition climatique extrême.",
          "- Amalthée, sur la lune éponyme de Jupiter, qui teste le matériel de l’Alliance dans la grande variété de condition que sont les lunes de Jupiter.",
          "- Cérès, situé dans la ceinture d’astéroïde intérieur du système Hélios, elle étudie les systèmes de navigation et de combat en utilisant la ceinture d’astéroïde comme terrain d’essai.",
          "<b>La base Vigilance</b>",
          "Il s’agit de l’une des plus grande base de l’Alliance car son rôle est de surveiller Cerberi et d’assurer l’influence de la Confédération au niveau de la frontière. Le commandement de cette base est l’un des postes les plus critique de l’Alliance du fait de son côté très sensible."
        ]
      }
    ]
  },
  {
    id: 'colony-politics',
    title: 'Politique des colonies',
    subtitle: "L'organisation politique des colonies",
    resume: "Les différents systèmes politiques des colonies et leur mise en place.",
    sections: [
      {
        title: "Fondation",
        content: [
          "Lorsqu'une planète est colonisée, la première ville est nommée capitale.",
          "L'Union y affecte un Pionnier et son équipe afin de préparer l'arrivée des colons.",
          "Lorsque les colons sont suffisamment nombreux pour avoir une société stable, le Pionnier doit désigner ou faire désigner un gouvernement.",
          "Le gouvernement prend alors le contrôle de la colonie, et le Pionnier peut retourner à ses occupations.",
          "A la fondation, la colonie doit ratifier le Code Civil d'Alcor (CCA) afin d'intégrer la Confédération.",
          "Si elle ne le fait pas, ou si à tout moment de son développement elle choisie de s'en retirer, elle devient un territoire indépendant.",
        ]
      },
      {
        title: "Politique locale",
        content: [
          "Chaque gouvernement de chaque colonie est libre d'appliquer n'importe quelle forme de politique locale à deux conditions:",
          "- Tout citoyen doit être libre de pouvoir quitter la colonie avec ses biens en toute sécurité.",
          "- Aucune loi ne pourra outrepasser le Code Civil d'Alcor (CCA).",
          "Chaque colonie peut donc avoir un système politique différent, et quand bien même les démocraties sont les plus rependues, il existe aussi des aristocraties, oligarchies, etc.",
          "Chaque gouvernement est en charge de la gestion de toute la colonie, s'il y a plusieurs villes, elles sont sous l'autorité de la capitale.",
          "Ainsi, chaque transaction interne à la colonie est géré par le gouvernement qui peut même créer sa propre monnaie et établir les valeurs marchandes de tout produit.",
          "En revanche, dès qu'un objet entre ou sort de la colonie, il est régie par les lois commerciales de la Guilde.",
          "De même, le gouvernement est en charge de la \"police\", ou sécurité intérieure, mais cette force doit opérer dans le respect du CCA et uniquement localement.",
          "Les forces de police ont une autorité limitée à leur planète, voire système si accord avec d'autres colonies.",
          "Autrement, et en toutes circonstances, ces forces sont considérées comme civiles par l'Alliance.",
          "Chaque colonie se doit de fournir au moins six bấtiments essentiels avant de pouvoir recevoir des colons :",
          "- Siège local du gouvernement planétaire",
          "- Garnison de l’Alliance comportant une réserve de matériel",
          "- Centre de transit de l’Union avec une zone de débarquement",
          "- Poste de la Guilde pour les échanges extra-planétaire",
          "- Bureau du Consortium dont le tableau des missions et un terminal",
          "- <a href=\"#\" data-article=\"alcor-tribunal\" class=\"text-blue-400 hover:text-blue-300\">Tribunal d’Alcor</a> responsable de la justice"
        ]
      },
      {
        title: "Population",
        content: [
          "Lorsqu’un premier gouvernement se met en place dans une colonie, l’Union ajoute cette destination à tous les colons potentiels.",
          "Il y est décrit le système politique à venir, la distance de la colonie avec les grands spatioports des environs, et l’indice de viabilité de la planète.",
          "L’indice de viabilité détermine le nombre d’habitants possible par colonie et les infrastructures nécessaires à son fonctionnement."
        ]
      },
      {
        title: "Justice",
        content: [
          "Toutes les affaires judiciaires sont appliquées par le Tribunal.",
          "Chaque procès est dirigé par un juge appliquant le CCA, et un adjoint appliquant les lois locales.",
          "Pour plus de détails, voir le <a href=\"#\" data-article=\"alcor-tribunal\" class=\"text-blue-400 hover:text-blue-300\">Tribunal d’Alcor</a>."
        ]
      }
    ]
      
  }
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