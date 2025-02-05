import React from 'react';
import { ArticleLayout } from './shared/ArticleLayout';
import { CategoryComponentProps } from './shared/types';

const Stardash: React.FC<CategoryComponentProps> = ({ onBack, selectedArticleId }) => {
  const articles = [
    // Articles will be added here later
  ];

  return (
    <ArticleLayout
      title="Stardash"
      articles={articles}
      selectedArticleId={selectedArticleId}
      onBack={onBack}
    />
  );
};

export default Stardash;
