import React from 'react';
import ArticleLayout from './shared/ArticleLayout';

const articles = [
  {
    id: 'shields',
    title: 'Boucliers',
    subtitle: 'Protection énergétique',
    resume: 'Les boucliers sont des champs de force qui protègent les vaisseaux et les installations, une technologie fondamentale pour la survie dans l\'espace.',
    sections: [
      {
        title: 'Histoire',
        content: [
          "À la fin du 21eme siècle, le Consortium est confronté à un problème de taille à cause des débris, les vaisseaux vont à une telle vitesse que le moindre débris entraîne des dégâts très importants. Pour pallier le problème, des blindages renforcés sont mis au point, mais leur poids devient une autre source de problèmes, entraînant une consommation excessive sur les générateurs.",
          "En 2129 (c-85), une nouvelle technologie apparaît, un émetteur de champs de forces gravitationnelles. Ce dernier est capable de créer une surface déviant les projectiles dans une certaine limite, cette technologie sera appelée \"Boucliers cinétiques\", puis abrégé en \"Boucliers\" par la suite."
        ]
      },
      {
        title: "L’évolution des technologies",
        content: [
          "Les premiers prototypes d’émetteurs de champs de forces gravitationnelles permettaient de créer une surface de quelques centimètres carrés pouvant dévier de petits projectiles à faible vitesse.",
          "Il faudra attendre 8 ans avant d’avoir un modèle capable de projeter une surface sur plus de 10m² et capable de suivre le fuselage d’un vaisseau.",
          "En 2132 (c-82), les vaisseaux sont équipés de boucliers, un émetteur pour l’avant et un pour l’arrière.",
          "Même si techniquement il serait possible de couvrir tout un vaisseau avec un seul émetteur, la répartition de puissance le rendrait pratiquement inutile.",
          "A partir de cet instant, les voyages spatiaux n’engendrent plus de dommages sur les blindages des vaisseaux qui peuvent retirer leurs blindages superflus.",
          "C’est en 2195 (c-23) que la technologie des boucliers sera miniaturisée pour être intégrés dans des pièces d’armure.",
          "Puis en 2254 (c32), grâce aux théories du scientifique <a href=\"#\" data-article=\"stranis\" class=\"text-blue-400 hover:text-blue-300\">Strani</a> Kl’Tras, les boucliers d’armures pourront être harmonisés en un seul champ de forces là où ils étaient tous indépendants par avant.",
          "Enfin, en 2321 (c95), les boucliers deviennent capables de dévier des projectiles énergétiques.",
          "Depuis, les boucliers ont peu changé dans leur fonctionnement, les seules évolutions concernent leur consommation et leur efficacité."
        ]
      },
      {
        title: "Fonctionnement",
        content: [
          "Les boucliers, qu’ils soient sur des vaisseaux ou des armures fonctionnent sur le même principe.",
          "Un émetteur crée un champ de forces gravitationnelles qui prend la forme de son support. Soit le fuselage d’un vaisseau, soit le membre sur lequel se trouve la pièce d’armure.",
          "Dans le cas d’une armure, s’il y a plusieurs champs de forces proches les uns des autres, il vont se réorganiser pour former une sorte de cocon qui va englober toutes les zones émettrices.",
          "Ces champs de forces sont toujours formés avec une forme de courbe.",
          "Lorsqu’un projectile arrive sur un champ de forces, ce dernier réagi différemment selon s’il s’agit d’un projectile thermique ou physique.",
          "Dans le premier cas, la chaleur est déviée par la force du champ dans toutes les directions en dehors du point d’impact, la dépense en énergie est importante pour le bouclier.",
          "Autrement, en cas de projectile physique, ce dernier va entrer en collision avec une force cinétique. Le bouclier va chercher à faire \"glisser\" le projectile en déviant son vecteur d’approche le long de la courbe du champ.",
          "La dépense énergétique du bouclier reste minime mais dépend de la taille du projectile, si ce dernier est trop gros, le bouclier ne pourra rien faire.",
          "De même, en cas de projectile à très haute vélocité (proche de la vitesse lumière), le bouclier peut ne pas avoir le temps de reformer le champ de forces et donc laisser une ouverture pouvant (si elle est trop importante) détruire complètement ce dernier."
        ]
      },
      {
        title: "Usage",
        content: [
          "Aujourd’hui, les boucliers font partie du quotidien des Starlancer, aussi bien sur leurs vaisseaux que leurs combinaisons.",
          "Ils ne sont cependant pas infaillibles et s’ils sont mal utilisés peuvent mener à des catastrophes.",
          " ",
          "Extrait du \"Manuel de formation\" des starlancers du Consortium (Éditions 332) sur le chapitre dédié aux boucliers :",
          "« Rappel : Les boucliers peuvent dévier les projectiles thermiques au prix d’une consommation importante d’énergie.",
          "Un bouclier ne peut dévier un projectile plus important que la surface de son champ de forces ou si un projectile subit un autre vecteur de poussée durant sa déviation (ex : armes de mêlée).",
          "Un projectile à vitesse lumière peut engendrer la destruction complète d’un champ de forces gravitationnelles.",
          "Attention aux conditions météorologiques, les gouttes de pluie sont des projectiles et affaibliront votre bouclier personnel. »"
        ]
      },
    ]
  },
  {
    id: 'gtv',
    title: 'Générateur de Trou de Ver (GTV)',
    subtitle: 'Voyage spatial',
    resume: 'Le GTV permet le voyage rapide entre des points éloignés de l\'espace, révolutionnant l\'exploration et le commerce galactique.',
    sections: [
      {
        title: 'Principe',
        content: [
          'Le GTV crée un passage artificiel à travers l\'espace-temps, permettant des voyages quasi-instantanés sur de grandes distances.',
          'La technologie repose sur la manipulation précise de champs gravitationnels et quantiques.'
        ]
      },
      {
        title: 'Impact',
        content: [
          'L\'invention du GTV a transformé la société galactique, rendant possible l\'établissement d\'une civilisation véritablement interstellaire.',
          'Le Consortium des pilotes régule strictement l\'utilisation des GTV pour garantir la sécurité des voyages.'
        ]
      }
    ]
  },
  {
    id: 'communications',
    title: 'Communications',
    subtitle: 'Balises & Voyage',
    resume: 'Les balises de communication permettent les échanges entre les différents systèmes stellaires.',
    sections: [
      {
        title: 'Histoire',
        content: [
          "En 2240 (c19), le projet Hope I est lancé, il s’agit là de l’établissement de la première colonie en dehors du système Hélios.",
          "Lors de son élaboration, un problème de taille est mis sur la table, les moyens de communication.",
          "En effet, pour communiquer entre deux systèmes, l’usage de signaux « classiques », comme la lumière, n’est pas possible.",
          "Il devient donc nécessaire d’utiliser des vaisseaux pour transférer les informations d’un système à l’autre.",
          "Les <a href=\"#\" data-article=\"stranis\" class=\"text-blue-400 hover:text-blue-300\">Stranis</a> utilisaient à cette époque les convois marchands pour le transfert de données, ils étaient suffisamment nombreux pour permettre des échanges relativement efficaces.",
          "En 2244 (c22), le premier prototype de balise de communication est mis au point.",
          "Les phases d’essais sont très encourageantes.",
          "En 2310 (c84), les Stranis adoptent le système des balises et raccordent leur réseau à celui de la Confédération."
        ]
      },
      {
        title: 'Les balises',
        content: [
          "Chaque système comportant une construction possède une balise de communication.",
          "Elle a pour fonction de réguler les trafics des vaisseaux et le transfert des informations vers les systèmes voisins.",
          "Chaque balise de chaque système communique avec ses voisines, chaque secteur possède une balise « Maître » qui centralise certaines informations des systèmes sous son contrôle.",
          "Les balises Maître font remonter ces données aux balises serveurs qui supervisent plusieurs secteurs, et si besoin, renvoi les informations vers les serveurs centraux utiles (<a href=\"#\" data-article=\"alcor\" class=\"text-blue-400 hover:text-blue-300\">Alcor</a>, Conseil Galactique, etc.).",
          "Ce système possède une certaine latence, latence d’autant plus importante que l’information a besoin de remonter haut dans la hiérarchie.",
          "C’est l’Union qui a la charge de la maintenance et des mises à jour des balises.",
          "Et l’Alliance qui s’occupe de la protection et de la surveillance."
        ]
      },
      {
        title: 'Fonctionnement',
        content: [
          "Les balises ont une forme ellipsoïde, elles contiennent 3 parties, la partie supérieure sert à la réception, l’inférieur à l’envoi, et la centrale au stockage.",
          "Qu’elles soient simples, Maître, ou serveurs, seule la taille les différencie.",
          "La zone d’envoi comporte une certaine quantité de drones autonomes.",
          "Ces drones (de la taille d’un Homme), sont équipés d’un espace de stockage de données.",
          "La balise envoie ces drones aux systèmes voisins (un par système) afin de rependre les informations.",
          "De même, elle reçoit les drones des autres systèmes qui arrive dans la zone supérieure. Ils sont récupérés, la balise fait le plein de carburant, et récupère les informations.",
          "Les drones passent ensuite dans la section inférieure pour être réutilisés.",
          "Les données sont transmises aux zones locales par ondes radios.",
          "Afin d’éviter un usage trop important du GTV des balises, les drones sont envoyés à intervalle de temps régulier (sauf en cas d’urgence).",
          "La partie centrale traite les données pour les communiquer aux bons systèmes.",
          "Elle s’occupe aussi de la régulation du trafic, lorsqu’un vaisseau (ou drone) est en approche du système, la balise va lui communiquer les coordonnées de sortie de l’hyperespace de sorte à ne pas gêner le trafic des drones.",
          "Enfin, sur les deux sommets de la balise se trouvent deux canons automatiques qui servent à détruire les débris proches, et à dissuader (en plus des forces locales de l’Alliance) ceux qui voudraient s’en prendre aux drones."
        ]
      }
    ]
  }
];

export default function Technology({ onBack, selectedArticleId }: { onBack: () => void, selectedArticleId?: string | null }) {
  return (
    <ArticleLayout 
      title="Technologie"
      articles={articles}
      onBack={onBack}
      selectedArticleId={selectedArticleId}
    />
  );
}