"use client"

import { useEffect } from "react"
import { useBreadcrumb } from "@/components/breadcrumb-provider"

export default function WorkerDashboardPage() {
  const { setBreadcrumbs } = useBreadcrumb()

  useEffect(() => {
    setBreadcrumbs([
      { label: "Dashboard", href: "/dashboard/worker" },
    ])
  }, [setBreadcrumbs])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome to the worker dashboard
        </p>
      </div>
    </div>
  )
}
