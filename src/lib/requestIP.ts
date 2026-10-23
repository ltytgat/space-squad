import { createHmac } from 'node:crypto'
import { headers } from 'next/headers.js'

/** HMAC of the client IP: lets us count requests per connection without storing the address. */
export async function getRequestIPHash(): Promise<string | null> {
  const requestHeaders = await headers()
  const address = requestHeaders.get('x-real-ip')?.trim()
    || requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim()
  const secret = process.env.PAYLOAD_SECRET
  if (!address || !secret) return null
  return createHmac('sha256', secret).update(address).digest('hex')
}
