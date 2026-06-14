import { Block } from 'payload'

export const KeyValueBlock: Block = {
  slug: 'keyValue',
  labels: {
    singular: 'Tableau Clé/Valeur',
    plural: 'Tableaux Clé/Valeur',
  },
  fields: [
    {
      name: 'rows',
      type: 'array',
      label: 'Lignes',
      minRows: 1,
      fields: [
        {
          name: 'key',
          type: 'text',
          label: 'Clé',
          required: true,
        },
        {
          name: 'value',
          type: 'text',
          label: 'Valeur',
          required: true,
        },
      ],
    },
  ],
}
