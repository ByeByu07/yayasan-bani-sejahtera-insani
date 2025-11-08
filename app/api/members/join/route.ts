import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invitationToken } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const POST = async (req: NextRequest) => {

    try {

        const session = await auth.api.getSession({
            headers: await headers()
        })

        if (!session) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()

        const { token } = body

        const [tokenData] = await db.select().from(invitationToken).where(eq(invitationToken.token, token))

        if(tokenData.usedCount >= tokenData.maxUsage) {
            return NextResponse.json({ success: false, message: "Token sudah mencapai batas penggunaan" })
        }
        
        await db.update(invitationToken).set({ usedCount: tokenData.usedCount + 1 }).where(eq(invitationToken.token, token))

        if (!tokenData) {
            return NextResponse.json({ success: false, message: "Token tidak ditemukan" })
        }

        const data = await auth.api.addMember({
            body: {
                userId: session.user.id,
                role: tokenData.role,
                organizationId: tokenData.organizationId,
            },
        })

        return NextResponse.json({ success: true, message: "Member berhasil ditambahkan sebagai " + tokenData.role })
    } catch (error) {
        return NextResponse.json({ success: false, message: "Gagal menambahkan member" })
    }
    
}