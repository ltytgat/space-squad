import React from 'react';
import { ArrowLeft } from 'lucide-react';
import ArticleLayout from './shared/ArticleLayout';

const articles = [
  {
    id: 'shields',
    title: 'Boucliers',
    subtitle: 'Protection énergétique',
    content: 'Les boucliers sont des champs de force qui protègent les vaisseaux et les installations.'
  },
  {
    id: 'communications',
    title: 'Communications',
    subtitle: 'Réseaux interstellaires',
    content: 'Les systèmes de communication permettant les échanges à travers la galaxie.'
  },
  {
    id: 'gtv',
    title: 'Générateur de Trou de Ver (GTV)',
    subtitle: 'Voyage spatial',
    content: 'Le GTV permet le voyage rapide entre des points éloignés de l\'espace.'
  },
  {
    id: 'weapons',
    title: 'Usage des armes',
    subtitle: 'Armement spatial',
    content: 'Les différents types d\'armes et leur utilisation dans l\'espace.'
  }
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