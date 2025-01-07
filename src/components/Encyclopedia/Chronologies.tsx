import React, { useState } from 'react';
import { Clock } from 'lucide-react';

type TimelineEvent = {
  year: string;
  event: string;
};

const timelineData = {
  human: [
    { year: "2050", event: "La limite des 2°C de la hausse des températures a pas été dépassé, celle-ci est montée à 4,2°C" },
    { year: "2051 ", event: "Selon les meilleures estimations, l’humanité sera condamnée d’ici un siècle, le projet ALCOR est lancé pour faire immigrer l’humanité" },
    { year: "2060 ", event: "Premier module de la station Alcor mis en orbite de Mars" },
    { year: "2061 ", event: "Deuxième module d’Alcor, des serveurs contenant l’encyclopédie humaine" },
    { year: "2065 ", event: "Pose des fondations de la première colonie martienne, New Gaïa" },
    { year: "2068 ", event: "Premiers humains à bord d’Alcor, mise en place de la voie de transit entre Alcor et New Gaïa" },
    { year: "2072 ", event: "Arrivée de la première arche contenant 10.000 personnes à New Gaïa" },
    { year: "2073 ", event: "Première récolte sur New Gaïa" },
    { year: "2075 ", event: "Début de la grande pandémie de Flutterite sur Terre, seuls les sujets seins sont aptes à la migration vers Mars" },
    { year: "2080 ", event: "La population humaine sur Terre atteint les 7 milliards, et 30.000 sur New Gaïa" },
    { year: "2084 ", event: "Alcor est terminée, des membres de différents gouvernements ont migré sur place" },
    { year: "2085 ", event: "Unification des gouvernements sur New Gaïa" },
    { year: "2090 ", event: "Instauration de la langue unique à l’école" },
    { year: "2094 ", event: "Mise au point du générateur de trou de ver (GTV)" },
    { year: "2095 ", event: "La distance Mars-Neptune est effectué en moins de 5 heures" },
    { year: "2097 ", event: "Création du Consortium des pilotes, début de l’exploration interstellaire" },
    { year: "2100 ", event: "Population sur Terre : 3 milliards, population sur Mars : 150.000, Alcor nommé Capitale de l’humanité" }
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
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${activeTimeline === key
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