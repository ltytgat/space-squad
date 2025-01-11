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
          "En 2051 (c-158), alors que l’humanité se sait condamnée sur Terre, le Projet Alcor voit le jour."
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
  {
    id: 'confederation',
    title: 'Confédération',
    subtitle: 'Union des colonies humaines',
    resume: 'La Confédération est l\'organisation politique qui unit toutes les colonies humaines, établie pour assurer la survie et la prospérité de l\'humanité.',
    sections: [
      {
        title: 'Organisation',
        content: [
          'La Confédération est structurée en trois branches principales : l\'Alliance pour la défense, la Guilde Marchande pour l\'économie, et l\'Union Planétaire pour la recherche.',
          'Chaque colonie conserve une autonomie relative tout en participant à la gouvernance collective.'
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
    //sections: []
  },
  {
    id: 'galactic-council',
    title: 'Conseil Galactique',
    subtitle: 'Coopération interstellaire',
    resume: 'Le Conseil Galactique est l\'organe de coopération entre les différentes espèces.',
    //sections: []
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
  // ... autres articles avec leurs sections détaillées
];

export default function Politics({ onBack }: { onBack: () => void }) {
  return (
    <ArticleLayout 
      title="Politique"
      articles={articles}
      onBack={onBack}
    />
  );
}