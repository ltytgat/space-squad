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
  }
  // ... autres articles avec leurs sections détaillées
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