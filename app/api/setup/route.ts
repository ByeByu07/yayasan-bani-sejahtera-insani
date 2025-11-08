import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db";
import { transaction, transactionCategory } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await req.headers,
    })

    if (!session) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // const metadata = { someKey: "someValue" };

    // const data = await auth.api.createOrganization({
    //     body: {
    //         name: "My Organization", // required
    //         slug: "my-org", // required
    //         metadata,
    //         userId: session.user.id, // server-only
    //         keepCurrentActiveOrganization: false,
    //     },
    //     // This endpoint requires session cookies.
    //     headers: await req.headers,
    // });
    
    // const [tg] = await db.insert(transactionCategory).values({
    //     name: "Initial Investment",
    //     code: "INITIAL_INVESTMENT",
    //     type: "INCOME",
    // }).returning()

    // const [tg] = await db.select().from(transactionCategory).where(eq(transactionCategory.code, "INITIAL_INVESTMENT")).limit(1)

    // const tr = await db.insert(transaction).values({
    //     transactionCode: "TRX-20251107-002",
    //     transactionType: "CAPITAL_INJECTION",
    //     categoryId: tg.id,
    //     amount: 50000000,
    //     transactionDate: new Date().toISOString(),
    //     createdByUserId: session.user.id,
    //     organizationId: session.session.activeOrganizationId,
    // }).returning()

    return NextResponse.json({ success: true })
}