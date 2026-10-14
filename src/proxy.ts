import { NextRequest, NextResponse } from 'next/server'

const COOKIE = 'ss_temporary_character_workspace'
const COOKIE_MAX_AGE = 24 * 60 * 60

export function proxy(request: NextRequest) {
  const token = request.cookies.get(COOKIE)?.value
  const response = NextResponse.next()
  if (token && request.nextUrl.pathname.startsWith('/temporary-character/')) {
    response.cookies.set(COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    })
  }
  return response
}

export const config = { matcher: ['/temporary-character/:path*'] }
