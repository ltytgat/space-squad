import { describe, expect, it } from 'vitest'
import { stripTemporaryWorkspaceSecrets, validateTemporaryCharacterUpdate } from '@/lib/temporaryCharacterRules'

describe('règles des fiches temporaires', () => {
  it('autorise les champs de fiche utiles, mais refuse les changements de propriétaire et d’étape', () => {
    expect(() => validateTemporaryCharacterUpdate({
      armureTorse: { item: 2, mods: [] },
      competencesSpeciales: [{ nom: 'Navigation', valeur: 1 }],
    }, {}, { maxArrayItems: 10, maxCustomSkills: 2 })).not.toThrow()

    for (const field of ['user', 'workspace', 'creationEtape', 'creationJets', 'groupe']) {
      expect(() => validateTemporaryCharacterUpdate({ [field]: 1 }, {}, { maxArrayItems: 10, maxCustomSkills: 2 })).toThrow()
    }
  })

  it('borne le nombre de compétences personnalisées et la taille cumulée de l’inventaire', () => {
    const limits = { maxArrayItems: 2, maxCustomSkills: 1 }
    expect(() => validateTemporaryCharacterUpdate({ competencesSpeciales: [{ nom: 'A' }, { nom: 'B' }] }, {}, limits)).toThrow()
    expect(() => validateTemporaryCharacterUpdate({ inventaire: [{ consommable: 1 }, { consommable: 2 }] }, { inventaireMods: [3] }, limits)).toThrow()
    expect(() => validateTemporaryCharacterUpdate({ armePrincipale: { mods: [1, 2, 3] } }, {}, limits)).toThrow()
  })

  it('borne aussi la profondeur, les champs texte et le volume sérialisé', () => {
    const limits = { maxArrayItems: 10, maxCustomSkills: 2, maxPayloadBytes: 10_000 }
    expect(() => validateTemporaryCharacterUpdate({ competencesSpeciales: [{ nom: 'x'.repeat(4_001) }] }, {}, limits)).toThrow()
    expect(() => validateTemporaryCharacterUpdate({ competencesSpeciales: [{ nom: 'A', valeur: 1 }] }, {}, limits)).not.toThrow()
    expect(() => validateTemporaryCharacterUpdate({ competencesSpeciales: [{ nom: 'x'.repeat(3_000) }] }, {}, { ...limits, maxPayloadBytes: 128 })).toThrow()

    let nested: unknown = 0
    for (let depth = 0; depth < 18; depth++) nested = { next: nested }
    expect(() => validateTemporaryCharacterUpdate({ armureTorse: nested }, {}, limits)).toThrow()
  })

  it('retire les données internes du workspace avant de sérialiser une fiche vers le navigateur', () => {
    expect(stripTemporaryWorkspaceSecrets({
      id: 12,
      workspace: { id: 5, tokenHash: 'digest', requestCount: 7 },
      vaisseau: { id: 3, proprietaire: { createdFromHash: 'ip-digest', nom: 'Pilote' } },
    })).toEqual({ id: 12, vaisseau: { id: 3, proprietaire: { nom: 'Pilote' } } })
  })
})
