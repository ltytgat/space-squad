import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  subtitle: string;
  content: string;
}

interface ArticleLayoutProps {
  title: string;
  articles: Article[];
  onBack: () => void;
}

export default function ArticleLayout({ title, articles, onBack }: ArticleLayoutProps) {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  if (selectedArticle) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedArticle(null)}
          className="text-blue-400 hover:text-blue-300 flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux articles
        </button>

        <article className="prose prose-invert max-w-none">
          <h1 className="text-3xl font-bold text-white mb-2">{selectedArticle.title}</h1>
          <h2 className="text-xl text-blue-400 mb-6">{selectedArticle.subtitle}</h2>
          <div className="text-slate-200">
            {selectedArticle.content}
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="text-blue-400 hover:text-blue-300 flex items-center gap-2 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour
      </button>

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
            <p className="text-slate-300 line-clamp-3">{article.content}</p>
          </button>
        ))}
      </div>
    </div>
  );
}