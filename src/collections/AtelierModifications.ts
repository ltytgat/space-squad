import type { CollectionConfig } from 'payload'
import type { User } from '@/payload-types'
import { hasDuplicateAtelierCompatibilities } from '@/lib/atelier'

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
    defaultColumns: ['nom', 'active'],
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
      name: 'compatibilites',
      type: 'array',
      required: true,
      minRows: 1,
      label: 'Catégories compatibles',
      validate: (value: unknown) => {
        return !Array.isArray(value) || !hasDuplicateAtelierCompatibilities(value) || 'Chaque compatibilité doit être unique.'
      },
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
        {
          type: 'row',
          fields: [
            {
              name: 'prix',
              type: 'number',
              required: true,
              min: 0,
              label: 'Prix',
              admin: { width: '34%', description: 'Coût ajouté au prix d’achat de l’équipement custom.' },
            },
            {
              name: 'maximum',
              type: 'number',
              required: true,
              min: 1,
              validate: (value: unknown) => (typeof value === 'number' && Number.isSafeInteger(value)) || 'Le maximum doit être un entier positif.',
              label: 'Maximum',
              admin: { width: '33%', description: 'Nombre maximum d’achats pour cette compatibilité.' },
            },
            {
              name: 'multiplicateurRachat',
              type: 'number',
              validate: (value: unknown, { siblingData }: any) => siblingData?.categorieEquipement !== 'arme' || (typeof value === 'number' && Number.isSafeInteger(value)) || 'Le multiplicateur de rachat doit être un entier pour une arme.',
              label: 'Multiplicateur de rachat',
              admin: {
                width: '33%',
                condition: (_: unknown, siblingData: any) => siblingData?.categorieEquipement === 'arme',
              },
            },
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
                { label: 'Ajout numérique', value: 'add' },
                { label: 'Plus de dés de dégâts', value: 'dice-count-add' },
                { label: 'Augmenter la taille du dé', value: 'dice-size-step' },
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
                description: 'Nombre signé pour un ajout, quantité de dés à ajouter, valeur 1 pour augmenter la taille du dé d’un rang, ou nombre/liste JSON pour les emplacements codés.',
              },
            },
          ],
        },
      ],
    },
    { name: 'active', type: 'checkbox', defaultValue: true, label: 'Active' },
  ],
}
