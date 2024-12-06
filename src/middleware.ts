import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // Manejar preflight requests
    if (request.method === 'OPTIONS') {
        return NextResponse.json({}, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });
    }

    return NextResponse.next();
}

// Solo aplicar a rutas API de caspar
export const config = {
    matcher: '/api/caspar/:path*'
};
