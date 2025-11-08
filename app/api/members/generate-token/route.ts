import { NextResponse, NextRequest } from "next/server"
import {db} from "@/lib/db"
import { invitationToken } from "@/drizzle/schema"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export const POST = async (req: NextRequest) => {
    const body = await req.json()

    const {organizationId, role } = body

    if (!organizationId || !role) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session) {
        return NextResponse.json(
            { success: false, error: 'Unauthorized' },
            { status: 401 }
        );
    }

    const { role: activeRole } = await auth.api.getActiveMemberRole({
        headers: await headers(),
    });

    if (!activeRole) {
        return NextResponse.json(
            { success: false, error: 'No active role found' },
            { status: 403 }
        );
    }

    // if (!activeRole.includes("owner") || !activeRole.includes("KETUA")) {
    //     return NextResponse.json(
    //         { success: false, error: 'Unauthorized' },
    //         { status: 401 }
    //     );
    // }

    const token = crypto.randomUUID()

    const result = await db.insert(invitationToken).values({
        id: crypto.randomUUID(),
        organizationId,
        role,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    }).returning()

    return NextResponse.json({ success: true, message: "Token berhasil di generate", data: result })
}