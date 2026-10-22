import { headers } from 'next/headers.js'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getActiveMode } from '@/lib/activeMode'

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await headers() })
  if (user?.role === 'player' && (await getActiveMode(user)) === 'mj') redirect('/characters')
  return children
}
