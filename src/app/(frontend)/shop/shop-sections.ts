export const shopScopes = {
  tout: { title: 'Toute la boutique', description: 'Consultez le catalogue complet, gérez vos réserves et effectuez vos transactions.' },
  'sol-armes': { title: 'Armes personnelles', description: 'Armes destinées à votre personnage.' },
  'sol-armures': { title: 'Armures personnelles', description: 'Équipements de protection destinés à votre personnage.' },
  'sol-consommables': { title: 'Consommables personnels', description: 'Consommables à ajouter à la réserve de votre personnage.' },
  'sol-puces': { title: 'Puces', description: 'Achetez des puces, tentez un tirage aléatoire ou recyclez celles de votre réserve.' },
  'espace-armes': { title: 'Armes spatiales', description: 'Armes à ajouter à la réserve d’un vaisseau dont vous pouvez gérer les équipements.' },
  'espace-modules': { title: 'Modules spatiaux', description: 'Modules à ajouter à la réserve d’un vaisseau dont vous pouvez gérer les équipements.' },
  'espace-consommables': { title: 'Consommables spatiaux', description: 'Consommables à ajouter à la réserve d’un vaisseau dont vous pouvez gérer les équipements.' },
  'mods-armes': { title: 'Mods d’armes', description: 'Choisissez une arme personnelle compatible, puis appliquez un Mod.' },
  'mods-armures': { title: 'Mods d’armures', description: 'Achetez des Mods d’armure et gérez ceux déjà présents dans votre réserve.' },
} as const

export type ShopScope = keyof typeof shopScopes

export const shopNavigation = [
  {
    title: 'Sol',
    links: [
      { href: '/shop/sol/armes', label: 'Armes' },
      { href: '/shop/sol/armures', label: 'Armures' },
      { href: '/shop/sol/consommables', label: 'Consommables' },
      { href: '/shop/sol/puces', label: 'Puces' },
    ],
  },
  {
    title: 'Espace',
    links: [
      { href: '/shop/espace/armes', label: 'Armes' },
      { href: '/shop/espace/modules', label: 'Modules' },
      { href: '/shop/espace/consommables', label: 'Consommables' },
    ],
  },
  {
    title: 'Mods',
    links: [
      { href: '/shop/mods/armes', label: 'Armes' },
      { href: '/shop/mods/armures', label: 'Armures' },
    ],
  },
  {
    title: 'Chantier naval',
    links: [
      { href: '/shop/chantier-naval', label: 'Acheter, vendre et transfert de soutes' },
    ],
  },
  {
    title: 'Escouade',
    links: [
      { href: '/shop/transfert-personnages', label: 'Transférer du matériel ou des Konis' },
    ],
  },
] as const

export const shopScopeByPath: Record<string, ShopScope> = {
  tout: 'tout',
  'sol/armes': 'sol-armes',
  'sol/armures': 'sol-armures',
  'sol/consommables': 'sol-consommables',
  'sol/puces': 'sol-puces',
  'espace/armes': 'espace-armes',
  'espace/modules': 'espace-modules',
  'espace/consommables': 'espace-consommables',
  'mods/armes': 'mods-armes',
  'mods/armures': 'mods-armures',
}
