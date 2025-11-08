"use client"

import { useEffect } from "react"
import { useBreadcrumb } from "@/components/breadcrumb-provider"
import { ExpensePieChart } from "@/components/expense-pie-chart"

export default function StakeholderDashboardPage() {
  const { setBreadcrumbs } = useBreadcrumb()

  useEffect(() => {
    setBreadcrumbs([
      { label: "Dashboard", href: "/dashboard/stakeholder" },
    ])
  }, [setBreadcrumbs])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome to the stakeholder dashboard
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        <ExpensePieChart />
      </div>
    </div>
  )
}
