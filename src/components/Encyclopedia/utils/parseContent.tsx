import React from 'react';
import ArticleLink from '../shared/ArticleLink';

export const parseContent = (content: string): React.ReactNode[] => {
  const parts = content.split(/(<a[^>]*>.*?<\/a>)/);
  
  return parts.map((part, index) => {
    if (part.startsWith('<a')) {
      // Extract article ID and text content
      const articleMatch = part.match(/data-article="([^"]*)"/) || [];
      const textMatch = part.match(/>([^<]*)</) || [];
      const articleId = articleMatch[1];
      const text = textMatch[1];

      if (articleId && text) {
        return (
          <ArticleLink key={index} articleId={articleId}>
            {text}
          </ArticleLink>
        );
      }
    }
    return part;
  });
};
