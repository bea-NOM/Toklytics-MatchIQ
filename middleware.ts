import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Development mode: allow user ID via query parameter
  const userId = request.nextUrl.searchParams.get('id')
  
  if (userId) {
    // Clone the request headers and add the dev user ID
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-dev-user-id', userId)
    
    // Return a response with the modified headers
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/dashboard/:path*',
}
