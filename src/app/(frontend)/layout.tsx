import { Orbitron } from 'next/font/google'
import React from 'react'
import './styles.css'

const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['400', '600', '700', '900'],
  variable: '--font-orbitron',
  display: 'swap',
})

export const metadata = {
  description: 'Space Squad — Un univers original de science-fiction dure. Lore, jeu de rôle et jeux de plateau.',
  title: 'Space Squad',
  icons: {
    icon: '/favicon.ico',
  },
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="fr" className={orbitron.variable}>
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
