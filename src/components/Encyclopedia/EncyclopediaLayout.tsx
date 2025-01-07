import React, { useState } from 'react';
import { BookOpen, Users, Rocket, Shield, History } from 'lucide-react';
import Chronologies from './Chronologies';

const categories = [
  { 
    id: 'chronologies', 
    icon: History, 
    label: 'Chronologies',
    description: 'Les chronologies des différentes civilisations jusqu\'en 2576'
  },
  { 
    id: 'races', 
    icon: BookOpen, 
    label: 'Races',
    description: 'Les différentes espèces qui peuplent l\'univers connu'
  },
  { 
    id: 'factions', 
    icon: Users, 
    label: 'Factions',
    description: 'Les organisations majeures qui façonnent la galaxie'
  },
  { 
    id: 'vaisseaux', 
    icon: Rocket, 
    label: 'Vaisseaux',
    description: 'Les différents vaisseaux connus dans l\'univers'
  },
  { 
    id: 'equipement', 
    icon: Shield, 
    label: 'Équipement',
    description: 'Technologies et équipements notables'
  }
];

export default function EncyclopediaLayout() {
  const [activeCategory, setActiveCategory] = useState('chronologies');

  const renderContent = () => {
    switch (activeCategory) {
      case 'chronologies':
        return <Chronologies />;
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
                    className={`w-full flex items-center gap-3 p-2 rounded text-left ${
                      activeCategory === category.id 
                        ? 'bg-blue-600 text-white' 
                        : 'hover:bg-slate-700'
                    }`}
                    onClick={() => setActiveCategory(category.id)}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{category.label}</span>
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