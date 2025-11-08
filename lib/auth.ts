/* eslint-disable @typescript-eslint/no-unused-vars */

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as schema from "@/drizzle/schema-old";
import { polar, checkout, portal, usage, webhooks } from "@polar-sh/better-auth";
import { organization } from "better-auth/plugins"
import { Polar } from "@polar-sh/sdk";
import { createAccessControl } from "better-auth/plugins/access";
import { getActiveOrganization } from "./get-active-organization";

const polarClient = new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN,
    // Use 'sandbox' if you're using the Polar Sandbox environment
    // Remember that access tokens, products, etc. are completely separated between environments.
    // Access tokens obtained in Production are for instance not usable in the Sandbox environment.
    server: 'sandbox'
});

// Define custom permissions for your yayasan
const statement = {
    transaction: ["create", "read"],
    request: ["create", "read", "approve"],
    inventory: ["create", "read", "update", "delete"],
    document: ["create", "read", "update", "delete"],
    room: ["create", "read", "update", "delete"],
    member: ["create", "read", "update", "delete"],
    booking: ["create", "read", "update", "delete"],
    invitation: ["create", "cancel"],
    log: ["read"],
} as const;

const ac = createAccessControl(statement);

// Define roles with permissions
const owner = ac.newRole({
    transaction: ["create", "read"],
    request: ["create", "read", "approve"],
    inventory: ["create", "read", "update", "delete"],
    document: ["create", "read", "update", "delete"],
    room: ["create", "read", "update", "delete"],
    member: ["create", "read", "update", "delete"],
    booking: ["create", "read", "update", "delete"],
    invitation: ["create", "cancel"],
    log: ["read"],
});

const KETUA = ac.newRole({
    // Final approver (Level 2)
    transaction: ["create", "read"],
    request: ["create", "read", "approve"],
    inventory: ["create", "read", "update", "delete"],
    document: ["create", "read", "update", "delete"],
    room: ["create", "read", "update", "delete"],
    member: ["create", "read", "update", "delete"],
    booking: ["create", "read", "update", "delete"],
    invitation: ["create", "cancel"],
    log: ["read"],
});

const BENDAHARA = ac.newRole({
    // First approver (Level 1) + financial management
    transaction: ["create", "read"],
    request: ["create", "read", "approve"],
    inventory: ["read"],
    document: ["read"],
    room: ["read"],
    member: ["read"],
    booking: ["read"],
    log: ["read"],
});

const SEKRETARIS = ac.newRole({
    // Document management, no approval authority
    transaction: ["read"],
    request: ["create", "read"],
    inventory: ["read"],
    document: ["create", "read", "update", "delete"],
    room: ["read"],
    member: ["read"],
    booking: ["read"],
    log: ["read"],
});

const OPERASIONAL = ac.newRole({
    // Operations, can request
    transaction: ["read"],
    booking: ["read"],
    room: ["read"],
    request: ["create", "read"],
    inventory: ["read"],
    document: ["read"],
    member: ["read"],
    log: ["read"],
});

const PENGADAAN = ac.newRole({
    // Procurement, can request inventory
    transaction: ["read"],
    request: ["create", "read"],
    inventory: ["create", "read", "update"],
    document: ["read"],
    room: ["read"],
    member: ["read"],
    booking: ["read"],
    log: ["read"],
});

const NURSE = ac.newRole({
    // Patient care, bookings, shift management
    booking: ["create", "read", "update"],
    room: ["read"],
    request: ["create", "read"],
    inventory: ["read"],
    log: ["read"],
});

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: schema
    }),
    emailAndPassword: { enabled: true },
    // socialProviders: {
    //     github: {
    //         clientId: process.env.GITHUB_CLIENT_ID as string, 
    //         clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    //     }
    // }
    databaseHooks: {
        session: {
            create: {
                before: async (session) => {
                    const organization = await getActiveOrganization(session.userId);
                    
                    return {
                        data: {
                            ...session,
                            activeOrganizationId: organization.id,
                        },
                    };
                },
            },
        },
    },
    plugins: [
        organization({
            ac,
            roles: {
                owner,
                KETUA,
                BENDAHARA,
                SEKRETARIS,
                OPERASIONAL,
                PENGADAAN,
                NURSE,
            },
            // Only founders can create the organization
            // allowUserToCreateOrganization: false,
            // One organization only
            organizationLimit: 1,
            // Limit members to reasonable number
            membershipLimit: 50,
        }),
        // polar({
        //     client: polarClient,
        //     createCustomerOnSignUp: true,
        //     getCustomerCreateParams(data, request) {
        //         // (optional): Custom function to provide additional customer creation metadata
        //         return Promise.resolve({
        //             metadata: {

        //             }
        //         })
        //     },
        //     use: [
        //         checkout({
        //             products: [
        //                 {
        //                     productId: "123-456-789", // ID of Product from Polar Dashboard
        //                     slug: "pro" // Custom slug for easy reference in Checkout URL, e.g. /checkout/pro
        //                 }
        //             ],
        //             successUrl: "/success?checkout_id={CHECKOUT_ID}",
        //             authenticatedUsersOnly: true
        //         }),
        //         portal(),
        //         usage(),
        //         webhooks({
        //             secret: process.env.POLAR_WEBHOOK_SECRET!,
        //             onCustomerStateChanged: (payload) => Promise.resolve(), // Triggered when anything regarding a customer changes
        //             onOrderPaid: (payload) => Promise.resolve(), // Triggered when an order was paid (purchase, subscription renewal, etc.)
        //             // Over 25 granular webhook handlers
        //             onPayload: (payload) => Promise.resolve(), // Catch-all for all events
        //         })
        //     ],
        // })
    ],
    // user: {
    //     deleteUser: {
    //         enabled: true,
    //         afterDelete: async (user, request) => {
    //             await polarClient.customers.deleteExternal({
    //                 externalId: user.id
    //             })
    //         },
    //     }
    // }
})

// export default auth