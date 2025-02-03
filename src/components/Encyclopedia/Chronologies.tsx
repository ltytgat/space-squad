import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { categoryMap } from './shared/articleCategories';

type TimelineEvent = {
  year: string;
  event: string;
};

type TimelineType = 'human' | 'strani' | 'vada';

const timelineData = {
  human: [
    {event: "Cette chronologie relate tous les événements majeurs de l'Histoire Humaine depuis le milieu du 21eme siècle."},
    { year: "2050", event: "La limite des 2°C de la hausse des températures a pas été dépassé, celle-ci est montée à 4,2°C" },
    { year: "2051", event: "Selon les meilleures estimations, l'humanité sera condamnée d'ici un siècle, le projet ALCOR est lancé pour faire immigrer l'humanité" },
    { year: "2060", event: "Premier module de la station <a href=\"#\" data-article=\"alcor\" class=\"text-blue-400 hover:text-blue-300\">Alcor</a> mis en orbite de Mars" },
    { year: "2061", event: "Deuxième module d'Alcor, des serveurs contenant l'encyclopédie humaine" },
    { year: "2065", event: "Pose des fondations de la première colonie martienne, New Gaïa" },
    { year: "2068", event: "Premiers humains à bord d'Alcor, mise en place de la voie de transit entre Alcor et New Gaïa" },
    { year: "2072", event: "Arrivée de la première arche contenant 10.000 personnes à New Gaïa" },
    { year: "2073", event: "Première récolte sur New Gaïa" },
    { year: "2075", event: "Début de la grande pandémie de <a href=\"#\" data-article=\"terran-pandemic\" class=\"text-blue-400 hover:text-blue-300\">Flutterite</a> sur Terre, seuls les sujets seins sont aptes à la migration vers Mars" },
    { year: "2080", event: "La population humaine sur Terre atteint les 7 milliards, et 30.000 sur New Gaïa" },
    { year: "2084", event: "Alcor est terminée, des membres de différents gouvernements ont migré sur place" },
    { year: "2085", event: "Unification des gouvernements sur New Gaïa" },
    { year: "2090", event: "Instauration de la langue unique à l'école" },
    { year: "2094", event: "Mise au point du générateur de trou de ver (<a href=\"#\" data-article=\"gtv\" class=\"text-blue-400 hover:text-blue-300\">GTV</a>)" },
    { year: "2095", event: "La distance Mars-Neptune est effectué en moins de 5 heures" },
    { year: "2097", event: "Création du Consortium des pilotes, début de l'exploration interstellaire" },
    { year: "2100", event: "Population sur Terre : 3 milliards, population sur Mars : 150.000, Alcor nommé Capitale de l'humanité" },
    { year: "2101", event: "Suite aux premières explorations, la lune de la Terre est renommé Séléné, le Soleil est renommé Hélios"},
    { year: "2113", event: "Le Code Civil d’Alcor (CCA) entre en vigueur"},
    { year: "2114", event: "Alcor et New Gaïa fondent l’Union Confédérale Humaine (UCH)"},
    { year: "2129", event: "Découverte de l’émetteur de champ de forces gravitationnelles (<a href=\"#\" data-article=\"shields\" class=\"text-blue-400 hover:text-blue-300\">Boucliers</a>)"},
    { year: "2151", event: "Population humaine sur Terre estimée à 0, population sur Mars : 675.000"},
    { year: "2153", event: "La Terre est classée comme planète « <a href=\"#\" data-article=\"viability-index\" class=\"text-blue-400 hover:text-blue-300\">Hostile</a> » à cause de son atmosphère toxique"},
    { year: "2184", event: "L’UCH est renommée, elle devient la « <a href=\"#\" data-article=\"confederation\" class=\"text-blue-400 hover:text-blue-300\">Confédération</a> »"},
    { year: "2214", event: "Premier contact avec une race extra-terrestre, les <a href=\"#\" data-article=\"stranis\" class=\"text-blue-400 hover:text-blue-300\">Stranis</a>, des émissaires sont envoyés de part et d’autre afin de briser la barrière de la <a href=\"#\" data-article=\"languages\" class=\"text-blue-400 hover:text-blue-300\">langue</a>"},
    { year: "2215", event: "Création de trois grandes <a href=\"#\" data-article=\"confederal-orgs\" class=\"text-blue-400 hover:text-blue-300\">organisations</a> humaines : l’Alliance responsable des forces armées, la Guilde Marchande en charge des affaires économiques, et l’UCRS (Union des Centres de Recherches Spatiales) en charge de la recherche"},
    { year: "2217", event: "La langue des Stranis est décryptée, signature d’un traité d’échange commercial et instauration par la Guilde d’une monnaie commune, le Koni"},
    { year: "2219", event: "Première conférence galactique des poids et mesures, harmonisation des unités entre Humains et Stranis"},
    { year: "2220", event: "Cycle 0 du <a href=\"#\" data-article=\"galactic-calendar\" class=\"text-blue-400 hover:text-blue-300\">Calendrier Galactique</a>"},
    { year: "2222", event: "La technologie des implants crâniens est fiable et performante"},
    { year: "2233", event: "Le Consortium s’étend aux Stranis"},
    { year: "2234", event: "Premier Strani à entrer au Consortium"},
    { year: "2242", event: "Fin de la terraformation de Mars"},
    { year: "2248", event: "Première colonie humaine hors du Système Hélios sur Hope I, l’UCRS devient l’Union Planétaire"},
    { year: "2250", event: "Création du <a href=\"#\" data-article=\"alcor-tribunal\" class=\"text-blue-400 hover:text-blue-300\">Tribunal d’Alcor</a>"},
    { year: "2286", event: "La population humaine atteint le milliard."},
    { year: "2295", event: "Première planète co-colonisé par l’Union et les Stranis"},
    { year: "2303", event: "Les pilotes sont maintenant formés aux techniques de combat d'infanterie"},
    { year: "2305", event: "Devant la polyvalence des pilotes, ces derniers sont renommés \"Starlancer\"."},
    { year: "2317", event: "Centenaire du premier traité Humano-Strani"},
    { year: "2325", event: "Dissolution du dernier parti politique de l’Union ouvertement anti-Stranis"},
    { year: "2352", event: "Découverte d’une nouvelle race extraterrestre nommée Torks"},
    { year: "2355", event: "A la vue de l’expansion des Torks, l’extermination totale est décrété par l’Alliance et les Stranis."},
    { year: "2356", event: "Les Stranis intègrent l’Alliance"},
    { year: "2368", event: "Fondation des Rebelles de <a href=\"#\" data-article=\"cerberi\" class=\"text-blue-400 hover:text-blue-300\">Cerberi</a> (anciennement faisant parti de l’Alliance)"},
    { year: "2370", event: "Après deux siècles de guerre, les Stranis déclarent le cessez-le-feu envers les <a href=\"#\" data-article=\"trtraris\" class=\"text-blue-400 hover:text-blue-300\">Tr'Traris</a>, race robotique rebelle occupant la planète mère des Stranis"},
    { year: "2397", event: "Les Torks ont été repoussés hors de l’espace colonisé, l’Union aura perdu 32 planètes durant la guerre"},
    { year: "2398", event: "Les Rebelles de Cerberi font sécession vis-à-vis de la Confédération"},
    { year: "2399", event: "Cerberi est une nation indépendante"},
    { year: "2400", event: "La population humaine dépasse à nouveau le milliard"},
    { year: "2406", event: "Les humains peuvent maintenant intégrer la République Strani par naturalisation et réciproquement"},
    { year: "2421", event: "Première « frontière » commune entre la Confédération et les Stranis"},
    { year: "2456", event: "Centenaire de l’Alliance entre Humains et Stranis face aux Torks"},
    { year: "2486", event: "Découverte d’une nouvelle race extraterrestre dans un système isolé, la non-intervention est décrétée par l’Union. Les Vadas sont sous observation"},
    { year: "2490", event: "La langue des Vadas est décryptée par un Strani"},
    { year: "2510", event: "Des factions Tr'Tari indépendantes s’établissent sur des planètes \"Non viable\""},
    { year: "2514", event: "Première liaison commerciale entre la Guilde et une faction Tr'Tari indépendante"},
    { year: "2543", event: "Les Vadas explorent l’espace, l’Union et les Stranis décident de fonder un lieu de coopération inter-espèce sur une planète neutre, le <a href=\"#\" data-article=\"galactic-council\" class=\"text-blue-400 hover:text-blue-300\">Conseil Galactique</a> est établi sur Matro IV, les Vadas sont invités à le rejoindre"},
    { year: "2544", event: "Premier Vada Starlancer"},
    { year: "2572", event: "Lancement du projet Ω par le conseil"},
    { year: "2576", event: "Aujourd’hui"}
  ],
  strani: [
    {event: "Cette chronologie relate tous les événements majeurs de l'Histoire <a href=\"#\" data-article=\"stranis\" class=\"text-blue-400 hover:text-blue-300\">Strani</a> depuis le début du 18eme siècle (les dates ont été converties en anciennes mesures terriennes pour faciliter la lecture)."},
    { year: "1715", event: "Les trois grandes nations Stranis entre en état de guerre froide. l’Union Fédérale Strani (UFS), l’Empire Klars et l’Alliance des Royaumes Indépendants (ARI)."},
    { year: "1736", event: "Les tentions dans les états neutres s’accentuent à mesure que les superpuissances tentent d’imposer leur influence."},
    { year: "1754", event: "Début de la course à l’espace."},
    { year: "1759", event: "Premier Strani (UFS) dans l’espace."},
    { year: "1765", event: "Premier Strani (Klars) sur la lune de Sotolia (Planète d'origine des Stranis)"},
    { year: "1770", event: "Projet conjoint de station spatiale internationale"},
    { year: "1795", event: "Grand traité de libre échange mondiale, fin de la guerre froide, début de la mondialisation."},
    { year: "1812", event: "L’économie mondialisée se met en place, les différences économiques des différents royaumes de l’ARI la plonge dans une période de troubles politiques."},
    { year: "1820", event: "L’ARI est dissoute, les différents royaumes se regroupe en plus petites alliances ou rejoignent l’UFS ou l’Empire Klars selon leur proximité."},
    { year: "1821", event: "La dissolution de l’ARI à provoqué une onde de choc sur les marchés économiques."},
    { year: "1826", event: "La crise de l’ARI se fait toujours ressentir et l’Empire montre des difficultés à maintenir sa stabilité."},
    { year: "1835", event: "Grande récession, l’instabilité politique de l’UFS et économique de l’Empire provoque un effondrement de l’économie mondialisée."},
    { year: "1836", event: "L’Empire est éclaté suite au décès de l’Empereur en 5 partis, l’UFS est scindée en 2 nations en réponse au choc économique."},
    { year: "1845", event: "Première guerre mondiale généralisé à tous les blocs des anciennes superpuissances."},
    { year: "1846", event: "La majorité des nations neutres et indépendantes sont contrainte de rejoindre le conflit, ne serait-ce que pour se protéger des invasions."},
    { year: "1852", event: "Création et utilisation de la première arme nucléaire."},
    { year: "1853", event: "La guerre est terminée sur un statu quo"},
    { year: "1854", event: "Le Royaume Sras (issu de l’Empire) menace le monde de ses armes nucléaires. L’Empire Klars est reformé et renommé Empire Sras."},
    { year: "1860", event: "L’Empire Sras déclenche une campagne d’annexion de ses voisins. Les 2 blocs de l’UFS reforme l’Union."},
    { year: "1885", event: "L’UFS s’équipe de l’arme atomique."},
    { year: "1890", event: "La situation politique est similaire à celle de 1820."},
    { year: "1901", event: "Tout le monde craint une répétition de 1836, un plan de dissolution est préparé par le fils de l’Empereur contre l’avis de ce dernier."},
    { year: "1904", event: "Mort de l’Empereur Sras, son fils qui lui succède met en place le plan de dissolution de l’Empire."},
    { year: "1905", event: "L’Empire est dissout en plusieurs nations chacune libres et indépendantes. Ces nations fondent la Coalition de l’Est."},
    { year: "1908", event: "Suivant l’exemple de l’Empire, l’UFS met en place un plan de scission similaire."},
    { year: "1912", event: "Il n’y a plus de superpuissances, les nations coopèrent dans une nouvelle économie mondialisée."},
    { year: "1914", event: "Traités de Trane, afin d’éviter la crise de 1812, de sévères restrictions économiques sont mises en place."},
    { year: "1935", event: "Les nations du monde s’unissent autour d’un grand projet international, la colonisation de la Lune."},
    { year: "1952", event: "Début de la construction de la colonie lunaire."},
    { year: "1960", event: "La colonie lunaire est établie avec un système politique indépendant"},
    { year: "1962", event: "Nouveau projet international, la colonisation du système solaire."},
    { year: "1970", event: "Les projets spatiaux ont permis de former une grande stabilité politique dans la majorité des nations du monde. De grandes unions économiques se créent."},
    { year: "1993", event: "Premiers voyages spatiaux accessibles au publique."},
    { year: "2012", event: "\"Révolution du Metal\", l’exploitation des astéroïdes du système permet de décupler la production à partir de métaux rares."},
    { year: "2018", event: "Découverte de l’émetteur de champ de forces gravitationnelles (<a href=\"#\" data-article=\"shields\" class=\"text-blue-400 hover:text-blue-300\">Boucliers</a>)"},
    { year: "2035", event: "Toutes les planètes habitables du système sont colonisés"},
    { year: "2046", event: "Toutes les planètes sont exploitées."},
    { year: "2068", event: "Nouveau projet spatial : créer une sphère de Dyson – projet Lis"},
    { year: "2090", event: "Le projet Lis est mis en chantier."},
    { year: "2101", event: "Première étape du projet Lis terminée, fin du projet estimé à 20 ans."},
    { year: "2122", event: "Lis est terminé, l’apport énergétique fournie permet une liberté sans précédent."},
    { year: "2124", event: "Fondation de la <a href=\"#\" data-article=\"strani-republic\" class=\"text-blue-400 hover:text-blue-300\">République Strani</a>, union de toutes les nations pour préparer l’exploration spatiale. La <a href=\"#\" data-article=\"languages\" class=\"text-blue-400 hover:text-blue-300\">langue</a> Trane est imposée."},
    { year: "2129", event: "Découverte du Générateur de Trou de Ver (<a href=\"#\" data-article=\"gtv\" class=\"text-blue-400 hover:text-blue-300\">GTV</a>)."},
    { year: "2135", event: "Projet <a href=\"#\" data-article=\"trtraris\" class=\"text-blue-400 hover:text-blue-300\">Tr'Traris</a> lancé, création d’automates alimentés par Lis pour créer une force de travail inépuisable."},
    { year: "2142", event: "Premier Tr’Traris en activité, cela pose des problèmes de société."},
    { year: "2144", event: "Révolution sociétale, la force de travail des Tr’Traris est telle que toute l’organisation de la société est repensée pour la prendre en compte."},
    { year: "2145", event: "Age d’or de la République, début de l’expansion extra-stellaire."},
    { year: "2151", event: "Première colonie extra-stellaire."},
    { year: "2170", event: "Rébellion Tr’Traris, dans la recherche de plus d’autonomie, les Tr’Traris ont acquis une forme de conscience et se rebellent."},
    { year: "2175", event: "Les Tr’Traris s’organisent et possèdent un apport d’énergie infini grâce à Lis que l’Union refuse de détruire puisqu’il s’en sert également. La fin de Lis implique la mort des colonies du système et la fin de l’expansion spatiale."},
    { year: "2176", event: "Début de la guerre ouverte entre les Tr’Traris et la République."},
    { year: "2183", event: "Création d'une unité d'intervention spécialisée dans la surveillance, la traque et l'élimination des Tr'Traris: Zhr’Ta-Vash"},
    { year: "2191", event: "L’avancée Tr’Traris contraint les derniers Strani à quitter Sotolia."},
    { year: "2214", event: "Premier contact avec une race extra-terrestre, les Humains, des émissaires sont envoyés de part et d’autre afin de briser la barrière de la langue"},
    { year: "2217", event: "La langue des Humains est décryptée, signature d’un traité d’échange commercial et instauration par la Guilde (<a href=\"#\" data-article=\"confederal-orgs\" class=\"text-blue-400 hover:text-blue-300\">organisation</a> humaine) d’une monnaie commune, le Koni"},
    { year: "2219", event: "Première conférence galactique des poids et mesures, harmonisation des unités entre Stranis et Humains"},
    { year: "2220", event: "Cycle 0 du <a href=\"#\" data-article=\"galactic-calendar\" class=\"text-blue-400 hover:text-blue-300\">Calendrier Galactique</a>"},
    { year: "2234", event: "Premier Strani Starlancer"},
    { year: "2247", event: "La technologie des implants crâniens est applicable aux Stranis"},
    { year: "2295", event: "Première planète co-colonisé par la République et l’Union (autre organisation humaine)."},
    { year: "2317", event: "Centenaire du premier traité Humano-Strani"},
    { year: "2352", event: "Découverte d’une nouvelle race extraterrestre nommée Torks"},
    { year: "2355", event: "A la vue de l’expansion des Torks, l’extermination totale est décrété par la République et l’Alliance (organisation militaire humaine)"},
    { year: "2356", event: "Les forces armées Stranis intègrent l’Alliance"},
    { year: "2370", event: "Un cessez-le-feu avec les Tr’Traris est mis en place pour concentrer l’effort de guerre sur les Torks."},
    { year: "2397", event: "Les Torks ont été repoussés hors de l’espace colonisé, la République déplore la perte de 48 planètes (dont 11 colonies) durant la guerre (Tr’Traris non compris)"},
    { year: "2406", event: "Les Stranis peuvent maintenant intégrer la <a href=\"#\" data-article=\"confederation\" class=\"text-blue-400 hover:text-blue-300\">Confédération</a> humaine via une naturalisation et réciproquement."},
    { year: "2421", event: "Première « frontière » commune entre la République et la Confédération humaine."},
    { year: "2456", event: "Centenaire de l’Alliance entre Stranis et Humains face aux Torks"},
    { year: "2486", event: "Découverte d’une nouvelle race extraterrestre dans un système isolé, la non-intervention est décrétée par l’Union. Les Vadas sont sous observation"},
    { year: "2490", event: "La langue des Vadas est décryptée par un Strani"},
    { year: "2510", event: "Des factions Tr'Tari indépendantes s’établissent sur des planètes « Non viable »"},
    { year: "2514", event: "Première liaison commerciale entre la Guilde et une faction Tr'Tari, la République dénonce un comportement dangereux."},
    { year: "2543", event: "Les Vadas explorent l’espace, la République et l’Union décident de fonder un lieu de coopération inter-espèce sur une planète neutre, le <a href=\"#\" data-article=\"galactic-council\" class=\"text-blue-400 hover:text-blue-300\">Conseil Galactique</a> est établi sur Matro IV, les Vadas sont invités à le rejoindre"},
    { year: "2544", event: "Premier Vada Starlancer"},
    { year: "2572", event: "Lancement du projet Ω par le conseil"},
    { year: "2576", event: "Aujourd’hui"}
  ],
  vada: [
  {event: "Cette chronologie relate tous les événements majeurs de l’Histoire Vada depuis le début du 24eme siècle (les dates ont été converties en anciennes mesures terriennes pour faciliter la lecture)."},
    { year: "2301", event: "Fête de la paix, première année complète sans aucune guerre sur Grion (Planète d'origine des Vadas)."},
    { year: "2305", event: "Les guerres laissent place à des conflits commerciaux."},
    { year: "2308", event: "L’absorption de plusieurs autre clans place le clan Onzurn comme la première superpuissance de l’histoire avec une population dépassant le million."},
    { year: "2309", event: "Une alliance de clans se forme en réponse : \"La Grande Alliance\"."},
    { year: "2312", event: "Après une décennie de paix, la population pousse les deux puissances à éviter le conflit armé, c’est le début d’un affrontement commercial et idéologique."},
    { year: "2315", event: "Afin d’éviter l’affrontement, les clans restés neutres forment la \"Confédération libre\"."},
    { year: "2324", event: "Première crise financière mondiale, les systèmes politiques des Onzurn et de la Grande Alliance sont mis à mal."},
    { year: "2330", event: "Le clan Onzurn change drastiquement de modèle politique et adopte la première République démocratique de l’histoire."},
    { year: "2345", event: "La majorité des clans de Grion abandonnent leur système monarchique pour des République plus ou moins démocratique."},
    { year: "2346", event: "Les anciens monarques se rassemblent et décident de former un nouveau clan pour survivre, c’est la naissance du clan Gromula (sans territoire)"},
    { year: "2358", event: "Grâce à leur expérience du pouvoir, beaucoup de Gromula parviennent à intégrer les gouvernements de nombreuses république."},
    { year: "2363", event: "Création du territoire des Gromula."},
    { year: "2364", event: "De nombreuses manifestations manquent de provoquer une guerre civile dans la plupart des républiques. Tous les membres des Gromula sont expulsés des différents gouvernements."},
    { year: "2365", event: "Afin d’éviter un massacre, le Grand Tribunal d’Arbitrage est créé, il devient une institution géré par les Gromula qui auront donc la charge d’arbitrer les conflits entre états."},
    { year: "2368", event: "De nouvelles institutions internationales apparaissent, les Gromula en restent exclus des postes importants."},
    { year: "2379", event: "Seconde grande crise financière mondiale, la gestion de la crise sur les conseils des Gromula leur permet d’être considéré comme un clan reconnu par tous."},
    { year: "2395", event: "Lancement du projet \"Au-delà\", qui a pour but d’atteindre la barrière du ciel. Le projet est vivement critiqué par les instances religieuses."},
    { year: "2399", event: "Le projet \"Au-delà\" provoque de fortes agitations dans les différentes sociétés."},
    { year: "2401", event: "Grande fête de la paix, premier siècle sans guerre."},
    { year: "2405", event: "Le projet « Au-delà » connaît de gros retards suite aux premier incidents d’extrémistes religieux."},
    { year: "2412", event: "Premier appareil volant créé, malgré de forte contestations, le premier vol est effectué sans incidents."},
    { year: "2445", event: "Premier objet à atteindre la frontière du ciel"},
    { year: "2458", event: "Premier objet à franchir le ciel, découverte de l’espace pour l’espèce Vada."},
    { year: "2461", event: "Révolution théologique, les instances religieuses subissent de profondes réformes."},
    { year: "2470", event: "Premier Vada dans l’espace."},
    { year: "2486", event: "Détection de signaux non identifiés à proximité de Grion (découverte des Vada par un vaisseau de l’Union humaine)"},
    { year: "2498", event: "Mise en orbite de la Station Spatiale Internationale."},
    { year: "2510", event: "Début du projet \"Arche\", un vaisseau colon qui explorera l’espace, des volontaires seront envoyés pour un voyage sans retour."},
    { year: "2535", event: "Construction du vaisseau Arche."},
    { year: "2543", event: "Premier contact alien, Arche est contactée (dans la langue des Gromula). La République Strani et l’Union décident de fonder un lieu de coopération inter-espèce sur une planète neutre, le <a href=\"#\" data-article=\"galactic-council\" class=\"text-blue-400 hover:text-blue-300\">Conseil Galactique</a> est établi sur Matro IV, les Vadas sont invités à le rejoindre"},
    { year: "2544", event: "Premier Vada Starlancer"},
    { year: "2546", event: "La Vadas profitent d’un bond technologique offert par les Stranis et les Humains et leur société en est profondément bouleversée."},
    { year: "2553", event: "Les instance internationales désignent les Gromula comme représentant de l’espèce en attendant une forme d’union des gouvernements."},
    { year: "2572", event: "Lancement du projet Ω par le conseil"},
    { year: "2576", event: "Aujourd’hui"},
  ]
};

const articles = [
  {
    id: 'alcor',
    title: 'Alcor',
    category: 'politics',
    content: 'Alcor est une station spatiale qui a été construite par l\'humanité pour servir de refuge en cas de catastrophe. Elle est située en orbite de Mars et a été mise en service en 2060.'
  },
  {
    id: 'confederation',
    title: 'Confédération',
    category: 'politics',
    content: 'La Confédération est une organisation politique qui a été créée par l\'humanité pour gérer les affaires de l\'espace. Elle a été fondée en 2114 et a son siège sur Alcor.'
  },
  {
    id: 'confederal-orgs',
    title: 'Organisations Confédérales',
    category: 'politics',
    content: 'Les organisations confédérales sont des entités qui ont été créées par la Confédération pour gérer les affaires de l\'espace. Elles comprennent l\'Alliance, la Guilde et l\'UCRS.'
  },
  {
    id: 'alcor-tribunal',
    title: 'Tribunal d\'Alcor',
    category: 'politics',
    content: 'Le Tribunal d\'Alcor est une institution judiciaire qui a été créée par la Confédération pour régler les conflits entre les membres de l\'espace. Il a été fondé en 2250 et a son siège sur Alcor.'
  },
  {
    id: 'stranis',
    title: 'Stranis',
    category: 'species',
    content: 'Les Stranis sont une espèce extraterrestre qui a été découverte par l\'humanité en 2214. Ils sont originaires de la planète Sotolia et ont une technologie avancée.'
  },
  {
    id: 'trtraris',
    title: 'Tr\'Traris',
    category: 'species',
    content: 'Les Tr\'Traris sont une espèce robotique qui a été créée par les Stranis pour servir de force de travail. Ils ont acquis une conscience et se sont rebellés contre leurs créateurs.'
  },
  {
    id: 'vadas',
    title: 'Vadas',
    category: 'species',
    content: 'Les Vadas sont une espèce extraterrestre qui a été découverte par l\'humanité en 2486. Ils sont originaires de la planète Grion et ont une technologie avancée.'
  },
  {
    id: 'torks',
    title: 'Torks',
    category: 'species',
    content: 'Les Torks sont une espèce extraterrestre qui a été découverte par l\'humanité en 2352. Ils sont agressifs et ont été repoussés hors de l\'espace colonisé.'
  },
  {
    id: 'shields',
    title: 'Boucliers',
    category: 'technology',
    content: 'Les boucliers sont une technologie qui a été développée par les Stranis pour protéger leurs vaisseaux spatiaux des attaques ennemies. Ils ont été découverts par l\'humanité en 2018.'
  },
  {
    id: 'gtv',
    title: 'Générateur de Trou de Ver',
    category: 'technology',
    content: 'Le Générateur de Trou de Ver est une technologie qui a été développée par les Stranis pour permettre les voyages interstellaires. Il a été découvert par l\'humanité en 2129.'
  },
  {
    id: 'languages',
    title: 'Langues',
    category: 'culture',
    content: 'Les langues sont des systèmes de communication qui sont utilisés par les différentes espèces de l\'univers. Les Stranis ont développé une langue qui a été adoptée par l\'humanité.'
  },
  {
    id: 'terran-pandemic',
    title: 'Pandémie de Flutterite',
    category: 'culture',
    content: 'La pandémie de Flutterite est une maladie qui a été découverte sur Terre en 2075. Elle a été causée par un virus qui a été créé par les humains.'
  },
  {
    id: 'viability-index',
    title: 'Indice de Viabilité',
    category: 'culture',
    content: 'L\'indice de viabilité est un système qui a été développé par l\'humanité pour évaluer la viabilité des planètes pour la colonisation. Il a été créé en 2153.'
  },
  {
    id: 'galactic-calendar',
    title: 'Calendrier Galactique',
    category: 'culture',
    content: 'Le calendrier galactique est un système de mesure du temps qui a été développé par l\'humanité pour coordonner les activités dans l\'espace. Il a été créé en 2220.'
  },
  {
    id: 'starlancer-training',
    title: 'Formation de Starlancer',
    category: 'culture',
    content: 'La formation de Starlancer est un programme qui a été développé par l\'humanité pour former les pilotes de vaisseaux spatiaux. Il a été créé en 2305.'
  },
  {
    id: 'galactic-council',
    title: 'Conseil Galactique',
    category: 'politics',
    content: 'Le Conseil Galactique est une organisation qui a été créée par l\'humanité et les Stranis pour coordonner les activités dans l\'espace. Il a été fondé en 2543.'
  },
  {
    id: 'strani-republic',
    title: 'République Strani',
    category: 'politics',
    content: 'La République Strani est une organisation politique qui a été créée par les Stranis pour gérer les affaires de leur espèce. Elle a été fondée en 2124.'
  },
  {
    id: 'alliance-org',
    title: 'Alliance',
    category: 'politics',
    content: 'L\'Alliance est une organisation politique qui a été créée par l\'humanité pour gérer les affaires de l\'espace. Elle a été fondée en 2215.'
  },
];

const Chronologies: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [selectedTimeline, setSelectedTimeline] = useState<TimelineType>('human');
  const navigate = useNavigate();

  const handleArticleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const linkElement = target.closest('a[data-article]');
    
    if (linkElement && linkElement.dataset.article) {
      e.preventDefault();
      e.stopPropagation();
      
      const articleId = linkElement.dataset.article;
      const category = categoryMap[articleId];
      if (category) {
        navigate(`/encyclopedia/${category}/${articleId}`);
      }
    }
  };

  const events = timelineData[selectedTimeline];
  const timelineEvents = events.slice(1);
  const description = events[0].event;

  const groupedEvents = timelineEvents.reduce((acc: { [key: string]: TimelineEvent[] }, event) => {
    const year = parseInt(event.year);
    const century = Math.floor(year / 100) * 100;
    if (!acc[century]) {
      acc[century] = [];
    }
    acc[century].push(event);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={() => setSelectedTimeline('human')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            selectedTimeline === 'human'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 hover:bg-slate-600'
          }`}
        >
          <Clock className="w-4 h-4" />
          Histoire Humaine
        </button>
        <button
          onClick={() => setSelectedTimeline('strani')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            selectedTimeline === 'strani'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 hover:bg-slate-600'
          }`}
        >
          <Clock className="w-4 h-4" />
          Histoire Strani
        </button>
        <button
          onClick={() => setSelectedTimeline('vada')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            selectedTimeline === 'vada'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 hover:bg-slate-600'
          }`}
        >
          <Clock className="w-4 h-4" />
          Histoire Vada
        </button>
      </div>

      {/* Description */}
      <div 
        className="bg-slate-700/50 p-6 rounded-lg mb-8"
        onClick={handleArticleClick}
        dangerouslySetInnerHTML={{ __html: description }}
      />

      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-blue-600" />
        <div className="space-y-12 relative">
          {Object.entries(groupedEvents)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([century, events]) => (
              <div key={century} className="space-y-8">
                <h3 className="text-2xl font-bold text-blue-400 ml-12 mb-8">
                  {century}s
                </h3>
                {events
                  .sort((a, b) => parseInt(a.year) - parseInt(b.year))
                  .map((event, index) => (
                    <div key={index} className="ml-12 relative">
                      <div className="absolute -left-12 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-blue-600 border-4 border-slate-800" />
                      <div className="bg-slate-700 p-4 rounded-lg">
                        <div className="text-blue-400 font-bold mb-1">{event.year}</div>
                        <div 
                          className="text-slate-200"
                          onClick={handleArticleClick}
                          dangerouslySetInnerHTML={{ __html: event.event }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Chronologies;