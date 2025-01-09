import React from 'react';
import { ArrowLeft } from 'lucide-react';
import ArticleLayout from './shared/ArticleLayout';

const articles = [
  {
    id: 'starlancer-training',
    title: 'Formation des Starlancer',
    subtitle: 'Entraînement d\'élite',
    content: 'Le programme de formation des pilotes d\'élite Starlancer.'
  },
  {
    id: 'galactic-calendar',
    title: 'Calendrier Galactique',
    subtitle: 'Mesure du temps',
    content: 'Le système de mesure du temps utilisé par toutes les civilisations.'
  },
  {
    id: 'languages',
    title: 'Langues',
    subtitle: 'Communication interstellaire',
    content: 'Les différentes langues utilisées dans la galaxie.'
  },
  {
    id: 'names',
    title: 'Noms',
    subtitle: 'Nomenclature',
    content: 'Les conventions de nommage dans les différentes cultures.'
  },
  {
    id: 'distinctions',
    title: 'Distinctions',
    subtitle: 'Honneurs et récompenses',
    content: 'Les différentes distinctions et récompenses dans la société.'
  },
  {
    id: 'terran-pandemic',
    title: 'Grande Pandémie Terrienne',
    subtitle: 'Crise historique',
    content: 'La pandémie qui a forcé l\'humanité à quitter la Terre.'
  },
  {
    id: 'viability-index',
    title: 'Indice de viabilité',
    subtitle: 'Classification planétaire',
    content: 'Le système de classification de la viabilité des planètes.'
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