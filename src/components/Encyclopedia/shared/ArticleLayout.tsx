import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ArticleSection {
  title: string;
  content: string[];
}

interface Article {
  id: string;
  title: string;
  subtitle: string;
  resume: string;
  sections?: ArticleSection[];
}

interface ArticleLayoutProps {
  title: string;
  articles: Article[];
  onBack: () => void;
  selectedArticleId?: string | null;
}

export default function ArticleLayout({ title, articles, onBack, selectedArticleId }: ArticleLayoutProps) {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // When selectedArticleId changes, find and set the article
    if (selectedArticleId) {
      const article = articles.find(a => a.id === selectedArticleId);
      if (article) {
        setSelectedArticle(article);
      }
    } else {
      // If selectedArticleId is null, clear the selected article
      setSelectedArticle(null);
    }
  }, [selectedArticleId, articles]);

  const handleArticleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const linkElement = target.closest('a[data-article]');
    
    if (linkElement && linkElement.dataset.article) {
      e.preventDefault();
      e.stopPropagation();
      
      const articleId = linkElement.dataset.article;
      
      // Map article IDs to their categories
      const categoryMap: { [key: string]: string } = {
        // Politics articles
        'alcor': 'politics',
        'confederation': 'politics',
        'confederal-orgs': 'politics',
        'alcor-tribunal': 'politics',
        'cerberi': 'politics',
        'galactic-council': 'politics',
        'strani-republic': 'politics',
        'alliance-org': 'politics',
        'colony-politics': 'politics',
        // Species articles
        'stranis': 'species',
        'trtraris': 'species',
        'vadas': 'species',
        'torks': 'species',
        // Technology articles
        'shields': 'technology',
        'gtv': 'technology',
        'communications': 'technology',
        'weapons-usage': 'technology',
        // Culture articles
        'languages': 'culture',
        'terran-pandemic': 'culture',
        'viability-index': 'culture',
        'galactic-calendar': 'culture',
        'starlancer-training': 'culture',
        'rewards': 'culture',
        'divisions': 'culture',
        'names': 'culture',
      };

      const category = categoryMap[articleId];
      
      // Only set local state if the article is in the current category
      const article = articles.find(a => a.id === articleId);
      if (article) {
        setSelectedArticle(article);
      } else if (category) {
        // If article not found in current category, navigate to it
        navigate(`/encyclopedia/${category}/${articleId}`);
      }
    }
  };

  const renderContent = (content: string) => {
    return content.replace(
      /<a href="#" data-article="([^"]+)"([^>]*)>([^<]+)<\/a>/g,
      (match, articleId, attributes, text) => {
        // Keep any additional attributes from the original link
        const extraAttrs = attributes.replace(/data-article="[^"]+"/, '').trim();
        return `<a href="#" data-article="${articleId}" class="text-blue-400 hover:text-blue-300 underline" ${extraAttrs}>${text}</a>`;
      }
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>

      <div className="flex-1 overflow-auto">
        {selectedArticle ? (
          <article className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{selectedArticle.title}</h1>
              {selectedArticle.subtitle && (
                <h2 className="text-xl text-slate-400">{selectedArticle.subtitle}</h2>
              )}
            </div>

            {selectedArticle.resume && (
              <p className="text-lg text-slate-300">{selectedArticle.resume}</p>
            )}

            <div className="space-y-8">
              {selectedArticle.sections?.map((section, index) => (
                <section key={index}>
                  {section.title && (
                    <h3 className="text-xl font-bold mb-4">{section.title}</h3>
                  )}
                  <div className="space-y-4">
                    {section.content.map((content, contentIndex) => (
                      <div
                        key={contentIndex}
                        onClick={handleArticleClick}
                        dangerouslySetInnerHTML={{ __html: renderContent(content) }}
                        className="text-slate-300"
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </article>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map((article) => (
              <button
                key={article.id}
                onClick={() => setSelectedArticle(article)}
                className="text-left p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
              >
                <h3 className="font-bold mb-2">{article.title}</h3>
                {article.subtitle && (
                  <p className="text-sm text-slate-400">{article.subtitle}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}