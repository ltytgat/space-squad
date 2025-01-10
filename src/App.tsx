import React from 'react';
import { Menu } from 'lucide-react';
import EncyclopediaLayout from './components/Encyclopedia/EncyclopediaLayout';

export default function App() {
  const [showEncyclopedia, setShowEncyclopedia] = React.useState(false);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Navigation */}
      <nav className="bg-slate-800 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <button 
            onClick={() => setShowEncyclopedia(false)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <img 
              src="/images/transparent.png" 
              alt="Space Squad Logo" 
              className="h-8 w-auto"
            />
          </button>
          <button className="p-2 hover:bg-slate-700 rounded">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto">
        {showEncyclopedia ? (
          <EncyclopediaLayout />
        ) : (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Encyclopedia Section */}
              <section className="bg-slate-800 p-6 rounded-lg">
                <h2 className="text-xl font-bold mb-4">Encyclopédie</h2>
                <p className="text-slate-300">
                  Accédez à l'univers et à la documentation du jeu.
                </p>
                <button 
                  className="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
                  onClick={() => setShowEncyclopedia(true)}
                >
                  Parcourir l'Encyclopédie
                </button>
              </section>

              {/* Character Management Section */}
              <section className="bg-slate-800 p-6 rounded-lg">
                <h2 className="text-xl font-bold mb-4">Gestion des Personnages</h2>
                <p className="text-slate-300">
                  Gérez vos personnages et vos sessions de jeu.
                </p>
                <button className="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
                  Accéder aux Personnages
                </button>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}