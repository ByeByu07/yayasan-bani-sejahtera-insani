import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { betterFetch } from '@better-fetch/fetch'

type Session = typeof auth.$Infer.Session;

export async function middleware(request: NextRequest) {
	// const { pathname } = request.nextUrl;

	const { data: session } = await betterFetch<Session>("/api/auth/get-session", {
		baseURL: request.nextUrl.origin,
		headers: {
			cookie: request.headers.get("cookie") || "",
		},
	});

	if (!session) {
		return NextResponse.redirect(new URL("/signin", request.url));
	}

	

	// const { role } = await auth.api.getActiveMemberRole({
	// 	headers: await request.headers,
	// });

	// // Define the target URLs based on role
	// const stakeholderPath = "/dashboard/stakeholder";
	// const workerPath = "/dashboard/worker";

	// // Check if user should be on stakeholder dashboard
	// if (["owner", "KETUA", "BENDAHARA", "SEKRETARIS", "OPERASIONAL", "PENGADAAN"].includes(role)) {
	// 	// Only redirect if not already on the stakeholder path
	// 	if (!pathname.startsWith(stakeholderPath)) {
	// 		return NextResponse.redirect(new URL(stakeholderPath, request.url));
	// 	}
	// }

	// // Check if user should be on worker dashboard
	// if (role === "NURSE") {
	// 	// Only redirect if not already on the worker path
	// 	if (!pathname.startsWith(workerPath)) {
	// 		return NextResponse.redirect(new URL(workerPath, request.url));
	// 	}
	// }

	return NextResponse.next()
}

export const config = {
	matcher: '/dashboard/:path*',
}