import React, { useState, useEffect } from 'react';
import { History, Users, Building2, Rocket, BookOpen } from 'lucide-react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import SearchBar from './shared/SearchBar';
import SearchResults from './SearchResults';
import Chronologies from './Chronologies';
import NonHumanSpecies from './NonHumanSpecies';
import Politics from './Politics';
import Technology from './Technology';
import Culture from './Culture';

interface CategoryComponentProps {
  onBack: () => void;
  selectedArticleId?: string | null;
}

const categories = [
  { 
    id: 'chronologies', 
    icon: History, 
    label: 'Chronologies',
    description: 'Histoire des civilisations jusqu\'en 2576',
    component: Chronologies as React.ComponentType<CategoryComponentProps>
  },
  { 
    id: 'species', 
    icon: Users, 
    label: 'Espèces non-humaines',
    description: 'Les Stranis, Tr\'Traris, Vada et Torks',
    component: NonHumanSpecies as React.ComponentType<CategoryComponentProps>
  },
  { 
    id: 'politics', 
    icon: Building2, 
    label: 'Politique',
    description: 'Organisations et structures politiques',
    component: Politics as React.ComponentType<CategoryComponentProps>
  },
  { 
    id: 'technology', 
    icon: Rocket, 
    label: 'Technologie',
    description: 'Avancées et systèmes technologiques',
    component: Technology as React.ComponentType<CategoryComponentProps>
  },
  { 
    id: 'culture', 
    icon: BookOpen, 
    label: 'Culture',
    description: 'Formation, langues et société',
    component: Culture as React.ComponentType<CategoryComponentProps>
  }
];

const EncyclopediaLayout: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (selectedArticleId) {
      setSelectedArticleId(null);
    } else if (selectedCategory) {
      setSelectedCategory(null);
      navigate('/encyclopedia');
    }
  };

  useEffect(() => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    if (pathParts[1] && pathParts[1] !== 'search') {
      setSelectedCategory(pathParts[1]);
      if (pathParts[2]) {
        setSelectedArticleId(pathParts[2]);
      }
    }
  }, [location]);

  const CategoryComponent = selectedCategory
    ? categories.find(cat => cat.id === selectedCategory)?.component
    : null;

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
                      selectedCategory === category.id 
                        ? 'bg-blue-600 text-white' 
                        : 'hover:bg-slate-700'
                    }`}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      navigate(`/encyclopedia/${category.id}`);
                    }}
                  >
                    <Icon className="w-5 h-5" />
                    <div>
                      <span className="block font-medium">{category.label}</span>
                      <span className={`text-sm ${
                        selectedCategory === category.id 
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
          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-extrabold text-blue-400 leading-normal">
              Encyclopédie Space Squad
            </h1>
            <SearchBar />
          </div>
        </div>

        <Routes>
          <Route
            path="search"
            element={<SearchResults />}
          />
          <Route
            path="*"
            element={
              CategoryComponent ? (
                <CategoryComponent
                  onBack={handleBack}
                  selectedArticleId={selectedArticleId}
                />
              ) : (
                <div className="prose prose-invert max-w-none">
                  <p className="text-lg text-slate-300">
                    Sélectionnez une catégorie pour afficher son contenu.
                  </p>
                </div>
              )
            }
          />
        </Routes>
      </main>
    </div>
  );
};

export default EncyclopediaLayout;