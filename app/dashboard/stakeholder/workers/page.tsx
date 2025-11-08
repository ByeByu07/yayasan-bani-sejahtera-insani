"use client"

import { useEffect } from "react"
import { useBreadcrumb } from "@/components/breadcrumb-provider"

export default function RecordsPage() {
  const { setBreadcrumbs } = useBreadcrumb()

  useEffect(() => {
    setBreadcrumbs([  
      { label: "Dashboard", href: "/dashboard/stakeholder" },
      { label: "Pencatatan" },
    ])
  }, [setBreadcrumbs])

  return (
    <>
      <h1 className="text-2xl font-bold">Pencatatan</h1>
      <div className="bg-muted/50 h-full w-full rounded-xl p-4">
        <p>Content for pencatatan page goes here...</p>
      </div>
    </>
  )
}
