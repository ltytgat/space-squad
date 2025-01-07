import React, { useState } from 'react';
import { Clock } from 'lucide-react';

type TimelineEvent = {
  year: string;
  event: string;
};

const timelineData = {
  human: [
    { year: "1969", event: "Premier pas sur la Lune" },
    { year: "2025", event: "Première base lunaire permanente" },
    { year: "2045", event: "Premier homme sur Mars" },
    { year: "2122", event: "Découverte du premier artefact Vada" },
    { year: "2156", event: "Premier contact avec les Strani" },
    { year: "2198", event: "Création de la Fédération Terrienne" },
    { year: "2576", event: "Époque actuelle" }
  ],
  strani: [
    { year: "1526", event: "Unification des clans Strani" },
    { year: "1892", event: "Découverte de la propulsion FTL" },
    { year: "1945", event: "Premier contact avec les Vada" },
    { year: "2156", event: "Premier contact avec les Humains" },
    { year: "2576", event: "Époque actuelle" }
  ],
  vada: [
    { year: "-50000", event: "Apogée de l'Empire Vada" },
    { year: "-45000", event: "Guerre contre les Anciens" },
    { year: "-44980", event: "Disparition des Vada" },
    { year: "2122", event: "Redécouverte par les Humains" },
    { year: "2576", event: "Vestiges toujours étudiés" }
  ]
};

type TimelineType = 'human' | 'strani' | 'vada';

export default function Chronologies() {
  const [activeTimeline, setActiveTimeline] = useState<TimelineType>('human');

  const timelineTitles = {
    human: 'Chronologie Humaine',
    strani: 'Chronologie Strani',
    vada: 'Chronologie Vada'
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 mb-6">
        {Object.entries(timelineTitles).map(([key, title]) => (
          <button
            key={key}
            onClick={() => setActiveTimeline(key as TimelineType)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              activeTimeline === key 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-700 hover:bg-slate-600'
            }`}
          >
            <Clock className="w-4 h-4" />
            {title}
          </button>
        ))}
      </div>

      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-blue-600" />
        
        <div className="space-y-8 relative">
          {timelineData[activeTimeline].map((event, index) => (
            <div key={index} className="ml-12 relative">
              <div className="absolute -left-12 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-blue-600 border-4 border-slate-800" />
              <div className="bg-slate-700 p-4 rounded-lg">
                <div className="text-blue-400 font-bold mb-1">{event.year}</div>
                <div className="text-slate-200">{event.event}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}