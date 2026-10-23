import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { cleanupExpiredCharacterWorkspaces } from '@/lib/cleanupTemporaryCharacterWorkspaces'
import { cleanupOldContactMessages } from '@/lib/cleanupContactMessages'

export const dynamic = 'force-dynamic'

function matchesSecret(candidate: string, expected: string): boolean {
  const candidateBytes = Buffer.from(candidate)
  const expectedBytes = Buffer.from(expected)
  return candidateBytes.length === expectedBytes.length && timingSafeEqual(candidateBytes, expectedBytes)
}

async function handleCleanupRequest(request: Request) {
  const secret = process.env.CRON_SECRET || process.env.CLEANUP_CRON_SECRET
  if (!secret || secret.length < 32) return NextResponse.json({ error: 'Nettoyage non configuré.' }, { status: 503 })
  const authorization = request.headers.get('authorization') ?? ''
  const candidate = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
  if (!matchesSecret(candidate, secret)) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })

  try {
    const result = await cleanupExpiredCharacterWorkspaces()
    // Le même cron quotidien purge aussi les vieux messages de contact.
    const contactResult = await cleanupOldContactMessages()
    return NextResponse.json({ ...result, ...contactResult })
  } catch (error) {
    console.error('[Temporary workspaces] Échec du nettoyage', error)
    return NextResponse.json({ error: 'Le nettoyage des workspaces temporaires a échoué.' }, { status: 500 })
  }
}

// Vercel Cron Jobs call routes with GET and add `Authorization: Bearer <CRON_SECRET>`.
export async function GET(request: Request) {
  return handleCleanupRequest(request)
}

// Keep POST available for manual calls and non-Vercel schedulers.
export async function POST(request: Request) {
  return handleCleanupRequest(request)
}
