import React from 'react';
import { ArticleLayout } from './shared/ArticleLayout';
import { CategoryComponentProps } from './shared/types';

const Stardash: React.FC<CategoryComponentProps> = ({ onBack, selectedArticleId }) => {
  const articles = [
    {
      id: 'stardash-setting',
      title: 'Stardash',
      subtitle: 'Présentation du Stardash',
      resume: 'Découvrez le Stardash, la course spatiale légendaire.',
      sections: [
        {
          title: 'Présentation',
          content: [
            "Le Stardash est bien plus qu’une simple course spatiale — c’est une véritable institution interstellaire et un symbole de l’esprit pionnier des Starlancers.",
            "Diffusé dans toute la galaxie et suivi par des millions de spectateurs, cet événement incarne la maîtrise technologique, l’audace des pilotes et la beauté brute de l’espace."
          ]
        },
        {
          title: 'Histoire',
          content: [
            "La première édition du Stardash remonte à près de deux siècles.",
            "Peu après la fin de la guerre Tork, les progesses technologiques acquis durant cette période furent diffusés. <a href=\"#\" data-article=\"confederal-orgs\" class=\"text-blue-400 hover:text-blue-300\">Union</a> présenta alors ses derniers modèles de moteurs sur de petits engins monoplace.",
            "Ce qui était au départ une simple démonstration technologique s’est rapidement transformé en une compétition, attirant les meilleurs pilotes et les plus brillants ingénieurs.",
            "C'est en 2412 <a href=\"#\" data-article=\"galactic-calendar\" class=\"text-blue-400 hover:text-blue-300\">(c205)</a> qu'eu lieu la première course officielle de ces vaisseaux baptisés Stardash en raison des chocs occasionnés par les pilotes entre eux lors des courses antérieures."
          ]
        },
        {
          title: 'Règles',
          content: [
            "Les compétitions sont strictement réglementées :",
            "Vaisseaux Homologués : Seuls des modèles respectant les normes de sécurité peuvent participer.",
            "Neutralisation des Armes : Bien que les vaisseaux soient équipés de systèmes de défense, la seule \"arme\" autorisée reste la collision (avec usage des surcharges de boucliers éventuellement).",
            "Balises de Contrôle : Les pilotes doivent valider plusieurs points de contrôle disséminés sur le parcours.",
            "Temps et Stratégie : La victoire repose autant sur la rapidité que sur la gestion énergétique et la réduction des risques et des chocs.",
            "Tracé du parcours : Il n'y a pas d'ordre de priorité entre les balises à l'exception de la balise de départ qui sert également d'arrivée. Les pilotes doivent donc planifier eux-mêmes leur parcours avant et pendant la course.",
            "Consommables: L'utilisation de certains consommable est autorisée uniquement dans le cadre de la course (Boost, Survolteur, Azote liquide, etc.)."
          ]
        },
        {
          title: 'Environnements',
          content: [
            "Tous les circuits officiels se trouvent dans l'espace et généralement en orbite des colonies.",
            "Des obstacles (sous la forme de drones immobiles avec des boucliers surchargés) peuvent être placés sur le parcours.",
            "Leur emplacement ainsi que celui des balises changent d'une course à l'autre.", 
            " ",
            "En dehors des circuit officiels, il existent des compétitions underground pouvant faire courir les pilotes aussi bien dans l'espace encombré (asteroïdes, satellites, etc.) que dans l'espace libre.",
            "Mais également dans des environnements beaucoup plus dangereux pour les pilotes comme la haute atmospèhre d'une planète, ou bien même à la surface de ces dernières, engendrant moultes obstables et la gravité avec lesquels gérer.",
            "Cas à part: ",
            "Void Circuit: Il s'agit de la plus célèbre course underground utilisant des <a href=\"#\" data-article=\"gtv\" class=\"text-blue-400 hover:text-blue-300\">GTV</a> pour que la course se déroule sur plusieurs environnements à la fois.",
            "HyperSpeed: Une compétition officielle, mais en dehors du championnat utilisant des accélérateurs magnétiques pour propulser les vaisseaux."
          ],
        },
        {
          title: 'Popularité',
          content: [
           "Le Stardash attire chaque année des millions de spectateurs. Les parieurs affluent, les sponsors rivalisent pour équiper les meilleures équipes, et les retombées technologiques influencent même les industries civiles.",
           "Au-delà de la compétition, c’est une vitrine de l’ingéniosité humaine face à l’immensité de l’espace."
          ]
        },
        {
          title: 'Articles liés',
          content: [
            "<a href=\"#\" data-article=\"stardash-ecuries\" class=\"text-blue-400 hover:text-blue-300\">Ecuries</a>",
            "<a href=\"#\" data-article=\"championnat\" class=\"text-blue-400 hover:text-blue-300\">Championnat</a>",
            "<a href=\"#\" data-article=\"stardash-pilotes\" class=\"text-blue-400 hover:text-blue-300\">Pilotes célèbres</a>"
          ]
        }
      ]
    },
    {
      id: 'stardash-ecuries',
      title: 'Écuries',
      subtitle: 'Les plus grandes écuries de Stardash',
      resume: "Dans l'ombre des pilotes légendaires, les écuries sont les véritables architectes du succès au Stardash. Découvrez les rivalités, les technologies secrètes et les équipes les plus influentes de cette compétition interstellaire.",
      sections: [
        {
          title: 'Gestion des courses',
          content: [
            "Il est vite apparu qu'un pilote seul ne pouvait pas progresser bien loin dans un championnat, il falalit en plus de la gestion administrative avoir des compétences très poussé en mécanique.",
            "Les pilotes se sont alors entourés d'un personnel de haute technologie, d'ingénieurs et d'experts en securité spatiale pour gérer les courses.",
            "Ses regroupements ont étés officialisés par le Consortium sour l'appélation d'écuries.",
            "Les écuries comportent donc tout le personnel pour s'occuper de la gestion des courses, des véhicules (via un département ingénieurie), et du recrutement des pilotes.",
            "Pour des raisons administratives, seules les écuries peuvent inscrire des pilotes aux plus hauts niveaux du championnat. Pour autant, un pilote seul peut créer sa propre écurie et s'inscrire lui-même.",
          ]
        },
        {
          title: "Recrutement et Entrainement",
          content: [
            "Les recruteurs des plus grandes écuries scrutent les parcours d'entrainement des jeunes pilotes, ainsi que les premiers niveaux du championnat pour y repérer des talents.",
            "De leur coté, les pilotes savant que s'ils veulent atteindre les plus hauts niveaux du championnat, ils devront passer par une écurie.",
            "A la charge des écuries ensuite d'inscrire les pilotes à leur meilleur niveau de compétition afin de les faire progresser tout en assurant leur entrainement.",
            "Il est possible d'inscrire un pilote sur un niveau de championnat supérieur, mais si les résultats ne sont pas au rendez-vous, c'est l'écurie qui perdra des points."
          ]
        },
        {
          title: 'Les plus grandes écuries',
          content: [
            "Au plus haut niveau du championnat, il existe 6 écuries qui se distinguent par leurs performances et leur longévité à ce niveau:",
            "FF Aether Racing Team, ou plus simplement Aether, est l'actuelle tenante du titre des écuries depuis 3 cycles. Leur livrée est composée de blanc et de nuances de gris",
            "Azur Wings, c'est la plus ancienne des écuries encore en activité. Son livrée est composée de variantes de bleu",
            "Eclipse, avec des performances en baisse ces derniers temps, elle se démarque principalement par son utilisation peu conventionnel de ses moteurs. La livrée est verte et noire",
            "Spike & Géo, fondée par deux Starlancers, c'est à ce jour l'écurie avec le plus de titres de \"Meilleur Pilote\". La livrée est composée de rouge et de blanc",
            "Supernova, c'est ici que se trouve (soi-disant) les meilleurs ingénieurs, l'écurie avance pour preuve qu'elle n'a jamais subi la moindre avarie en compétition. Sa livrée est jaune",
            "Void Riders, amateurs de sensations fortes, c'est ici que se retrouve les pilotes les plus inventifs, plusieurs technique de pilotes aujourd'hui utilisés par tous ont vu le jour sous leur livrée de noir et violet"
          ]
        }
      ]    
    },
    {
      id: 'championnat',
      title: 'Championnat',
      subtitle: 'Organisation du Championnat Stardash',
      resume: "Le Championnat Stardash, l’apogée des courses spatiales, offre chaque cycle une lutte acharnée entre les meilleurs pilotes de la galaxie.",
    },
    {
      id: 'stardash-pilotes',
      title: 'Pilotes célèbres',
      subtitle: 'Les plus grands pilotes de Stardash',
      resume: 'Les pilotes du Stardash sont bien plus que de simples compétiteurs : ils incarnent des légendes vivantes défiant les lois de l’espace',
    }
  ];

  return (
    <ArticleLayout
      title="Stardash"
      articles={articles}
      selectedArticleId={selectedArticleId}
      onBack={onBack}
    />
  );
};

export default Stardash;
