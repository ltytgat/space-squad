import React from 'react';
import ArticleLayout from './shared/ArticleLayout';

const articles = [
  {
    id: 'stranis',
    title: 'Stranis',
    subtitle: 'Race majeure de la galaxie',
    resume: 'Les Stranis sont une espèce technologiquement avancée originaire de Sotolia, qui a marqué l\'histoire galactique par leurs innovations et leur civilisation.',
    sections: [
      {
        title: 'Physiologie',
        content: [
          'Les Stranis sont des êtres humanoïdes à la peau bleutée et aux traits fins. Leur physiologie est adaptée à une gravité légèrement plus forte que celle de la Terre.',
          'Ils possèdent une capacité naturelle à percevoir les champs électromagnétiques, ce qui a grandement influencé leur développement technologique.'
        ]
      },
      {
        title: 'Histoire',
        content: [
          'Originaires de la planète Sotolia, les Stranis ont développé une civilisation hautement technologique. Leur plus grande réalisation fut la création de la sphère de Dyson "Lis".',
          'La création des Tr\'Traris et la guerre qui s\'ensuivit marqua un tournant dans leur histoire, les forçant à quitter leur monde natal.'
        ]
      },
      {
        title: 'Culture',
        content: [
          'La société Strani accorde une grande importance à l\'innovation et au progrès technologique. Leur culture est basée sur la méritocratie et la recherche du savoir.',
          'Les arts Stranis sont fortement influencés par leur perception unique des champs électromagnétiques, créant des œuvres incompréhensibles pour les autres espèces.'
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