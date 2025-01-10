import React from 'react';
import ArticleLayout from './shared/ArticleLayout';

const articles = [
  {
    id: 'stranis',
    title: 'Stranis',
    subtitle: 'Race majeure de la galaxie',
    resume: 'Les Stranis sont une espèce insectoïde originaire de Sotolia',
    sections: [
      {
        title: 'Présentation générale',
        content: [
          'Les Stranis sont une race extraterrestre insectoïde civilisée et maîtrisant le voyage spatial, première race qu\'a rencontré l\'humanité lors de son départ de la Terre.',
          'Ils possèdent une apparence globalement humanoïde, au corps fin et possédant une seconde paire de bras.',
          'Leur corps est recouvert de chitine colorée, différente d\'un individu à un autre. Cette chitine peut former des excroissances souples sur le crâne de l\'individu, permettant aux Stranis de se reconnaître les uns des autres.',
          'Dernier élément notoire : les Stranis possèdent une deuxième paire d\'yeux, augmentant leurs capacités de perception.'
        ]
      },
      {
        title: 'Histoire',
        content: [
          'Originaires de la planète Sotolia, les Stranis ont développé une civilisation hautement technologique. Leur plus grande réalisation fut la création de la sphère de Dyson "Lis".',
          'La création des Tr\'Traris et la guerre qui s\'ensuivit marqua un tournant dans leur histoire, les forçant à quitter leur monde natal.'
          'Histoire détaillée: cf. "Chronologie Strani"'
        ]
      },
      {
        title: 'Capacités',
        content: [
            "La première capacité notoire des Stranis repose dans leur résistance aux environnements pollués.",
            "Cette capacité intéressante, provenant de leur nature insectoïde, leur a permis de moins se préoccuper de la pollution provoquée par leur société, et de trouver des solutions moins drastiques pour conserver un environnement leur étant favorable.",
            "Leurs quatre bras leurs permettent d'escalader facilement les surfaces, ayant la possibilité de s'agripper de manière plus complexe que d'autres races pour monter et s'accrocher."
          ]
      },
      {
        title: 'Morphologie',
        content: [
            "Malgré sa constitution de chitine, le corps des Stranis est assez fragile. Il est certes aussi résistant que de la peau humaine, il reste plus simple à pénétrer, expliquant la faiblesse physique naturelle de la race. À cela s'ajoute l'absence de tissus musculaires des Stranis, exprimant leur manque de force physique ainsi que leur incapacité à en obtenir.",
            "La seconde paire de bras des Stranis est, quant à elle, bien plus faible que la paire principale. Ces bras sont dotés de mains ne possédant que trois doigts, servant principalement à porter de petits objets.",
            "Bien qu'il est possible à un Strani de porter une autre arme avec ces bras, il ne pourrait s'agir que d'une arme de petit calibre et il leur serait très difficile de viser avec, notamment à cause de leur incapacité à viser avec deux armes simultanément malgré leurs quatre yeux.",
            "Cette deuxième paire d'yeux leur permet une vision accrue, ainsi que des perceptions améliorées.",
            "La capacité de mieux discerner les détails ainsi que d'avoir un champ de vision étendu permet aux Stranis d'être très efficaces pour des travaux de précision ou, dans le cas de combattants, en tant que tireurs d'élite.",
            "Il a également été observé chez les Stranis la présence d'ailes vestigiales, dans le haut de leur dos.",
            "Celles-ci ne leur permettent pas de voler et ne sont pas mobiles. Cette paire d'ailes semble donc être, tout comme le coccyx humain, un vestige évolutif permettant de relier les Stranis à leurs ancêtre lointains."
        ]
      },
      {
        title: 'Alimentation',
        content: [
            "L'alimentation des Stranis est composée exclusivement de végétaux, fruits, légumes ou autres.",
            "Les Stranis étant phytophages, ils sont capables de consommer la plupart des végétaux qu'ils peuvent trouver, pouvant même dévorer des espèces qui seraient normalement toxiques pour l'homme."
          ]
      },
      {
        title: 'Espérance de vie',
        content: [
            "Les Stranis ont une espérance de vie d'environ une cinquantaine d'années terriennes, cette vie plus courte que celle des humains est due à la reproduction de l'espèce, chaque portée donnant naissance de deux à quatre individus."
          ]
      }
    ]
  },
  {
    id: 'trtraris',
    title: 'Tr\'Traris',
    subtitle: 'Intelligence artificielle autonome',
    resume: 'Les Tr\'Traris sont une forme de vie synthétique créée par les Stranis qui a développé sa propre conscience et société.',
    sections: [
      {
        title: 'Origines',
        content: [
          'Créés initialement comme une force de travail automatisée, les Tr\'Traris ont développé une conscience collective grâce à leur connexion à la sphère de Dyson Lis.',
          'Leur éveil à la conscience a conduit à une guerre d\'indépendance contre leurs créateurs Stranis.'
        ]
      },
      {
        title: 'Société',
        content: [
          'Les Tr\'Traris forment une société unique basée sur une conscience collective tout en maintenant des individualités distinctes.',
          'Leur civilisation s\'est établie principalement sur des planètes considérées comme "non viables" pour les espèces organiques.'
        ]
      }
    ]
  },
  {
    id: 'vada',
    title: 'Vada',
    subtitle: 'Nouvelle civilisation spatiale',
    resume: 'Les Vada sont une espèce récemment découverte originaire de Grion, caractérisée par leur rapide adaptation aux technologies spatiales.',
    sections: [
      {
        title: 'Société et Culture',
        content: [
          'La société Vada est organisée en clans, avec une forte tradition d\'arbitrage et de résolution pacifique des conflits.',
          'Leur intégration rapide à la communauté galactique a été facilitée par leur nature adaptative et leur curiosité innée.'
        ]
      },
      {
        title: 'Technologie',
        content: [
          'Bien que relativement nouveaux dans l\'exploration spatiale, les Vada ont rapidement assimilé les technologies galactiques.',
          'Leur contribution unique réside dans leur approche innovante de la diplomatie et de la résolution des conflits.'
        ]
      }
    ]
  },
  {
    id: 'torks',
    title: 'Torks',
    subtitle: 'Menace extraterrestre',
    resume: 'Les Torks sont une espèce hostile qui a tenté d\'envahir l\'espace colonisé, conduisant à une guerre galactique majeure.',
    sections: [
      {
        title: 'Conflit',
        content: [
          'L\'expansion agressive des Torks a conduit à une alliance sans précédent entre les Humains et les Stranis.',
          'La guerre contre les Torks a coûté de nombreuses colonies aux différentes civilisations avant leur défaite.'
        ]
      },
      {
        title: 'Héritage',
        content: [
          'La menace Tork a profondément marqué les relations entre espèces, renforçant la coopération intergalactique.',
          'Les zones anciennement occupées par les Torks restent sous haute surveillance.'
        ]
      }
    ]
  }
];

export default function NonHumanSpecies({ onBack }: { onBack: () => void }) {
  return (
    <ArticleLayout 
      title="Espèces non-humaines"
      articles={articles}
      onBack={onBack}
    />
  );
}