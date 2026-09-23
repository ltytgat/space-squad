import { describe, expect, it, vi } from 'vitest'
import { assignedCrew, syncCharacterShip, syncShipCrew, validateCrewAssignments } from '@/lib/shipCrewSync'

describe('synchronisation persistante de l’équipage', () => {
  it('embarque le pilote sélectionné dans l’admin, dans la même transaction', async () => {
    const payload = { findByID: vi.fn().mockResolvedValue({ id: 4, vaisseau: null }), update: vi.fn() }
    const req = { payload, transactionID: 'transaction' }
    const doc = { id: 7, pilote: 4 }
    await syncShipCrew({ doc, previousDoc: {}, req, context: {} } as any)
    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'characters', id: 4, data: { vaisseau: 7, roleVaisseau: 'pilote' }, req,
    }))
  })

  it('synchronise copilote et canonniers sans relations peuplées', () => {
    expect([...assignedCrew({ pilote: { id: 1 }, copilote: 2, canonniers: [{ personnage: 3 }] })])
      .toEqual([[1, 'pilote'], [2, 'copilote'], [3, 'canonnier']])
  })

  it('laisse à bord comme passager un pilote remplacé', async () => {
    const payload = { findByID: vi.fn().mockResolvedValue({ id: 4, vaisseau: 7, roleVaisseau: 'pilote' }), update: vi.fn() }
    await syncShipCrew({ doc: { id: 7, pilote: null }, previousDoc: { pilote: 4 }, req: { payload }, context: {} } as any)
    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({ data: { vaisseau: 7, roleVaisseau: 'passager' } }))
  })

  it('ne réembarque pas un ancien occupant déjà parti', async () => {
    const payload = { findByID: vi.fn().mockResolvedValue({ id: 4, vaisseau: 8 }), update: vi.fn() }
    await syncShipCrew({ doc: { id: 7 }, previousDoc: { pilote: 4 }, req: { payload }, context: {} } as any)
    expect(payload.update).not.toHaveBeenCalled()
  })

  it.each([null, 8])('libère tous les anciens postes lors du déplacement vers %s', async (destination) => {
    const payload = {
      find: vi.fn().mockResolvedValue({ docs: [
        { id: 7, pilote: 4, copilote: 5, canonniers: [{ personnage: 6, tourelle: 1 }] },
        { id: 9, canonniers: [{ personnage: 4, tourelle: 1 }, { personnage: 6, tourelle: 2 }] },
        { id: 8, pilote: 4 },
      ] }),
      findByID: vi.fn().mockResolvedValue({ id: 8, pilote: 4 }), update: vi.fn(),
    }
    const req = { payload, transactionID: 'transaction' }
    const result = await syncCharacterShip({ data: { vaisseau: destination }, originalDoc: { id: 4, vaisseau: 7 }, req } as any)
    expect(result.roleVaisseau).toBe(destination ? 'pilote' : null)
    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({
      id: 7, data: { pilote: null, copilote: 5, canonniers: [{ personnage: 6, tourelle: 1 }] },
      req, context: { skipShipCrewSync: true },
    }))
    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({
      id: 9, data: expect.objectContaining({ canonniers: [{ personnage: 6, tourelle: 2 }] }),
    }))
    expect(payload.update).toHaveBeenCalledTimes(destination ? 2 : 3)
  })

  it('un embarquement sans poste donne le rôle passager', async () => {
    const payload = { find: vi.fn().mockResolvedValue({ docs: [] }), findByID: vi.fn().mockResolvedValue({ id: 7 }) }
    const result = await syncCharacterShip({ data: { vaisseau: 7, roleVaisseau: 'pilote' }, originalDoc: { id: 4 }, req: { payload } } as any)
    expect(result.roleVaisseau).toBe('passager')
  })

  it('refuse les doubles affectations même lors d’une mise à jour partielle', () => {
    expect(() => validateCrewAssignments({ data: { copilote: 4 }, originalDoc: { pilote: 4 } } as any)).toThrow('un seul poste')
  })

  it('évite la récursion pendant la libération d’un ancien poste', async () => {
    const payload = { findByID: vi.fn() }
    await syncShipCrew({ doc: { id: 7 }, req: { payload }, context: { skipShipCrewSync: true } } as any)
    expect(payload.findByID).not.toHaveBeenCalled()
  })

  it('restaure le contexte et propage les erreurs pour annuler la transaction', async () => {
    const context = { unrelated: true }
    const payload = {
      find: vi.fn().mockResolvedValue({ docs: [{ id: 7, pilote: 4 }] }),
      update: vi.fn().mockImplementation(async ({ req, context: nestedContext }) => {
        req.context = { ...req.context, ...nestedContext }
        throw new Error('Écriture impossible')
      }),
    }
    const req = { payload, context }
    await expect(syncCharacterShip({ data: { vaisseau: null }, originalDoc: { id: 4 }, req } as any))
      .rejects.toThrow('Écriture impossible')
    expect(req.context).toBe(context)
  })

  it('évite les écritures quand les relations sont déjà cohérentes', async () => {
    const payload = { findByID: vi.fn().mockResolvedValue({ id: 4, vaisseau: 7, roleVaisseau: 'pilote' }), update: vi.fn() }
    await syncShipCrew({ doc: { id: 7, pilote: 4 }, previousDoc: { pilote: 4 }, req: { payload }, context: {} } as any)
    expect(payload.update).not.toHaveBeenCalled()
  })
})
