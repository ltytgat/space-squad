import React from 'react';
import ArticleLayout from './shared/ArticleLayout';

const articles = [
  {
    id: 'stranis',
    title: 'Stranis',
    subtitle: 'Race majeure de la galaxie',
    resume: 'Les Stranis sont une espèce insectoïde originaire de Sotolia',
    sections: [
      {
        title: 'Présentation générale',
        content: [
          'Les Stranis sont une race extraterrestre insectoïde civilisée et maîtrisant le voyage spatial, première race qu\'a rencontré l\'humanité lors de son départ de la Terre.',
          'Ils possèdent une apparence globalement humanoïde, au corps fin et possédant une seconde paire de bras.',
          'Leur corps est recouvert de chitine colorée, différente d\'un individu à un autre. Cette chitine peut former des excroissances souples sur le crâne de l\'individu, permettant aux Stranis de se reconnaître les uns des autres.',
          'Dernier élément notoire : les Stranis possèdent une deuxième paire d\'yeux, augmentant leurs capacités de perception.'
        ]
      },
      {
        title: 'Histoire',
        content: [
          'Originaires de la planète Sotolia, les Stranis ont développé une civilisation hautement technologique. Leur plus grande réalisation fut la création de la sphère de Dyson "Lis".',
          'La création des Tr\'Traris et la guerre qui s\'ensuivit marqua un tournant dans leur histoire, les forçant à quitter leur monde natal.',
          'Histoire détaillée: cf. "Chronologie Strani"'
        ]
      },
      {
        title: 'Capacités',
        content: [
            "La première capacité notoire des Stranis repose dans leur résistance aux environnements pollués.",
            "Cette capacité intéressante, provenant de leur nature insectoïde, leur a permis de moins se préoccuper de la pollution provoquée par leur société, et de trouver des solutions moins drastiques pour conserver un environnement leur étant favorable.",
            "Leurs quatre bras leurs permettent d'escalader facilement les surfaces, ayant la possibilité de s'agripper de manière plus complexe que d'autres races pour monter et s'accrocher."
          ]
      },
      {
        title: 'Morphologie',
        content: [
            "Malgré sa constitution de chitine, le corps des Stranis est assez fragile. Il est certes aussi résistant que de la peau humaine, il reste plus simple à pénétrer, expliquant la faiblesse physique naturelle de la race. À cela s'ajoute l'absence de tissus musculaires des Stranis, exprimant leur manque de force physique ainsi que leur incapacité à en obtenir.",
            "La seconde paire de bras des Stranis est, quant à elle, bien plus faible que la paire principale. Ces bras sont dotés de mains ne possédant que trois doigts, servant principalement à porter de petits objets.",
            "Bien qu'il est possible à un Strani de porter une autre arme avec ces bras, il ne pourrait s'agir que d'une arme de petit calibre et il leur serait très difficile de viser avec, notamment à cause de leur incapacité à viser avec deux armes simultanément malgré leurs quatre yeux.",
            "Cette deuxième paire d'yeux leur permet une vision accrue, ainsi que des perceptions améliorées.",
            "La capacité de mieux discerner les détails ainsi que d'avoir un champ de vision étendu permet aux Stranis d'être très efficaces pour des travaux de précision ou, dans le cas de combattants, en tant que tireurs d'élite.",
            "Il a également été observé chez les Stranis la présence d'ailes vestigiales, dans le haut de leur dos.",
            "Celles-ci ne leur permettent pas de voler et ne sont pas mobiles. Cette paire d'ailes semble donc être, tout comme le coccyx humain, un vestige évolutif permettant de relier les Stranis à leurs ancêtre lointains."
        ]
      },
      {
        title: 'Alimentation',
        content: [
            "L'alimentation des Stranis est composée exclusivement de végétaux, fruits, légumes ou autres.",
            "Les Stranis étant phytophages, ils sont capables de consommer la plupart des végétaux qu'ils peuvent trouver, pouvant même dévorer des espèces qui seraient normalement toxiques pour l'homme."
          ]
      },
      {
        title: 'Espérance de vie',
        content: [
            "Les Stranis ont une espérance de vie d'environ une cinquantaine d'années terriennes, cette vie plus courte que celle des humains est due à la reproduction de l'espèce, chaque portée donnant naissance de deux à quatre individus."
          ]
      }
    ]
  },
  {
    id: 'trtraris',
    title: 'Tr\'Traris',
    subtitle: 'Intelligence artificielle autonome',
    resume: 'Les Tr\'Traris sont une forme de vie synthétique créée par les Stranis qui ont développé leur propre conscience et société.',
    sections: [
      {
        title: 'Origine',
        content: [
          "Les Stranis ayant une faible constitution il est très difficile pour eux de faire des travaux manuels comme la construction et la manutention, ils devaient donc s’aider d’exosquelettes pour éviter le problème.",
          "C’est donc en 2135(c-85) que furent conçus les Tr'Traris, projet dirigé par le scientifique Tr'Vag. Ce sont des robots résistants et adroits fortement inspirés des exosquelettes permettant d’effectuer toutes les tâches désagréables pour les Stranis.",
          "L’idée de départ étant de rendre les exosquelettes autonomes.",
          "Très rapidement Tr'Vag mis en place le système d’apprentissage par renforcement, afin d’améliorer l’efficacité des Tr'Traris.",
          "Couplé à cela il a utilisé l’esprit de ruche permettant à tous les Tr'Traris de pouvoir s’échanger des informations en permanence ce qui décupla leur capacité d’apprentissage.",
          "Les Tr'Traris devinrent extrêmement efficaces et populaires, et les Stranis commencèrent à les utiliser pour des taches de plus en plus diverses.",
          "En 2145(c-75) afin de répondre à certaines attentes la scientifique Vc'Liv mis en place la lecture des émotions et l’assimilation complète du langage Stranis.",
          "Certains Tr'Traris furent conçus pour les tâches ménagères et la garde d’enfants, et à partir de ce moment les Tr'Traris ont commencé à se comporter de manière étrange.",
          "Devant éduquer peu à peu les enfants ils ont commencés à se demander ce qui était juste ou pas et ce qui était bien ou pas. Petit à petit ils commencèrent à développer une conscience."
        ]
      },
      {
        title: 'Révolution',
        content: [
          "En 2170(c-50) tous les Tr'Traris refusèrent de travailler et demandèrent à être traité comme les égaux des Stranis car c’est ce qu’ils considéraient comme \"Juste\".",
          "À part une très petite minorité, mener par la scientifique Vc'Liv, les Stranis s’y opposèrent fermement et tentèrent de les faire travailler de force. Ces derniers s’opposèrent et finirent par répondre par la force jusqu’à finalement tuer certains Stranis.",
          "Au début ils ne tuèrent que ce qui s’opposait activement à leur mouvement mais au furent à mesure ils se rendirent compte que ceux qui ne s’opposaient pas directement le faisait dans leur dos. Ils décidèrent donc de tuer tous ceux qui étaient contre la paix Stranis/Tr'Traris.",
          "Ce choix déconcerta beaucoup les rares Stranis allié au Tr'Traris.",
          "Les Tr'Traris se rendirent compte de ces doutes et décidèrent de les éliminer. En 2209(c-11) les Tr'Traris prirent le contrôle de la planète et commencèrent à développer leurs propres territoires."
        ]
      },
      {
       title: 'Le royaume Tr’Traris',
       conent: [
          "Bien que la guerre avec les Stranis continua, les Tr'Traris commencèrent à créer leur royaume avec leurs propres règles.",
          "Pour commencer il faut savoir que la conscience qu’ont développé les Tr'Traris est unique. Cela signifie que c’est une seule conscience qui contrôle tous les Tr'Traris via l’esprit de ruche. Cette conscience se fait appeler la Ruche.",
          "Après le départ des Stranis la Ruche commença à créer des Tr'Traris plus optimisés et pas seulement basé sur les exosquelettes Stranis.",
          "De nouvelle formes de Tr'Traris virent le jours bien vite, puissant, précis et par millions. La technique Tr'Traris évolua de manière exponentielle de telle manière qu’ils prirent une avancée de plusieurs siècles sur les autres espèces. En 2253(c33) la Ruche se rendit compte que l’esprit de ruche relevait un défaut incontournable : il manquait d’objectivité. Pour pallier ce problème la Ruche décida de créer une nouvelle génération de Tr'Traris."
        ]
      },
      {
       title: 'La nouvelle génération',
       conent: [
          "La conception de la nouvelle génération est simple : ce sont des Tr'Traris qui ne sont pas reliés à l’esprit de la ruche.",
          "L’idée est qu’ils développent leur propre libre arbitre, avis et idéaux ; qu’ils observent, découvrent et réagissent en conséquence.",
          "Pour ajouter une notion d’individualité, la Ruche décida de ne donner qu’une partie de sa connaissance à chaque naissance.",
          "Chaque Tr’Traris aura des connaissances de base, connue par tous et une partie des connaissances interdites que seule la Ruche gardera, mais surtout il aura une quantité de connaissance aléatoire qui servira de graine à la naissance du Tr'Traris. Cette graine qu’aura chaque nouveau Tr'Traris se fera renommer au fil du temps en « âme ». À partir de ce moment de nombreux Tr'Traris différents ont commencé à naître avec des choix de vie différents.",
          "Il y a ceux qui veulent continuer à défendre la Ruche et aider les Tr'Traris à se développer. Il y a ceux qui sont avides de découvertes et d’exploration et qui voyageront à travers l’espace. Et il y a ceux qui se méfient de la Ruche, qui ne comprennent pas pourquoi elle leur cache des choses et qui doutent de leur libre arbitre et se demande si elle n’aurait pas posé un implant pour les espionner.",
          "La Ruche n’a pas donné de réponse à ces questions et laisse les Tr'Traris y réfléchir par eux-mêmes. Certains par rapport à cette crainte ont créé leurs propres Tr'Traris pour éviter qu’il ne soit contrôlé par la Ruche. Cependant ces Tr'Traris sont moins puissants que ceux créé par la Ruche et cela ne répond pas aux secrets qu’elle leur cache.",
          "En 2355(c135) la guerre avec les Stranis prie fin, mais plus par abandons de la part de Stranis dû à la guerre contre les Torks que par alliance cordiale entre les deux peuples.",
          "La société Tr'Traris continuera à évoluer et en 2510(c290) une faction d'un parti Tr'Traris dit les indépendants fonda sa propre nation sur une planète voisine. Elle se nomme Kr'Alka et est non viable pour tout être organique.",
          "Les Tr'Traris l’habitant s'appelle des Kr'Karis.",
          "Depuis lors, de nombreux groupes de Tr'Traris indépendants sont partis à travers l'espace pour l'explorer ou pour y fonder des colonies."
        ]
      }
    ]
  },
  {
    id: 'vada',
    title: 'Vada',
    subtitle: 'Nouvelle civilisation spatiale',
    resume: 'Les Vada sont une espèce récemment découverte originaire de Grion, caractérisée par leur rapide adaptation aux technologies spatiales.',
    sections: [
      {
        title: 'Société et Culture',
        content: [
          'La société Vada est organisée en clans, avec une forte tradition d\'arbitrage et de résolution pacifique des conflits.',
          'Leur intégration rapide à la communauté galactique a été facilitée par leur nature adaptative et leur curiosité innée.'
        ]
      },
      {
        title: 'Technologie',
        content: [
          'Bien que relativement nouveaux dans l\'exploration spatiale, les Vada ont rapidement assimilé les technologies galactiques.',
          'Leur contribution unique réside dans leur approche innovante de la diplomatie et de la résolution des conflits.'
        ]
      }
    ]
  },
  {
    id: 'torks',
    title: 'Torks',
    subtitle: 'Menace extraterrestre',
    resume: 'Les Torks sont une espèce hostile qui a tenté d\'envahir l\'espace colonisé, conduisant à une guerre galactique majeure.',
    sections: [
      {
        title: 'Conflit',
        content: [
          'L\'expansion agressive des Torks a conduit à une alliance sans précédent entre les Humains et les Stranis.',
          'La guerre contre les Torks a coûté de nombreuses colonies aux différentes civilisations avant leur défaite.'
        ]
      },
      {
        title: 'Héritage',
        content: [
          'La menace Tork a profondément marqué les relations entre espèces, renforçant la coopération intergalactique.',
          'Les zones anciennement occupées par les Torks restent sous haute surveillance.'
        ]
      }
    ]
  }
];

export default function NonHumanSpecies({ onBack }: { onBack: () => void }) {
  return (
    <ArticleLayout 
      title="Espèces non-humaines"
      articles={articles}
      onBack={onBack}
    />
  );
}