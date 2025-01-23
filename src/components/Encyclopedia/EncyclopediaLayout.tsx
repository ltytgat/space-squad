import React, { useState, useEffect } from 'react';
import { History, Users, Building2, Rocket, BookOpen } from 'lucide-react';
import Chronologies from './Chronologies';
import NonHumanSpecies from './NonHumanSpecies';
import Politics from './Politics';
import Technology from './Technology';
import Culture from './Culture';

const categories = [
  { 
    id: 'chronologies', 
    icon: History, 
    label: 'Chronologies',
    description: 'Histoire des civilisations jusqu\'en 2576',
    component: Chronologies
  },
  { 
    id: 'species', 
    icon: Users, 
    label: 'Espèces non-humaines',
    description: 'Les Stranis, Tr\'Traris, Vada et Torks',
    component: NonHumanSpecies
  },
  { 
    id: 'politics', 
    icon: Building2, 
    label: 'Politique',
    description: 'Organisations et structures politiques',
    component: Politics
  },
  { 
    id: 'technology', 
    icon: Rocket, 
    label: 'Technologie',
    description: 'Avancées et systèmes technologiques',
    component: Technology
  },
  { 
    id: 'culture', 
    icon: BookOpen, 
    label: 'Culture',
    description: 'Formation, langues et société',
    component: Culture
  }
];

export default function EncyclopediaLayout() {
  const [activeCategory, setActiveCategory] = useState('chronologies');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);

  useEffect(() => {
    const handleNavigateToArticle = (event: CustomEvent<{ category: string; articleId: string }>) => {
      const { category, articleId } = event.detail;
      
      // First set the category
      setActiveCategory(category);
      
      // Then set the article ID after a small delay to ensure the category component is mounted
      // and its articles are available
      requestAnimationFrame(() => {
        setSelectedArticleId(articleId);
      });
    };

    // Add event listener
    window.addEventListener('navigateToArticle', handleNavigateToArticle as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('navigateToArticle', handleNavigateToArticle as EventListener);
    };
  }, []);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedArticleId(null); // Reset selected article
    setActiveCategory(categoryId);
  };

  const renderContent = () => {
    const category = categories.find(cat => cat.id === activeCategory);
    if (category) {
      const CategoryComponent = category.component;
      return (
        <CategoryComponent 
          onBack={() => handleCategoryChange(category.id)} 
          selectedArticleId={selectedArticleId} 
        />
      );
    }
    return (
      <div className="prose prose-invert max-w-none">
        <p className="text-lg text-slate-300">
          Sélectionnez une catégorie pour afficher son contenu.
        </p>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-4">
      {/* Sidebar */}
      <aside className="lg:col-span-1">
        <nav className="bg-slate-800 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4">Catégories</h2>
          <ul className="space-y-2">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <li key={category.id}>
                  <button 
                    className={`w-full flex items-center gap-3 p-2 rounded text-left hover:bg-slate-700 group ${
                      activeCategory === category.id 
                        ? 'bg-blue-600 text-white' 
                        : 'hover:bg-slate-700'
                    }`}
                    onClick={() => handleCategoryChange(category.id)}
                  >
                    <Icon className="w-5 h-5" />
                    <div>
                      <span className="block font-medium">{category.label}</span>
                      <span className={`text-sm ${
                        activeCategory === category.id 
                          ? 'text-blue-100' 
                          : 'text-slate-400 group-hover:text-slate-300'
                      }`}>
                        {category.description}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="lg:col-span-3 bg-slate-800 rounded-lg p-6">
        <div className="border-b border-slate-700 pb-4 mb-8">
          <h1 className="text-4xl font-extrabold text-blue-400 leading-normal">
            Encyclopédie Space Squad
          </h1>
        </div>
        {renderContent()}
      </main>
    </div>
  );
}