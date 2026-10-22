import { getPayload } from 'payload'
import { headers as getHeaders } from 'next/headers.js'
import config from '@/payload.config'
import { isCharacterCreationComplete } from '@/lib/characterCreation'
import { createCharacterOds } from '@/lib/characterOdsExport'
import { consumeWorkspaceRequest, getWorkspaceFromCookie } from '@/lib/temporaryCharacterWorkspace'
import { getActiveMode } from '@/lib/activeMode'
import { canMJManageCharacter } from '@/lib/mjAccess'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function relationId(value: any): string | null {
  if (value == null) return null
  const id = typeof value === 'object' ? value.id : value
  return id == null ? null : String(id)
}

function errorResponse(message: string, status: number) {
  return new Response(message, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params
  const characterId = Number(rawId)
  if (!Number.isSafeInteger(characterId) || characterId <= 0) return errorResponse('Personnage invalide.', 400)

  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })
    const requestHeaders = await getHeaders()
    const { user } = await payload.auth({ headers: requestHeaders })
    const workspace = await getWorkspaceFromCookie(payload)
    if (!user && !workspace) return errorResponse('Authentification requise.', 401)

    const character = await payload.findByID({
      collection: 'characters',
      id: characterId,
      depth: 3,
      overrideAccess: true,
    }).catch(() => null) as any
    if (!character) return errorResponse('Personnage introuvable.', 404)

    const isAdmin = (user as any)?.role === 'admin'
    const activeMode = user ? await getActiveMode(user) : 'player'
    const isUserOwner = !!user && activeMode === 'player' && relationId(character.user) === String(user.id)
    const isMJEditor = Boolean(user && await canMJManageCharacter(payload, user, character))
    const isWorkspaceOwner = !!workspace
      && !character.user
      && relationId(character.workspace) === String(workspace.id)
    if (!isAdmin && !isMJEditor && !isUserOwner && !isWorkspaceOwner) return errorResponse('Accès refusé.', 403)

    if (isWorkspaceOwner) {
      try {
        await consumeWorkspaceRequest(payload, Number(workspace!.id))
      } catch {
        return errorResponse('La session temporaire a expiré ou a dépassé sa limite de requêtes.', 429)
      }
    }

    if (!isCharacterCreationComplete(character)) {
      return errorResponse('Terminez la création du personnage avant de l’exporter.', 409)
    }

    const ods = await createCharacterOds(character)
    const safeName = String(character.nom || 'Personnage').replace(/[\r\n"\\/]/g, ' ').trim() || 'Personnage'
    const filename = `Fiche de personnage - ${safeName}.ods`
    return new Response(Buffer.from(ods), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.oasis.opendocument.spreadsheet',
        'Content-Disposition': `attachment; filename="fiche-personnage.ods"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    console.error('Erreur lors de l’export de la fiche ODS :', error)
    return errorResponse('Impossible de générer la fiche ODS.', 500)
  }
}
