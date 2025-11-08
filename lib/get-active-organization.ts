import { db } from "./db";
import { eq } from "drizzle-orm";
import { organization, member } from "@/drizzle/schema";

export const getActiveOrganization = async (userId: string) => {

    const [memberData] = await db.select().from(member).where(eq(member.userId, userId));

    const [organizationData] = await db.select().from(organization).where(eq(organization.id, memberData.organizationId));
   
    return organizationData;
}