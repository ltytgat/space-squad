import React from 'react';
import { ArrowLeft } from 'lucide-react';
import type { Character } from '../../types';

interface CharacterSheetProps {
  character: any;
  onBack: () => void;
  readOnly?: boolean;
}

export default function CharacterSheet({ character, onBack, readOnly = true }: CharacterSheetProps) {
  return (
    <div>
      <button
        onClick={onBack}
        className="mb-6 text-blue-400 hover:text-blue-300 flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à la liste
      </button>

      <div className="bg-slate-800 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Basic Info */}
          <section>
            <h2 className="text-xl font-bold mb-4">Informations de base</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400">Nom</label>
                <div className="mt-1 text-lg">{character.data.nom || '-'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400">Titre</label>
                <div className="mt-1">{character.data.titre || '-'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400">Rang</label>
                <div className="mt-1">{character.data.rang || '-'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400">Affiliation</label>
                <div className="mt-1">{character.data.affiliation || '-'}</div>
              </div>
            </div>
          </section>

          {/* Stats */}
          <section>
            <h2 className="text-xl font-bold mb-4">Caractéristiques</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400">Force</label>
                <div className="mt-1">{character.data.force || '0'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400">Habileté</label>
                <div className="mt-1">{character.data.habilite || '0'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400">Charisme</label>
                <div className="mt-1">{character.data.charisme || '0'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400">Intelligence</label>
                <div className="mt-1">{character.data.intelligence || '0'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400">Anticipation</label>
                <div className="mt-1">{character.data.anticipation || '0'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400">Perception</label>
                <div className="mt-1">{character.data.perception || '0'}</div>
              </div>
            </div>
          </section>

          {/* Combat */}
          <section>
            <h2 className="text-xl font-bold mb-4">Combat</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400">Points de Blessure</label>
                <div className="mt-1">{character.data.pointsDeBlessure || '0'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400">Protections</label>
                <div className="mt-1">{character.data.protections || '0'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400">Esquive</label>
                <div className="mt-1">{character.data.esquive || '0'}</div>
              </div>
            </div>
          </section>

          {/* Equipment */}
          <section>
            <h2 className="text-xl font-bold mb-4">Équipement</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400">Armement</label>
                <div className="mt-1 space-y-1">
                  <div>Principal: {character.data.armement?.principale || '-'}</div>
                  <div>Secondaire: {character.data.armement?.secondaire || '-'}</div>
                  <div>Arme lourde: {character.data.armement?.lourde || '-'}</div>
                  <div>Corps à corps: {character.data.armement?.cac || '-'}</div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400">Armure</label>
                <div className="mt-1 space-y-1">
                  <div>Tête: {character.data.armure?.tete || '-'}</div>
                  <div>Torse: {character.data.armure?.torse || '-'}</div>
                  <div>Bras: {character.data.armure?.bras || '-'}</div>
                  <div>Sac à dos: {character.data.armure?.backpack || '-'}</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}