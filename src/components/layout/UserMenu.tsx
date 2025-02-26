import React from 'react';
import { LogIn, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase, signOut } from '../../lib/supabase';
import AuthModal from '../auth/AuthModal';

interface UserMenuProps {
  onShowAuth: () => void;
}

export default function UserMenu({ onShowAuth }: UserMenuProps) {
  const [user, setUser] = React.useState(supabase.auth.getUser());
  const navigate = useNavigate();

  React.useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (event === 'SIGNED_IN') {
        navigate('/characters');
      }
    });
  }, [navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (user) {
    return (
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-700 rounded"
      >
        <LogOut className="w-4 h-4" />
        Se déconnecter
      </button>
    );
  }

  return (
    <button
      onClick={onShowAuth}
      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-700 rounded"
    >
      <LogIn className="w-4 h-4" />
      Se connecter
    </button>
  );
}