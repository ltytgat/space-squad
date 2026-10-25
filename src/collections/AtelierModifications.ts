import type { CollectionConfig } from 'payload'
import type { User } from '@/payload-types'

const effectTargetOptions = [
  { label: 'Nom', value: 'nom' },
  { label: 'Fabricant / provenance', value: 'fabricant' },
  { label: 'Catégorie', value: 'categorie' },
  { label: 'Type', value: 'type' },
  { label: 'Poids', value: 'poids' },
  { label: 'Prix', value: 'prix' },
  { label: 'Force minimale', value: 'forceMinimum' },
  { label: 'Dégâts', value: 'valeurDegats' },
  { label: 'Zone d’effet', value: 'zoneEffet' },
  { label: 'Projectiles par tir', value: 'projectilesParTir' },
  { label: 'Temps de rechargement', value: 'tempsRechargement' },
  { label: 'Portée fixe', value: 'porteeFixe' },
  { label: 'Courte portée', value: 'courtePortee' },
  { label: 'Modificateur courte portée', value: 'modCourtePortee' },
  { label: 'Portée moyenne', value: 'moyennePortee' },
  { label: 'Modificateur portée moyenne', value: 'modMoyennePortee' },
  { label: 'Paliers sniper', value: 'paliersSniper' },
  { label: 'Tranche malus longue portée', value: 'trancheMalusLonguePortee' },
  { label: 'Malus par tranche', value: 'malusParTranche' },
  { label: 'Taille chargeur', value: 'tailleChargeur' },
  { label: 'Valeur de chauffe', value: 'valeurChauffe' },
  { label: 'Temps de refroidissement', value: 'tempsRefroidissement' },
  { label: 'Armure physique', value: 'valeurArmurePhysique' },
  { label: 'Bouclier', value: 'valeurBouclier' },
  { label: 'Rupture', value: 'valeurRupture' },
  { label: 'Modificateur', value: 'modificateur' },
  { label: 'Stockage', value: 'stockage' },
  { label: 'Set d’armure', value: 'set' },
  { label: 'Image', value: 'image' },
  { label: 'Classe du châssis', value: 'classe' },
  { label: 'Catégorie du châssis', value: 'categorie' },
  { label: 'Tourelles', value: 'tourelles' },
  { label: "Points d'emport pilote", value: 'pointsEmportPilote' },
  { label: "Points d'emport tourelles", value: 'pointsEmportTourelles' },
  { label: 'Blindage', value: 'blindage' },
  { label: 'Modules supplémentaires', value: 'modulesSupplementaires' },
  { label: 'Emplacements consommables', value: 'consommables' },
  { label: 'Esquive de base', value: 'esquiveBase' },
] as const

export const AtelierModifications: CollectionConfig = {
  slug: 'atelier-modifications',
  labels: { singular: 'Modification Atelier', plural: 'Modifications Atelier' },
  admin: {
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'prix', 'active'],
    group: 'Ateliers',
  },
  access: {
    read: ({ req }) => !!req.user,
    create: ({ req }) => (req.user as User | null)?.role === 'admin',
    update: ({ req }) => (req.user as User | null)?.role === 'admin',
    delete: ({ req }) => (req.user as User | null)?.role === 'admin',
  },
  fields: [
    { name: 'nom', type: 'text', required: true, label: 'Nom' },
    { name: 'description', type: 'textarea', label: 'Description' },
    {
      name: 'prix',
      type: 'number',
      required: true,
      min: 0,
      label: 'Prix fixe',
      admin: { description: 'Coût ajouté au prix d’achat de l’équipement custom.' },
    },
    {
      name: 'compatibilites',
      type: 'array',
      required: true,
      minRows: 1,
      label: 'Catégories compatibles',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'categorieEquipement',
              type: 'select',
              required: true,
              label: 'Équipement',
              options: [
                { label: 'Arme', value: 'arme' },
                { label: 'Armure', value: 'armure' },
                { label: 'Vaisseau', value: 'vaisseau' },
              ],
              admin: { width: '33%' },
            },
            {
              name: 'sousCategorie',
              type: 'select',
              validate: (value: unknown, { siblingData }: any) => {
                if (siblingData?.categorieEquipement === 'arme' || siblingData?.categorieEquipement === 'armure') {
                  return typeof value === 'string' && value.length > 0 || 'Choisissez une sous-catégorie pour cette catégorie.'
                }
                return true
              },
              label: 'Sous-catégorie',
              options: [
                { label: 'Fusil', value: 'fusil-assaut' },
                { label: 'Shotgun', value: 'shotgun' },
                { label: 'Sniper', value: 'sniper' },
                { label: 'Pistolet', value: 'pistolet' },
                { label: 'Casque', value: 'tete' },
                { label: 'Plastron', value: 'torse' },
                { label: 'Gantelets', value: 'bras' },
                { label: 'Jambières', value: 'jambes' },
              ],
              admin: { width: '33%' },
            },
            {
              name: 'typeArme',
              type: 'select',
              validate: (value: unknown, { siblingData }: any) => siblingData?.categorieEquipement !== 'arme' || value === 'thermique' || value === 'cinetique' || 'Choisissez thermique ou cinétique pour une arme.',
              label: 'Type d’arme',
              options: [
                { label: 'Thermique', value: 'thermique' },
                { label: 'Cinétique', value: 'cinetique' },
              ],
              admin: { width: '34%' },
            },
          ],
        },
        {
          name: 'classeVaisseau',
          type: 'select',
          validate: (value: unknown, { siblingData }: any) => siblingData?.categorieEquipement !== 'vaisseau' || ['alpha', 'beta', 'gamma', 'delta'].includes(String(value)) || 'Choisissez une classe de vaisseau.',
          label: 'Classe du vaisseau',
          options: [
            { label: 'Alpha', value: 'alpha' },
            { label: 'Beta', value: 'beta' },
            { label: 'Gamma', value: 'gamma' },
            { label: 'Delta', value: 'delta' },
          ],
        },
      ],
    },
    {
      name: 'effets',
      type: 'array',
      minRows: 1,
      label: 'Effets mécaniques',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'cible',
              type: 'select',
              required: true,
              label: 'Propriété',
              options: effectTargetOptions.map(({ label, value }) => ({ label, value })),
              admin: { width: '35%' },
            },
            {
              name: 'operation',
              type: 'select',
              required: true,
              label: 'Opération',
              options: [
                { label: 'Pourcentage', value: 'percent' },
                { label: 'Ajout numérique', value: 'add' },
                { label: 'Remplacement', value: 'replace' },
                { label: 'Bonus aux dés de dégâts', value: 'dice-bonus' },
                { label: 'Augmenter des emplacements codés', value: 'slot-add' },
              ],
              admin: { width: '30%' },
            },
            {
              name: 'valeur',
              type: 'text',
              required: true,
              label: 'Valeur / donnée JSON',
              admin: {
                width: '35%',
                description: 'Pourcentage signé, nombre, valeur de remplacement ou objet JSON pour une cible structurée.',
              },
            },
          ],
        },
      ],
    },
    { name: 'active', type: 'checkbox', defaultValue: true, label: 'Active' },
  ],
}
