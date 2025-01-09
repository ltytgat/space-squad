import React from 'react';
import { ArrowLeft } from 'lucide-react';
import ArticleLayout from './shared/ArticleLayout';

const articles = [
  {
    id: 'stranis',
    title: 'Stranis',
    subtitle: 'Race majeure de la galaxie',
    content: 'Les Stranis sont une espèce technologiquement avancée originaire de Sotolia.'
  },
  {
    id: 'trtraris',
    title: 'Tr\'Traris',
    subtitle: 'Intelligence artificielle autonome',
    content: 'Les Tr\'Traris sont une forme de vie synthétique créée par les Stranis.'
  },
  {
    id: 'vada',
    title: 'Vada',
    subtitle: 'Nouvelle civilisation spatiale',
    content: 'Les Vada sont une espèce récemment découverte originaire de Grion.'
  },
  {
    id: 'torks',
    title: 'Torks',
    subtitle: 'Menace extraterrestre',
    content: 'Les Torks sont une espèce hostile qui a tenté d\'envahir l\'espace colonisé.'
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