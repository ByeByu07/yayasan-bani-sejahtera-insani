"use client"

import React from "react"
import Link from "next/link"
import { StakeholderSidebar } from "@/components/stakeholder-sidebar"
import { BreadcrumbProvider, useBreadcrumb } from "@/components/breadcrumb-provider"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { breadcrumbs } = useBreadcrumb()

  return (
    <SidebarProvider>
      <StakeholderSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.length > 0 ? (
                  breadcrumbs.map((item, index) => (
                    <React.Fragment key={index}>
                      <BreadcrumbItem>
                        {index < breadcrumbs.length - 1 ? (
                          item.href ? (
                            <BreadcrumbLink asChild>
                              <Link href={item.href}>{item.label}</Link>
                            </BreadcrumbLink>
                          ) : (
                            <BreadcrumbPage>{item.label}</BreadcrumbPage>
                          )
                        ) : (
                          <BreadcrumbPage className="line-clamp-1">
                            {item.label}
                          </BreadcrumbPage>
                        )}
                      </BreadcrumbItem>
                      {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                    </React.Fragment>
                  ))
                ) : (
                  <BreadcrumbItem>
                    <BreadcrumbPage className="line-clamp-1">
                      Dashboard
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          {/* <div className="ml-auto px-3">
            <NavActions />
          </div> */}
        </header>
        <div className="flex flex-1 flex-col gap-4 px-4 py-10">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function StakeholderLayout({ children }: { children: React.ReactNode }) {
  return (
    <BreadcrumbProvider>
      <LayoutContent>{children}</LayoutContent>
    </BreadcrumbProvider>
  )
}
