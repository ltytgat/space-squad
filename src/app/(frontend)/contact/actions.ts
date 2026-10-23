'use server'

import { headers } from 'next/headers.js'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getActiveCharacter } from '@/lib/activeCharacter'
import { normalizeEmail } from '@/lib/emailPolicy'
import { envLimit } from '@/lib/envLimit'
import { getRequestIPHash } from '@/lib/requestIP'
import { escapeHTML } from '@/lib/escapeHTML'

export type ContactResult = { success: true } | { success: false; error: string }

type ContactInput = {
  email?: unknown
  subject?: unknown
  message?: unknown
  website?: unknown
  startedAt?: unknown
}

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS
// Un humain met plus de quelques secondes à rédiger un message.
const MIN_FILL_TIME_MS = 3000
const MAX_SUBJECT_LENGTH = 150
const MIN_MESSAGE_LENGTH = 10
const MAX_GUEST_MESSAGE_LENGTH = 2000
const MAX_USER_MESSAGE_LENGTH = 5000
const MAX_GUEST_LINKS = 2

const GUEST_MAX_PER_HOUR = envLimit('CONTACT_GUEST_MAX_PER_HOUR', 2)
const GUEST_MAX_PER_DAY = envLimit('CONTACT_GUEST_MAX_PER_DAY', 5)
const GUEST_MAX_GLOBAL_PER_DAY = envLimit('CONTACT_GUEST_MAX_GLOBAL_PER_DAY', 30)
const USER_MAX_PER_HOUR = envLimit('CONTACT_USER_MAX_PER_HOUR', 5)
const USER_MAX_PER_DAY = envLimit('CONTACT_USER_MAX_PER_DAY', 20)
const MAX_GLOBAL_PER_DAY = envLimit('CONTACT_MAX_GLOBAL_PER_DAY', 100)

const TOO_MANY = 'Vous avez envoyé trop de messages récemment. Réessayez plus tard.'
const UNAVAILABLE = 'Le formulaire de contact est temporairement indisponible.'

function fail(error: string): ContactResult {
  return { success: false, error }
}

export async function submitContactMessage(raw: ContactInput): Promise<ContactResult> {
  const input = raw && typeof raw === 'object' ? raw : {}

  // Leurre rempli ou formulaire envoyé instantanément : on simule un succès sans rien enregistrer.
  if (typeof input.website === 'string' && input.website.length > 0) return { success: true }
  const startedAt = Number(input.startedAt)
  if (!Number.isFinite(startedAt) || Date.now() - startedAt < MIN_FILL_TIME_MS) return { success: true }

  const recipient = process.env.CONTACT_TO_EMAIL
  if (!recipient) return fail(UNAVAILABLE)

  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await headers() })

  // Connecté : l'adresse du compte est imposée, quelle que soit celle envoyée par le client.
  const email = user ? normalizeEmail(user.email) : normalizeEmail(input.email)
  if (!email) return fail('Saisissez une adresse e-mail valide.')

  const subject = typeof input.subject === 'string' ? input.subject.trim() : ''
  if (!subject || subject.length > MAX_SUBJECT_LENGTH || /[\r\n]/.test(subject)) {
    return fail(`Le sujet doit contenir entre 1 et ${MAX_SUBJECT_LENGTH} caractères, sur une seule ligne.`)
  }
  const message = typeof input.message === 'string' ? input.message.trim() : ''
  const maxMessageLength = user ? MAX_USER_MESSAGE_LENGTH : MAX_GUEST_MESSAGE_LENGTH
  if (message.length < MIN_MESSAGE_LENGTH || message.length > maxMessageLength) {
    return fail(`Le message doit contenir entre ${MIN_MESSAGE_LENGTH} et ${maxMessageLength} caractères.`)
  }
  if (!user && (message.match(/https?:\/\//gi)?.length ?? 0) > MAX_GUEST_LINKS) {
    return fail(`Le message ne peut pas contenir plus de ${MAX_GUEST_LINKS} liens.`)
  }

  const ipHash = await getRequestIPHash()
  // Sans IP, impossible de limiter un invité : on refuse plutôt que d'ouvrir une brèche.
  if (!user && !ipHash) return fail(UNAVAILABLE)

  try {
    const now = Date.now()
    const countSince = async (windowMs: number, where: Record<string, unknown> = {}) => {
      const { totalDocs } = await payload.count({
        collection: 'contact-messages',
        where: { ...where, createdAt: { greater_than: new Date(now - windowMs).toISOString() } },
        overrideAccess: true,
      })
      return totalDocs
    }

    if (await countSince(DAY_MS) >= MAX_GLOBAL_PER_DAY) return fail(UNAVAILABLE)
    if (user) {
      const byUser = { user: { equals: user.id } }
      if (await countSince(HOUR_MS, byUser) >= USER_MAX_PER_HOUR) return fail(TOO_MANY)
      if (await countSince(DAY_MS, byUser) >= USER_MAX_PER_DAY) return fail(TOO_MANY)
    } else {
      const byIP = { ipHash: { equals: ipHash } }
      if (await countSince(HOUR_MS, byIP) >= GUEST_MAX_PER_HOUR) return fail(TOO_MANY)
      if (await countSince(DAY_MS, byIP) >= GUEST_MAX_PER_DAY) return fail(TOO_MANY)
      if (await countSince(DAY_MS, { kind: { equals: 'guest' } }) >= GUEST_MAX_GLOBAL_PER_DAY) return fail(UNAVAILABLE)
    }

    const character = user ? await getActiveCharacter(payload, user) : null
    const doc = await payload.create({
      collection: 'contact-messages',
      data: {
        kind: user ? 'user' : 'guest',
        status: 'nouveau',
        email,
        subject,
        message,
        user: user?.id ?? null,
        character: character?.id ?? null,
        ipHash,
      },
      overrideAccess: true,
    })

    // Le message est déjà enregistré : un échec SMTP ne doit pas faire perdre la demande.
    try {
      const sender = user
        ? `Utilisateur ${escapeHTML(email)}${character?.nom ? ` (personnage : ${escapeHTML(String(character.nom))})` : ''}`
        : `Invité ${escapeHTML(email)}`
      await payload.sendEmail({
        to: recipient,
        replyTo: email,
        subject: `[Contact Space Squad] ${subject}`,
        html: `<p><strong>${sender}</strong></p>
          <p><strong>Sujet :</strong> ${escapeHTML(subject)}</p>
          <p>${escapeHTML(message).replace(/\r?\n/g, '<br>')}</p>`,
      })
      await payload.update({ collection: 'contact-messages', id: doc.id, data: { emailSent: true }, overrideAccess: true })
    } catch (error) {
      console.error('[Contact] Échec de l’envoi de l’e-mail', error)
    }

    return { success: true }
  } catch (error) {
    console.error('[Contact] Échec de l’enregistrement du message', error)
    return fail('L’envoi du message a échoué. Veuillez réessayer.')
  }
}
