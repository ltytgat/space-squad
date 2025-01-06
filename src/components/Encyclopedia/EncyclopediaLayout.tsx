import React from 'react';
import { BookOpen, Users, Rocket, Shield, History } from 'lucide-react';

const categories = [
  { 
    id: 'chronologie', 
    icon: History, 
    label: 'Chronologie',
    description: 'L\'histoire de l\'humanité et des différentes races jusqu\'en 2576'
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
                  <button className="w-full flex items-center gap-3 p-2 hover:bg-slate-700 rounded text-left">
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
        <div className="prose prose-invert max-w-none">
          <p className="text-lg text-slate-300">
            Bienvenue dans l'encyclopédie officielle de Space Squad. Découvrez l'histoire, 
            les races et les factions qui façonnent cet univers en 2576.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <div key={category.id} className="bg-slate-700 p-4 rounded-lg hover:bg-slate-600 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="w-6 h-6 text-blue-400" />
                    <h2 className="text-xl font-bold">{category.label}</h2>
                  </div>
                  <p className="text-slate-300">
                    {category.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}