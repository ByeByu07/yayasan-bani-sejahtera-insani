/* eslint-disable @typescript-eslint/no-unused-vars */

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as schema from "@/drizzle/schema";
import { polar, checkout, portal, usage, webhooks } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";

const polarClient = new Polar({ 
    accessToken: process.env.POLAR_ACCESS_TOKEN, 
    // Use 'sandbox' if you're using the Polar Sandbox environment
    // Remember that access tokens, products, etc. are completely separated between environments.
    // Access tokens obtained in Production are for instance not usable in the Sandbox environment.
    server: 'sandbox'
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
    plugins: [
         polar({ 
            client: polarClient, 
            createCustomerOnSignUp: true,
            getCustomerCreateParams(data, request) {
                // (optional): Custom function to provide additional customer creation metadata
                return Promise.resolve({
                    metadata: {
                        
                    }
                })
            },
            use: [ 
                checkout({ 
                    products: [ 
                        { 
                            productId: "123-456-789", // ID of Product from Polar Dashboard
                            slug: "pro" // Custom slug for easy reference in Checkout URL, e.g. /checkout/pro
                        } 
                    ], 
                    successUrl: "/success?checkout_id={CHECKOUT_ID}", 
                    authenticatedUsersOnly: true
                }), 
                portal(), 
                usage(), 
                webhooks({ 
                    secret: process.env.POLAR_WEBHOOK_SECRET!, 
                    onCustomerStateChanged: (payload) => Promise.resolve(), // Triggered when anything regarding a customer changes
                    onOrderPaid: (payload) => Promise.resolve(), // Triggered when an order was paid (purchase, subscription renewal, etc.)
                    // Over 25 granular webhook handlers
                    onPayload: (payload) => Promise.resolve(), // Catch-all for all events
                }) 
            ],
        }) 
    ],
    user: {
        deleteUser: {
            enabled: true, 
            afterDelete: async (user, request) => { 
                await polarClient.customers.deleteExternal({ 
                  externalId: user.id
                }) 
            }, 
        }
    }
})

// export default auth