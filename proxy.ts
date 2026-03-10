import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: {
    signIn: '/login',
  },
})

// Protect all dashboard routes
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/propiedades/:path*',
    '/inquilinos/:path*',
    '/pagos/:path*',
    '/gastos/:path*',
    '/fianzas/:path*',
    '/incidencias/:path*',
    '/documentos/:path*',
    '/historico/:path*',
    '/rentabilidad/:path*',
  ],
}
