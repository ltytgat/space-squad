import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { categoryMap } from './articleCategories';

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

export const ArticleLayout = ({ title, articles, onBack, selectedArticleId }: ArticleLayoutProps) => {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const navigate = useNavigate();
  const articleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // When selectedArticleId changes, find and set the article
    if (selectedArticleId) {
      const article = articles.find(a => a.id === selectedArticleId);
      if (article) {
        setSelectedArticle(article);
        // Reset scroll position when article changes
        if (articleRef.current) {
          articleRef.current.scrollTo(0, 0);
        }
        // Also reset the window scroll
        window.scrollTo(0, 0);
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
      /<a([^>]*)>/g,
      '<a class="text-blue-400 hover:text-blue-300"$1>'
    );
  };

  if (selectedArticle) {
    return (
      <div className="space-y-6" ref={articleRef}>
        <button
          onClick={() => setSelectedArticle(null)}
          className="text-blue-400 hover:text-blue-300 flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux articles
        </button>

        <article className="prose prose-invert max-w-none" onClick={handleArticleClick}>
          <h1 className="text-3xl font-bold text-white mb-2">{selectedArticle.title}</h1>
          <h2 className="text-xl text-blue-400 mb-6">{selectedArticle.subtitle}</h2>
          
          {/* Introduction/Resume */}
          <div className="bg-slate-700/50 p-6 rounded-lg mb-8">
            <p className="text-slate-200 text-lg" 
               dangerouslySetInnerHTML={{ __html: renderContent(selectedArticle.resume) }} />
          </div>

          {/* Sections */}
          {selectedArticle.sections && (
            <div className="space-y-8">
              {selectedArticle.sections.map((section, index) => (
                <section key={index} className="bg-slate-700/30 p-6 rounded-lg">
                  <h3 className="text-2xl font-bold text-blue-400 mb-4">{section.title}</h3>
                  <div className="space-y-4">
                    {section.content.map((paragraph, pIndex) => (
                      <div 
                        key={pIndex} 
                        className="text-slate-200 leading-relaxed" 
                        dangerouslySetInnerHTML={{ __html: renderContent(paragraph) }}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          {/* Back button at the bottom */}
          <button
            onClick={() => setSelectedArticle(null)}
            className="text-blue-400 hover:text-blue-300 flex items-center gap-2 mt-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux articles
          </button>
        </article>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">{title}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {articles.map((article) => (
          <button
            key={article.id}
            onClick={() => setSelectedArticle(article)}
            className="bg-slate-700 p-6 rounded-lg text-left hover:bg-slate-600 transition-colors"
          >
            <h3 className="text-xl font-bold mb-2">{article.title}</h3>
            <p className="text-blue-400 text-sm mb-4">{article.subtitle}</p>
            <p className="text-slate-300 line-clamp-3">{article.resume}</p>
          </button>
        ))}
      </div>
    </div>
  );
}