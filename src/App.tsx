import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import UserMenu from './components/layout/UserMenu';
import EncyclopediaLayout from './components/Encyclopedia/EncyclopediaLayout';
import ScrollToTop from './components/shared/ScrollToTop';

export default function App() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Navigation */}
      <nav className="bg-slate-800 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <img 
              src="/images/transparent.png" 
              alt="Space Squad Logo" 
              className="h-8 w-auto"
            />
          </button>
          <UserMenu />
        </div>
      </nav>

      {/* Main Content */}
      <Routes>
        <Route 
          path="/encyclopedia/*" 
          element={<EncyclopediaLayout />} 
        />
        <Route
          path="/"
          element={
            <main className="container mx-auto">
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
                      onClick={() => navigate('/encyclopedia')}
                    >
                      Parcourir l'Encyclopédie
                    </button>
                  </section>

                  {/* Character Management Section */}
                  <section className="bg-slate-800 p-6 rounded-lg">
                    <h2 className="text-xl font-bold mb-4">Gestion des personnages</h2>
                    <p className="text-slate-300">
                      Créez et gérez vos personnages de jeu.
                    </p>
                    <button 
                      onClick={() => navigate('/characters')}
                      className="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
                    >
                      Accéder aux personnages
                    </button>
                  </section>
                </div>
              </div>
            </main>
          }
        />
      </Routes>

      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
}