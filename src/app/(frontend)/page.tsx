import { headers as getHeaders } from 'next/headers.js'
import Image from 'next/image'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import './styles.css'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  const { docs: pages } = await payload.find({
    collection: 'pages',
    where: {
      slug: {
        equals: 'home',
      },
    },
  })

  const homePage = pages[0]

  return (
    <div className="home">
      <div className="content">
        <picture>
          <source srcSet="https://raw.githubusercontent.com/payloadcms/payload/main/packages/ui/src/assets/payload-favicon.svg" />
          <Image
            alt="Payload Logo"
            height={65}
            src="https://raw.githubusercontent.com/payloadcms/payload/main/packages/ui/src/assets/payload-favicon.svg"
            width={65}
          />
        </picture>
        {homePage ? (
          <h1>{homePage.title}</h1>
        ) : (
          <>
            {!user && <h1>Welcome to your new project.</h1>}
            {user && <h1>Welcome back, {user.email}</h1>}
          </>
        )}
        <div className="links">
          <a
            className="admin"
            href={payloadConfig.routes.admin}
            rel="noopener noreferrer"
            target="_blank"
          >
            Go to admin panel
          </a>
          <a
            className="docs"
            href="https://payloadcms.com/docs"
            rel="noopener noreferrer"
            target="_blank"
          >
            Documentation
          </a>
        </div>
      </div>
      {homePage && homePage.content && (
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          {/* Note: In a real app, you would use a RichText renderer here */}
          <p>Contenu de la page disponible dans le CMS.</p>
        </div>
      )}
      <div className="footer">
        <p>Update this page by editing</p>
        <code>app/(frontend)/page.tsx</code>
      </div>
    </div>
  )
}
