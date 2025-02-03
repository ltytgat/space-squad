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
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Encyclopedia</h1>
          <SearchBar />
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedCategory(category.id);
                        navigate(`/encyclopedia/${category.id}`);
                      }}
                      className="p-6 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center mb-4">
                        <category.icon className="w-6 h-6 text-blue-400 mr-2" />
                        <h2 className="text-xl font-semibold text-white">{category.label}</h2>
                      </div>
                      <p className="text-gray-400">{category.description}</p>
                    </button>
                  ))}
                </div>
              )
            }
          />
        </Routes>
      </div>
    </div>
  );
};

export default EncyclopediaLayout;