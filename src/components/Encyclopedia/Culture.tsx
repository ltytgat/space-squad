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
        title: 'Histoire du calendrier',
        content: [
          'Le Calendrier Galactique a été établi en 2220, marquant le début du Cycle 0.',
          'Son adoption a été l\'une des premières initiatives de coopération entre les Humains et les Stranis.'
        ]
      },
      {
        title: 'Structure temporelle',
        content: [
          'Le calendrier est basé sur une année standard de 360 jours, divisée en 12 mois de 30 jours.',
          'Chaque jour est divisé en 20 heures standards galactiques pour faciliter la synchronisation entre les différentes espèces.'
        ]
      }
    ]
  },
  {
    id: 'viability-index',
    title: 'Indice de viabilité',
    subtitle: 'Classification planétaire',
    resume: 'Le système de classification de la viabilité des planètes.'
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
      content[
        "La terre a possédé un indice de viabilité de 4 jusqu’au début du 21eme siècle à partir du quel il est passé à 3 suite au début de la Grande Pandémie de Flutterite en 2075 (c-135).",
        "En 2153 (c-61), l’indice de la Terre passe à 2 suite aux derniers relevés atmosphériques."
        ]
    }
  }
];

export default function Culture({ onBack }: { onBack: () => void }) {
  return (
    <ArticleLayout 
      title="Culture"
      articles={articles}
      onBack={onBack}
    />
  );
}