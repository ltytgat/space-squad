export interface Character {
  id: string;
  nom: string;
  sexe: string;
  origine: string;
  rang: string;
  titre: string;
  affiliation: string;
  pointsDeRang: number;
  konis: number;
  pointsDeBlessure: number; // PB
  vaisseau: string;
  // Caractéristiques
  force: number;
  habilite: number;
  charisme: number;
  intelligence: number;
  anticipation: number;
  perception: number;
  // Combat
  protections: number;
  esquive: number;
  pointsDeCompetences: number;
  // Modifiable par le joueur
  inventaire: string[];
  armement: {
    principale: string;
    secondaire: string;
    lourde: string;
    cac: string; // Corps à Corps
  };
  consommables: string[];
  armure: {
    tete: string;
    torse: string;
    bras: string;
    backpack: string;
  };
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'mj' | 'joueur';
}