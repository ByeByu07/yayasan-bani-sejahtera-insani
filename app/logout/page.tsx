"use client"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

export default function LogoutPage() {
    const router = useRouter()
    setTimeout(() => {
        authClient.signOut().finally(() => {
            router.push("/signin")
        });
    }, 1000);

    return (
        <div className="flex items-center justify-center h-screen">
            <h1>Kamu sedang logout...</h1>
        </div>
    )
}