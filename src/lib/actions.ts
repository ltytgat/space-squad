'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'

export async function sendContactEmail(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const subject = formData.get('subject') as string
  const message = formData.get('message') as string

  if (!name || !email || !subject || !message) {
    return { error: 'Tous les champs sont obligatoires.' }
  }

  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    await payload.sendEmail({
      to: process.env.SMTP_USER || 'rpgspacesquad@gmail.com',
      subject: `Nouveau contact : ${subject}`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
          <h2>Nouveau message de contact via le site Space Squad</h2>
          <p><strong>Nom :</strong> ${name}</p>
          <p><strong>Email :</strong> ${email}</p>
          <p><strong>Sujet :</strong> ${subject}</p>
          <hr />
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
      `,
    })

    return { success: 'Votre message a bien été envoyé !' }
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email :', error)
    return { error: 'Une erreur est survenue lors de l\'envoi du message.' }
  }
}
