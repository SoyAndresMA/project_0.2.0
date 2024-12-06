import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // Obtener el origen de la petición
    const origin = request.headers.get('origin') || '';
    
    // Crear la respuesta
    const response = NextResponse.next();
    
    // Agregar headers CORS
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, x-debug');
    
    // Manejar peticiones OPTIONS (preflight)
    if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
            status: 204,
            headers: response.headers,
        });
    }
    
    return response;
}

// Configurar qué rutas deben usar este middleware
export const config = {
    matcher: '/api/:path*',
}
