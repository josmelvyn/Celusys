import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyJWT } from '@/app/lib/auth/jwt'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('celusys_session')?.value
  const pathname = request.nextUrl.pathname

  const session = token ? await verifyJWT(token) : null

  // 1. Redirigir al login si no está autenticado e intenta entrar a una ruta protegida
  if (!session && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 2. Redirigir al dashboard si ya está autenticado e intenta ir a /login o la raíz
  if (session && (pathname === '/login' || pathname === '/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 3. Control de acceso por Roles (RBAC)
  if (session && pathname.startsWith('/usuarios') && session.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}