import React from 'react';
import ArticleLayout from './shared/ArticleLayout';

const articles = [
  {
    id: 'shields',
    title: 'Boucliers',
    subtitle: 'Protection énergétique',
    resume: 'Les boucliers sont des champs de force qui protègent les vaisseaux et les installations, une technologie fondamentale pour la survie dans l\'espace.',
    sections: [
      {
        title: 'Fonctionnement',
        content: [
          'Les boucliers créent une barrière énergétique qui dévie ou absorbe les impacts et les radiations dangereuses.',
          'Leur efficacité dépend de la puissance disponible et de la sophistication des émetteurs de champ.'
        ]
      },
      {
        title: 'Applications',
        content: [
          'Au-delà de la protection des vaisseaux, les boucliers sont utilisés pour sécuriser les colonies et les installations sensibles.',
          'Les dernières avancées permettent des applications plus spécialisées comme le confinement de réactions dangereuses.'
        ]
      }
    ]
  },
  {
    id: 'gtv',
    title: 'Générateur de Trou de Ver (GTV)',
    subtitle: 'Voyage spatial',
    resume: 'Le GTV permet le voyage rapide entre des points éloignés de l\'espace, révolutionnant l\'exploration et le commerce galactique.',
    sections: [
      {
        title: 'Principe',
        content: [
          'Le GTV crée un passage artificiel à travers l\'espace-temps, permettant des voyages quasi-instantanés sur de grandes distances.',
          'La technologie repose sur la manipulation précise de champs gravitationnels et quantiques.'
        ]
      },
      {
        title: 'Impact',
        content: [
          'L\'invention du GTV a transformé la société galactique, rendant possible l\'établissement d\'une civilisation véritablement interstellaire.',
          'Le Consortium des pilotes régule strictement l\'utilisation des GTV pour garantir la sécurité des voyages.'
        ]
      }
    ]
  }
  // ... autres articles avec leurs sections détaillées
];

export default function Technology({ onBack }: { onBack: () => void }) {
  return (
    <ArticleLayout 
      title="Technologie"
      articles={articles}
      onBack={onBack}
    />
  );
}