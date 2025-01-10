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
          'Alcor fut construite comme première étape du projet d\'immigration humaine, devenant rapidement le centre névralgique de la civilisation humaine.',
          'Sa position stratégique en orbite de Mars en fait un point central pour la gouvernance de la Confédération.'
        ]
      },
      {
        title: 'Structure',
        content: [
          'La station est composée de multiples modules interconnectés, chacun remplissant des fonctions spécifiques : gouvernementales, diplomatiques, et commerciales.',
          'Son architecture unique permet d\'accueillir des représentants de toutes les espèces connues dans des conditions adaptées.'
        ]
      }
    ]
  },
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
  }
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