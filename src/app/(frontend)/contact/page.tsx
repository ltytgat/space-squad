import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { ContactClient } from './ContactClient'
import '../login/login.css'
import './contact.css'

export const metadata = {
  title: 'Contact — Space Squad',
}

export default async function ContactPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers })

  return (
    <div className="ss-root login-root">
      <SiteHeader />

      <div className="login-layout">
        <div className="login-box contact-box">
          <div className="login-header">
            <h1 className="login-title">Contact</h1>
            <p className="login-subtitle">Une question, un bug, une suggestion ? Écrivez-nous.</p>
          </div>

          <ContactClient accountEmail={user?.email ?? null} startedAt={Date.now()} />
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
