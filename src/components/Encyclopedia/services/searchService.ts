import { articles as cultureArticles } from '../Culture';
import { articles as speciesArticles } from '../NonHumanSpecies';
import { articles as politicsArticles } from '../Politics';
import { articles as technologyArticles } from '../Technology';

interface Article {
  id: string;
  title: string;
  subtitle?: string;
  resume?: string;
  sections: {
    title: string;
    content: string[];
  }[];
}

interface CategoryArticles {
  id: string;
  label: string;
  articles: Article[];
}

export interface SearchResult {
  title: string;
  category: string;
  categoryId: string;
  articleId: string;
  excerpt: string;
  matchType: 'title' | 'section-title' | 'subtitle-or-resume' | 'content';
  priority: number;
}

const categoryArticles: CategoryArticles[] = [
  { id: 'species', label: 'Espèces non-humaines', articles: speciesArticles || [] },
  { id: 'politics', label: 'Politique', articles: politicsArticles || [] },
  { id: 'technology', label: 'Technologie', articles: technologyArticles || [] },
  { id: 'culture', label: 'Culture', articles: cultureArticles || [] }
];

const getExcerpt = (content: string, query: string, maxLength: number = 200): string => {
  const normalizedContent = content.toLowerCase();
  const index = normalizedContent.indexOf(query.toLowerCase());
  
  if (index === -1) return content.substring(0, maxLength);
  
  const start = Math.max(0, index - 50);
  const end = Math.min(content.length, index + query.length + 50);
  
  let excerpt = content.substring(start, end);
  
  if (start > 0) excerpt = '...' + excerpt;
  if (end < content.length) excerpt = excerpt + '...';
  
  return excerpt;
};

const stripHtmlTags = (str: string): string => {
  return str.replace(/<[^>]*>/g, '');
};

export const searchEncyclopedia = (query: string): SearchResult[] => {
  const normalizedQuery = query.toLowerCase();
  const results: SearchResult[] = [];

  categoryArticles.forEach(category => {
    if (!category.articles) return;
    
    category.articles.forEach(article => {
      if (!article) return;

      // Priority 1: Match in article title
      if (article.title.toLowerCase().includes(normalizedQuery)) {
        results.push({
          title: article.title,
          category: category.label,
          categoryId: category.id,
          articleId: article.id,
          excerpt: article.resume || '',
          matchType: 'title',
          priority: 1
        });
      }

      // Priority 2: Match in section titles
      article.sections?.forEach(section => {
        if (!section) return;
        
        if (section.title.toLowerCase().includes(normalizedQuery)) {
          results.push({
            title: article.title,
            category: category.label,
            categoryId: category.id,
            articleId: article.id,
            excerpt: `Section: ${section.title}`,
            matchType: 'section-title',
            priority: 2
          });
        }
      });

      // Priority 3: Match in subtitle or resume
      const subtitleAndResume = [article.subtitle, article.resume]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      
      if (subtitleAndResume.includes(normalizedQuery)) {
        results.push({
          title: article.title,
          category: category.label,
          categoryId: category.id,
          articleId: article.id,
          excerpt: article.resume || article.subtitle || '',
          matchType: 'subtitle-or-resume',
          priority: 3
        });
      }

      // Priority 4: Match in section content
      article.sections?.forEach(section => {
        if (!section?.content) return;
        
        section.content.forEach(contentItem => {
          if (!contentItem) return;
          
          const cleanContent = stripHtmlTags(contentItem);
          if (cleanContent.toLowerCase().includes(normalizedQuery)) {
            results.push({
              title: article.title,
              category: category.label,
              categoryId: category.id,
              articleId: article.id,
              excerpt: getExcerpt(cleanContent, normalizedQuery),
              matchType: 'content',
              priority: 4
            });
          }
        });
      });
    });
  });

  // Remove duplicates and keep only the highest priority result for each article
  const uniqueResults = results.reduce<{ [key: string]: SearchResult }>((acc, current) => {
    const key = `${current.categoryId}-${current.articleId}`;
    if (!acc[key] || current.priority < acc[key].priority) {
      acc[key] = current;
    }
    return acc;
  }, {});

  // Convert back to array and sort by priority
  return Object.values(uniqueResults).sort((a, b) => a.priority - b.priority);
};
