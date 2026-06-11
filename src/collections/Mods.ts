import type { CollectionConfig } from 'payload'
import type { User } from '@/payload-types'

export const Mods: CollectionConfig = {
  slug: 'mods',
  labels: { singular: 'Mod', plural: 'Mods' },
  admin: {
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'categoriePrincipale', 'sousCategorieArme', 'sousCategorieArmure', 'prix'],
    group: 'Équipement',
  },
  access: {
    read: ({ req }) => !!req.user,
    create: ({ req }) => (req.user as User | null)?.role === 'admin',
    update: ({ req }) => (req.user as User | null)?.role === 'admin',
    delete: ({ req }) => (req.user as User | null)?.role === 'admin',
  },
  fields: [
    {
      name: 'nom',
      type: 'text',
      required: true,
      label: 'Nom',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'categoriePrincipale',
          type: 'select',
          label: 'Type d\'équipement',
          required: true,
          options: [
            { label: 'Armes', value: 'armes' },
            { label: 'Armures', value: 'armures' },
          ],
          admin: { width: '50%' },
        },
        {
          name: 'prix',
          type: 'number',
          label: 'Prix',
          admin: {
            width: '50%',
            description:
              'Pour une arme, le prix est un pourcentage du prix de l\'arme (ex: 0.10 pour 10%). Pour une armure, c\'est un prix fixe.',
          },
        },
      ],
    },
    {
      name: 'sousCategorieArme',
      type: 'select',
      label: 'Catégorie d\'arme',
      required: true,
      admin: {
        condition: (data) => data.categoriePrincipale === 'armes',
      },
      options: [
        { label: 'Toutes', value: 'toutes' },
        { label: 'Fusils & Pistolets', value: 'fusils-pistolets' },
        { label: 'Shotgun', value: 'shotgun' },
        { label: 'Snipers', value: 'snipers' },
        { label: 'Mélée / CàC', value: 'melee' },
      ],
    },
    {
      name: 'sousCategorieArmure',
      type: 'select',
      label: 'Catégorie d\'armure',
      required: true,
      admin: {
        condition: (data) => data.categoriePrincipale === 'armures',
      },
      options: [
        { label: 'Toutes', value: 'toutes' },
        { label: 'Tête', value: 'tete' },
        { label: 'Torse', value: 'torse' },
        { label: 'Bras', value: 'bras' },
        { label: 'Jambes', value: 'jambes' },
      ],
    },
    {
      name: 'effet',
      type: 'textarea',
      label: 'Effet (Description narrative)',
      required: true,
    },
    {
      name: 'modificateurs',
      type: 'array',
      label: 'Modificateurs (Effets mécaniques)',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'cible',
              type: 'select',
              label: 'Statistique / Propriété ciblée',
              required: true,
              admin: { width: '70%' },
              options: [
                { label: 'Force', value: 'stat_force' },
                { label: 'Habilité', value: 'stat_habilite' },
                { label: 'Connaissances', value: 'stat_connaissances' },
                { label: 'Culture', value: 'stat_culture' },
                { label: 'Anticipation', value: 'stat_anticipation' },
                { label: 'Perception', value: 'stat_perception' },
                { label: 'Armure Physique', value: 'armure_physique' },
                { label: 'Armure Bouclier', value: 'armure_bouclier' },
                { label: 'Armure Rupture', value: 'armure_rupture' },
                { label: 'Dégâts (Fixe)', value: 'degats_flat' },
                { label: 'Dégâts (Bonus FO x1)', value: 'degats_mod_fo_x1' },
                { label: 'Dégâts (Bonus PE x1)', value: 'degats_mod_pe_x1' },
                { label: 'Portée Courte (m)', value: 'portee_courte' },
                { label: 'Portée Moyenne (m)', value: 'portee_moyenne' },
                { label: 'Mod. Portée Courte', value: 'mod_portee_courte' },
                { label: 'Mod. Portée Moyenne', value: 'mod_portee_moyenne' },
                { label: 'Taille Chargeur', value: 'chargeur' },
                { label: 'Taille Chargeur (%)', value: 'chargeur_pct' },
                { label: 'Poids', value: 'poids' },
                { label: 'Refroidissement (%)', value: 'refroidissement_pct' },
                { label: 'Indicateur: Surcharge %', value: 'indicator_surcharge' },
                { label: 'Indicateur: Projectiles +X', value: 'indicator_projectiles' },
                { label: 'Indicateur: Acide 1dX', value: 'indicator_acide' },
                { label: 'Indicateur: Tazer', value: 'indicator_tazer' },
                { label: 'Indicateur: Gravité Faible', value: 'indicator_gravite_faible' },
                { label: 'Indicateur: Gravité Forte', value: 'indicator_gravite_forte' },
                { label: 'Indicateur: Lumière', value: 'indicator_lumiere' },
                { label: 'Indicateur: Double Pistolet', value: 'indicator_double_pistolet' },
              ],
            },
            {
              name: 'valeur',
              type: 'number',
              label: 'Valeur',
              required: true,
              admin: { width: '30%' },
            },
          ],
        },
      ],
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Image',
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
