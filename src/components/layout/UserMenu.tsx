import React, { useState } from 'react';
import { Menu, LogIn, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase, signOut } from '../../lib/supabase';
import AuthModal from '../auth/AuthModal';

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState(supabase.auth.getUser());
  const navigate = useNavigate();

  supabase.auth.onAuthStateChange((event, session) => {
    setUser(session?.user || null);
  });

  const handleLogout = async () => {
    await signOut();
    setIsOpen(false);
    navigate('/');
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-slate-700 rounded"
        >
          <Menu className="w-6 h-6" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-md shadow-lg py-1 z-50">
            {user ? (
              <>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/characters');
                  }}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-700"
                >
                  <User className="w-4 h-4 inline-block mr-2" />
                  Gestion des personnages
                </button>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-700"
                >
                  <LogOut className="w-4 h-4 inline-block mr-2" />
                  Se déconnecter
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowAuthModal(true);
                }}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-700"
              >
                <LogIn className="w-4 h-4 inline-block mr-2" />
                Se connecter
              </button>
            )}
          </div>
        )}
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
}