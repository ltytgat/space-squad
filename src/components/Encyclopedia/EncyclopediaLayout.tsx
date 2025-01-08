import React, { useState } from 'react';
import { BookOpen, Users, Rocket, Shield, History, Building2, Globe2, Scroll, GraduationCap } from 'lucide-react';
import Chronologies from './Chronologies';

const categories = [
  { 
    id: 'chronologies', 
    icon: History, 
    label: 'Chronologies',
    description: 'Les chronologies des différentes civilisations jusqu\'en 2576'
  },
  { 
    id: 'civilisations', 
    icon: Globe2, 
    label: 'Civilisations',
    description: 'Les Stranis, Tr\'Traris et autres espèces intelligentes'
  },
  { 
    id: 'politique', 
    icon: Building2, 
    label: 'Politique',
    description: 'Le Conseil Galactique, la Confédération et les organisations'
  },
  { 
    id: 'societe', 
    icon: Users, 
    label: 'Société',
    description: 'Langues, distinctions, grades et politique des colonies'
  },
  { 
    id: 'technologie', 
    icon: Rocket, 
    label: 'Technologie',
    description: 'GTV, boucliers, communications et vaisseaux'
  },
  { 
    id: 'carriere', 
    icon: GraduationCap, 
    label: 'Carrière',
    description: 'Formation de pilote et divisions'
  },
  { 
    id: 'juridique', 
    icon: Scroll, 
    label: 'Juridique',
    description: 'Tribunal d\'Alcor et usage des armes'
  }
];

export default function EncyclopediaLayout() {
  const [activeCategory, setActiveCategory] = useState('chronologies');

  const renderContent = () => {
    switch (activeCategory) {
      case 'chronologies':
        return <Chronologies onBack={() => setActiveCategory('chronologies')} />;
      default:
        return (
          <div className="prose prose-invert max-w-none">
            <p className="text-lg text-slate-300">
              Sélectionnez une catégorie pour afficher son contenu.
            </p>
          </div>
        );
    }
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
                    onClick={() => setActiveCategory(category.id)}
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
        <h1 className="text-2xl font-bold mb-6">Encyclopédie Space Squad</h1>
        {renderContent()}
      </main>
    </div>
  );
}