import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Solo protegemos rutas de /desarrollo o /admin si existen
  if (request.nextUrl.pathname.startsWith('/desarrollo')) {
    // Aquí iría la lógica de validación de sesión contra el JSON o el provider central
    // Por ahora lo dejamos como recordatorio de protección
  }
  return NextResponse.next();
}
