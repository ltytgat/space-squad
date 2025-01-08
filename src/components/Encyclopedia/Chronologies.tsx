import React, { useState } from 'react';
import { Clock, ArrowLeft } from 'lucide-react';

type TimelineEvent = {
  year: string;
  event: string;
};

type TimelineType = 'human' | 'strani' | 'vada';

const timelineData = {
  human: [
    { year: "2050", event: "La limite des 2°C de la hausse des températures a pas été dépassé, celle-ci est montée à 4,2°C" },
    { year: "2051", event: "Selon les meilleures estimations, l'humanité sera condamnée d'ici un siècle, le projet ALCOR est lancé pour faire immigrer l'humanité" },
    { year: "2060", event: "Premier module de la station Alcor mis en orbite de Mars" },
    { year: "2061", event: "Deuxième module d'Alcor, des serveurs contenant l'encyclopédie humaine" },
    { year: "2065", event: "Pose des fondations de la première colonie martienne, New Gaïa" },
    { year: "2068", event: "Premiers humains à bord d'Alcor, mise en place de la voie de transit entre Alcor et New Gaïa" },
    { year: "2072", event: "Arrivée de la première arche contenant 10.000 personnes à New Gaïa" },
    { year: "2073", event: "Première récolte sur New Gaïa" },
    { year: "2075", event: "Début de la grande pandémie de Flutterite sur Terre, seuls les sujets seins sont aptes à la migration vers Mars" },
    { year: "2080", event: "La population humaine sur Terre atteint les 7 milliards, et 30.000 sur New Gaïa" },
    { year: "2084", event: "Alcor est terminée, des membres de différents gouvernements ont migré sur place" },
    { year: "2085", event: "Unification des gouvernements sur New Gaïa" },
    { year: "2090", event: "Instauration de la langue unique à l'école" },
    { year: "2094", event: "Mise au point du générateur de trou de ver (GTV)" },
    { year: "2095", event: "La distance Mars-Neptune est effectué en moins de 5 heures" },
    { year: "2097", event: "Création du Consortium des pilotes, début de l'exploration interstellaire" },
    { year: "2100", event: "Population sur Terre : 3 milliards, population sur Mars : 150.000, Alcor nommé Capitale de l'humanité" },
    { year: "2101", event: "Suite aux premières explorations, la lune de la Terre est renommé Séléné, le Soleil est renommé Hélios"},
    { year: "2113", event: "Le Code Civil d’Alcor (CCA) entre en vigueur"},
    { year: "2114", event: "Alcor et New Gaïa fondent l’Union Confédérale Humaine (UCH)"},
    { year: "2129", event: "Découverte de l’émetteur de champ de forces gravitationnelles (Boucliers)"},
    { year: "2151", event: "Population humaine sur Terre estimée à 0, population sur Mars : 675.000"},
    { year: "2153", event: "La Terre est classée comme planète « Hostile » à cause de son atmosphère toxique"},
    { year: "2184", event: "L’UCH est renommée, elle devient la « Confédération »"},
    { year: "2214", event: "Premier contact avec une race extra-terrestre, les Stranis, des émissaires sont envoyés de part et d’autre afin de briser la barrière de la langue"},
    { year: "2215", event: "Création de trois grandes organisations humaines : l’Alliance responsable des forces armées, la Guilde Marchande en charge des affaires économiques, et l’UCRS (Union des Centres de Recherches Spatiales) en charge de la recherche"},
    { year: "2217", event: "La langue des Stranis est décryptée, signature d’un traité d’échange commercial et instauration par la Guilde d’une monnaie commune, le Koni"},
    { year: "2219", event: "Première conférence galactique des poids et mesures, harmonisation des unités entre Humains et Stranis"},
    { year: "2220", event: "Cycle 0 du Calendrier Galactique"},
    { year: "2222", event: "La technologie des implants crâniens est fiable et performante"},
    { year: "2233", event: "Le Consortium s’étend aux Stranis"},
    { year: "2234", event: "Premier Strani à entrer au Consortium"},
    { year: "2242", event: "Fin de la terraformation de Mars"},
    { year: "2248", event: "Première colonie humaine hors du Système Hélios sur Hope I, l’UCRS devient l’Union Planétaire"},
    { year: "2250", event: "Création du Tribunal d’Alcor"},
    { year: "2286", event: "La population humaine atteint le milliard."},
    { year: "2295", event: "Première planète co-colonisé par l’Union et les Stranis"},
    { year: "2303", event: "Les pilotes sont maintenant formés aux techniques de combat d'infanterie"},
    { year: "2305", event: "Devant la polyvalence des pilotes, ces derniers sont renommés \"Starlancer\"."},
    { year: "2317", event: "Centenaire du premier traité Humano-Strani"},
    { year: "2325", event: "Dissolution du dernier parti politique de l’Union ouvertement anti-Stranis"},
    { year: "2352", event: "Découverte d’une nouvelle race extraterrestre nommée Torks"},
    { year: "2355", event: "A la vue de l’expansion des Torks, l’extermination totale est décrété par l’Alliance et les Stranis."},
    { year: "2356", event: "Les Stranis intègrent l’Alliance"},
    { year: "2368", event: "Fondation des Rebelles de Cerberi (anciennement faisant parti de l’Alliance)"},
    { year: "2370", event: "Après deux siècles de guerre, les Stranis déclarent le cessez-le-feu envers les Tr'Traris, race robotique rebelle occupant la planète mère des Stranis"},
    { year: "2397", event: "Les Torks ont été repoussés hors de l’espace colonisé, l’Union aura perdu 32 planètes durant la guerre"},
    { year: "2398", event: "Les Rebelles de Cerberi font sécession vis-à-vis de la Confédération"},
    { year: "2399", event: "Cerberi est une nation indépendante"},
    { year: "2400", event: "La population humaine dépasse à nouveau le milliard"},
    { year: "2421", event: "Première « frontière » commune entre la Confédération et les Stranis"},
    { year: "2456", event: "Centenaire de l’Alliance entre Humains et Stranis face aux Torks"},
    { year: "2486", event: "Découverte d’une nouvelle race extraterrestre dans un système isolé, la non-intervention est décrétée par l’Union. Les Vadas sont sous observation"},
    { year: "2490", event: "La langue des Vadas est décryptée par un Strani"},
    { year: "2510", event: "Des factions Tr'Tari indépendantes s’établissent sur des planètes \"Non viable\""},
    { year: "2514", event: "Première liaison commerciale entre la Guilde et une faction Tr'Tari"},
    { year: "2543", event: "Les Vadas explorent l’espace, l’Union et les Stranis décident de fonder un lieu de coopération inter-espèce sur une planète neutre, le Conseil Galactique est établi sur Matro IV, les Vadas sont invités à le rejoindre"},
    { year: "2544", event: "Les Vadas intègrent le Consortium"},
    { year: "2572", event: "Lancement du projet Ω par le conseil"},
    { year: "2576", event: "Aujourd’hui"}
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

function groupEventsByCentury(events: TimelineEvent[]) {
  return events.reduce((acc: { [key: string]: TimelineEvent[] }, event) => {
    const year = parseInt(event.year);
    let century;
    
    if (year < 0) {
      century = `${Math.floor(year / 1000) * -1}0000 av. JC`;
    } else {
      century = `${Math.floor(year / 100) + 1}ème siècle`;
    }
    
    if (!acc[century]) {
      acc[century] = [];
    }
    acc[century].push(event);
    return acc;
  }, {});
}

export default function Chronologies({ onBack }: { onBack: () => void }) {
  const [activeTimeline, setActiveTimeline] = useState<TimelineType>('human');

  const timelineTitles = {
    human: 'Chronologie Humaine',
    strani: 'Chronologie Strani',
    vada: 'Chronologie Vada'
  };

  const groupedEvents = groupEventsByCentury(timelineData[activeTimeline]);

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="text-blue-400 hover:text-blue-300 flex items-center gap-2 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour
      </button>

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
        <div className="space-y-12 relative">
          {Object.entries(groupedEvents).map(([century, events]) => (
            <div key={century} className="space-y-8">
              <h3 className="text-2xl font-bold text-blue-400 ml-12 mb-8">
                {century}
              </h3>
              {events.map((event, index) => (
                <div key={index} className="ml-12 relative">
                  <div className="absolute -left-12 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-blue-600 border-4 border-slate-800" />
                  <div className="bg-slate-700 p-4 rounded-lg">
                    <div className="text-blue-400 font-bold mb-1">{event.year}</div>
                    <div className="text-slate-200">{event.event}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}