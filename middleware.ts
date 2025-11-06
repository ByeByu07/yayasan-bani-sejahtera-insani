import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { betterFetch } from '@better-fetch/fetch'

type Session = typeof auth.$Infer.Session;

export async function middleware(request: NextRequest) {

    const { data: session } = await betterFetch<Session>("/api/auth/get-session", {
		baseURL: request.nextUrl.origin,
		headers: {
			cookie: request.headers.get("cookie") || "", // Forward the cookies from the request
		},
	});
 
	if (!session) {
		return NextResponse.redirect(new URL("/signin", request.url));
	}

    console.log(request.url)

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: '/dashboard/:path*',
	// matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
}
