import React from 'react';
import { ArrowLeft } from 'lucide-react';
import ArticleLayout from './shared/ArticleLayout';

const articles = [
  {
    id: 'alcor',
    title: 'Alcor',
    subtitle: 'Capitale de l\'humanité',
    content: 'Alcor est la station spatiale qui sert de capitale à la Confédération.'
  },
  {
    id: 'confederation',
    title: 'Confédération',
    subtitle: 'Union des colonies humaines',
    content: 'La Confédération est l\'organisation politique qui unit toutes les colonies humaines.'
  },
  {
    id: 'confederal-orgs',
    title: 'Organisations confédérales',
    subtitle: 'Structures administratives',
    content: 'Les différentes organisations qui composent la Confédération.'
  },
  {
    id: 'galactic-council',
    title: 'Conseil Galactique',
    subtitle: 'Coopération interstellaire',
    content: 'Le Conseil Galactique est l\'organe de coopération entre les différentes espèces.'
  },
  {
    id: 'strani-republic',
    title: 'République Strani',
    subtitle: 'État Strani unifié',
    content: 'La République Strani est l\'organisation politique qui unit tous les Stranis.'
  },
  {
    id: 'cerberi',
    title: 'Cerberi',
    subtitle: 'Faction dissidente',
    content: 'Cerberi est une nation indépendante issue d\'une scission avec la Confédération.'
  },
  {
    id: 'alliance-org',
    title: 'Organisation interne de l\'Alliance',
    subtitle: 'Structure militaire',
    content: 'L\'organisation interne de l\'Alliance, la force militaire unifiée.'
  },
  {
    id: 'alcor-tribunal',
    title: 'Tribunal d\'Alcor',
    subtitle: 'Justice confédérale',
    content: 'Le Tribunal d\'Alcor est la plus haute instance judiciaire de la Confédération.'
  },
  {
    id: 'colony-politics',
    title: 'Politique des colonies',
    subtitle: 'Administration coloniale',
    content: 'Le système politique et administratif des colonies humaines.'
  },
  {
    id: 'divisions',
    title: 'Divisions',
    subtitle: 'Unités spécialisées',
    content: 'Les différentes divisions spécialisées de l\'Alliance.'
  }
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