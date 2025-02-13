import React, { useEffect, useState } from 'react';
import { Plus, Users, User } from 'lucide-react';
import { getCharacters, getGroups } from '../../lib/supabase';
import type { Character } from '../../types';

interface CharacterListProps {
  onCreateNew: () => void;
  onSelect: (character: any) => void;
}

export default function CharacterList({ onCreateNew, onSelect }: CharacterListProps) {
  const [characters, setCharacters] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: charactersData, error: charactersError } = await getCharacters();
        const { data: groupsData, error: groupsError } = await getGroups();

        if (charactersError) throw charactersError;
        if (groupsError) throw groupsError;

        setCharacters(charactersData || []);
        setGroups(groupsData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load characters');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading characters...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-red-500">
        {error}
      </div>
    );
  }

  const personalCharacters = characters.filter(char => !char.group_id && char.is_template);
  const groupCharacters = characters.filter(char => char.group_id);

  return (
    <div className="space-y-8">
      {/* Personal Characters */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <User className="w-5 h-5" />
            Mes personnages
          </h2>
          <button
            onClick={onCreateNew}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouveau personnage
          </button>
        </div>

        {personalCharacters.length === 0 ? (
          <div className="bg-slate-800 rounded-lg p-6 text-center">
            <p className="text-gray-400">Vous n'avez pas encore de personnage</p>
            <button
              onClick={onCreateNew}
              className="mt-4 text-blue-400 hover:text-blue-300"
            >
              Créer mon premier personnage
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {personalCharacters.map(character => (
              <button
                key={character.id}
                onClick={() => onSelect(character)}
                className="bg-slate-800 p-6 rounded-lg text-left hover:bg-slate-700 transition-colors"
              >
                <h3 className="font-bold text-lg mb-2">
                  {character.data.nom || 'Sans nom'}
                </h3>
                <p className="text-gray-400 text-sm">
                  {character.data.titre || 'Aucun titre'} • {character.data.rang || 'Aucun rang'}
                </p>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Group Characters */}
      <section>
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <Users className="w-5 h-5" />
          Personnages de groupe
        </h2>

        {groupCharacters.length === 0 ? (
          <div className="bg-slate-800 rounded-lg p-6 text-center">
            <p className="text-gray-400">Aucun personnage de groupe</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupCharacters.map(character => {
              const group = groups.find(g => g.id === character.group_id);
              return (
                <button
                  key={character.id}
                  onClick={() => onSelect(character)}
                  className="bg-slate-800 p-6 rounded-lg text-left hover:bg-slate-700 transition-colors"
                >
                  <h3 className="font-bold text-lg mb-2">
                    {character.data.nom || 'Sans nom'}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {character.data.titre || 'Aucun titre'} • {character.data.rang || 'Aucun rang'}
                  </p>
                  {group && (
                    <p className="text-sm text-blue-400 mt-2">
                      Groupe: {group.name}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}