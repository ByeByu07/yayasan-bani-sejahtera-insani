// app/onboarding/onboarding-client.tsx
"use client"

import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"

export default function OnboardingClient() {
    const session = authClient.useSession()
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')

    const [loginCountdown, setLoginCountdown] = useState(5)
    const [dashboardCountdown, setDashboardCountdown] = useState(5)
    const [isJoining, setIsJoining] = useState(false)
    const [joinSuccess, setJoinSuccess] = useState(false)
    const [message, setMessage] = useState('')

    // Redirect ke login jika belum login
    useEffect(() => {
        if (!session.data?.session) {
            const timer = setInterval(() => {
                setLoginCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer)
                        router.push(token ? `/signin?token=${token}` : "/signin")
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)

            return () => clearInterval(timer)
        }
    }, [session.data?.session, router, token])

    // Join organization jika sudah login dan ada token
    useEffect(() => {
        const joinOrganization = async () => {
            if (!session.data?.session || !token || isJoining || joinSuccess) return

            setIsJoining(true)
            try {
                const response = await fetch("/api/members/join", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token }),
                })

                const data = await response.json()

                if (!response.ok || !data.success) {
                    toast.error(data.message || "Gagal bergabung dengan organisasi")
                    setIsJoining(false)
                    return
                }

                setMessage(data.message)
                setJoinSuccess(true)
                toast.success("Berhasil bergabung dengan organisasi!")
            } catch (error) {
                toast.error("Terjadi kesalahan saat bergabung")
                setIsJoining(false)
            }
        }

        joinOrganization()
    }, [session.data?.session, token, isJoining, joinSuccess])

    // Redirect ke dashboard setelah sukses join
    useEffect(() => {
        if (joinSuccess) {
            const timer = setInterval(() => {
                setDashboardCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer)
                        router.push("/dashboard")
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)

            return () => clearInterval(timer)
        }
    }, [joinSuccess, router])

    // Tampilan untuk user yang belum login
    if (!session.data?.session) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="p-3 bg-red-100 rounded-full">
                            <AlertCircle className="h-8 w-8 text-red-600" />
                        </div>
                        
                        <h2 className="text-2xl font-bold text-gray-900">
                            Akses Terbatas
                        </h2>
                        
                        <p className="text-gray-600">
                            Anda belum login. Silakan login terlebih dahulu untuk mengakses halaman onboarding.
                        </p>

                        {token && (
                            <div className="w-full p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-xs text-blue-700 font-medium">
                                    Token terdeteksi - Login untuk melanjutkan
                                </p>
                            </div>
                        )}

                        <div className="w-full pt-4 space-y-3">
                            <Link href={token ? `/signin?token=${token}` : "/signin"} className="block">
                                <Button className="w-full" size="lg">
                                    Login Sekarang
                                </Button>
                            </Link>
                            
                            <p className="text-sm text-gray-500">
                                Belum punya akun?{" "}
                                <Link 
                                    href={token ? `/signup?token=${token}` : "/signup"}
                                    className="font-semibold text-blue-600 hover:text-blue-700 underline"
                                >
                                    Daftar di sini
                                </Link>
                            </p>
                        </div>

                        <div className="pt-4 border-t w-full">
                            <p className="text-sm text-gray-500">
                                Anda akan diarahkan ke halaman login dalam{" "}
                                <span className="font-bold text-blue-600 text-lg">
                                    {loginCountdown}
                                </span>{" "}
                                detik
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Tampilan loading saat proses join
    if (isJoining && !joinSuccess) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
                        <h2 className="text-2xl font-bold text-gray-900">
                            Memproses...
                        </h2>
                        <p className="text-gray-600">
                            Sedang menambahkan Anda ke organisasi
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    // Tampilan sukses dengan countdown redirect
    if (joinSuccess) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
                <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="p-3 bg-green-100 rounded-full">
                            <CheckCircle2 className="h-12 w-12 text-green-600" />
                        </div>
                        
                        <h2 className="text-2xl font-bold text-gray-900">
                            Berhasil!
                        </h2>
                        
                        <p className="text-gray-600">
                            {message || "Anda telah berhasil bergabung dengan organisasi"}
                        </p>

                        <div className="w-full pt-4 space-y-3">
                            <Button 
                                className="w-full" 
                                size="lg"
                                onClick={() => router.push("/dashboard")}
                            >
                                Pergi ke Dashboard
                            </Button>
                        </div>

                        <div className="pt-4 border-t w-full">
                            <p className="text-sm text-gray-500">
                                Anda akan diarahkan otomatis dalam{" "}
                                <span className="font-bold text-green-600 text-lg">
                                    {dashboardCountdown}
                                </span>{" "}
                                detik
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Tampilan jika tidak ada token (fallback)
    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
                <div className="flex flex-col items-center text-center space-y-4">
                    <AlertCircle className="h-12 w-12 text-yellow-600" />
                    <h2 className="text-2xl font-bold text-gray-900">
                        Token Tidak Ditemukan
                    </h2>
                    <p className="text-gray-600">
                        Link onboarding tidak valid atau telah kedaluwarsa
                    </p>
                    <Button 
                        className="w-full mt-4" 
                        onClick={() => router.push("/dashboard")}
                    >
                        Kembali ke Dashboard
                    </Button>
                </div>
            </div>
        </div>
    )
}