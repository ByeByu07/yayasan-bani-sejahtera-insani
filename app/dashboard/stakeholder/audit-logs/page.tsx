"use client"

import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useBreadcrumb } from "@/components/breadcrumb-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertCircle,
  FileText,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Info,
  AlertTriangle,
  XCircle,
} from "lucide-react"

type AuditLogItem = {
  id: string
  userId: string
  userName: string | null
  userEmail: string | null
  organizationId: string | null
  organizationName: string | null
  action: string
  resourceType: string
  resourceId: string
  ipAddress: string | null
  userAgent: string | null
  description: string
  oldValues: any
  newValues: any
  metadata: any
  severity: string
  createdAt: string
}

type Pagination = {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

type Filters = {
  actions: string[]
  resourceTypes: string[]
  severities: string[]
}

export default function AuditLogsPage() {
  const { setBreadcrumbs } = useBreadcrumb()
  const [page, setPage] = useState<number>(1)
  const [limit] = useState<number>(20)
  const [actionFilter, setActionFilter] = useState<string>("all")
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>("all")
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [debouncedSearch, setDebouncedSearch] = useState<string>("")
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    setBreadcrumbs([
      { label: "Dashboard", href: "/dashboard/stakeholder" },
      { label: "Log Audit" },
    ])
  }, [setBreadcrumbs])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(1) // Reset to first page on search
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [actionFilter, resourceTypeFilter, severityFilter])

  // Build query params
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(actionFilter !== "all" && { action: actionFilter }),
    ...(resourceTypeFilter !== "all" && { resourceType: resourceTypeFilter }),
    ...(severityFilter !== "all" && { severity: severityFilter }),
    ...(debouncedSearch && { search: debouncedSearch }),
  })

  // Fetch audit logs
  const { data, isLoading, isError } = useQuery<{
    success: boolean
    data: AuditLogItem[]
    pagination: Pagination
    filters: Filters
  }>({
    queryKey: ["auditLogs", page, limit, actionFilter, resourceTypeFilter, severityFilter, debouncedSearch],
    queryFn: async () => {
      const response = await fetch(`/api/audit-logs?${queryParams}`)
      if (!response.ok) throw new Error("Failed to fetch audit logs")
      return response.json()
    },
  })

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      INFO: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      WARNING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      CRITICAL: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    }

    const icons: Record<string, any> = {
      INFO: Info,
      WARNING: AlertTriangle,
      CRITICAL: XCircle,
    }

    const Icon = icons[severity] || Info

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[severity] || ""}`}>
        <Icon className="h-3 w-3" />
        {severity}
      </span>
    )
  }

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      CREATE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      UPDATE: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      DELETE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      APPROVE: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      REJECT: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      LOGIN: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
      LOGOUT: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[action] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"}`}>
        {action}
      </span>
    )
  }

  const handleViewDetails = (log: AuditLogItem) => {
    setSelectedLog(log)
    setDialogOpen(true)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= (data?.pagination.totalPages || 1)) {
      setPage(newPage)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Log Audit</h2>
          <p className="text-muted-foreground">
            Pantau semua aktivitas dan perubahan dalam sistem
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Pencarian</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Cari deskripsi, resource ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="action">Aksi</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger id="action">
                  <SelectValue placeholder="Semua Aksi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Aksi</SelectItem>
                  {data?.filters.actions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resourceType">Tipe Resource</Label>
              <Select value={resourceTypeFilter} onValueChange={setResourceTypeFilter}>
                <SelectTrigger id="resourceType">
                  <SelectValue placeholder="Semua Tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  {data?.filters.resourceTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="severity">Tingkat Keparahan</Label>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger id="severity">
                  <SelectValue placeholder="Semua Tingkat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tingkat</SelectItem>
                  {data?.filters.severities.map((severity) => (
                    <SelectItem key={severity} value={severity}>
                      {severity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {isError && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-2 py-6">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-destructive">Gagal memuat log audit</p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !isError && data?.data.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tidak Ada Log</h3>
            <p className="text-muted-foreground text-center">
              Tidak ada log audit yang ditemukan dengan filter yang dipilih.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Audit Logs Table */}
      {!isLoading && !isError && data?.data && data.data.length > 0 && (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Waktu</TableHead>
                      <TableHead>Pengguna</TableHead>
                      <TableHead>Aksi</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead>Tingkat</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead className="text-right">Detail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          <div className="text-sm">
                            {formatDateTime(log.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{log.userName}</p>
                            {log.userEmail && (
                              <p className="text-xs text-muted-foreground">
                                {log.userEmail}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getActionBadge(log.action)}</TableCell>
                        <TableCell>
                          <div>
                            <Badge variant="outline" className="mb-1">
                              {log.resourceType}
                            </Badge>
                            <p className="text-xs text-muted-foreground font-mono">
                              {log.resourceId.substring(0, 8)}...
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="text-sm truncate">{log.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {log.ipAddress || "N/A"}
                          </code>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetails(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Menampilkan {((page - 1) * limit) + 1} - {Math.min(page * limit, data.pagination.totalCount)} dari {data.pagination.totalCount} log
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={!data.pagination.hasPrevPage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Sebelumnya
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, data.pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (data.pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= data.pagination.totalPages - 2) {
                        pageNum = data.pagination.totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={!data.pagination.hasNextPage}
                  >
                    Selanjutnya
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Log Audit</DialogTitle>
            <DialogDescription>
              Informasi lengkap tentang aktivitas ini
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Waktu</Label>
                  <p className="text-sm font-medium">{formatDateTime(selectedLog.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Tingkat Keparahan</Label>
                  <div className="mt-1">{getSeverityBadge(selectedLog.severity)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Pengguna</Label>
                  <p className="text-sm font-medium">{selectedLog.userName}</p>
                  <p className="text-xs text-muted-foreground">{selectedLog.userEmail}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Organisasi</Label>
                  <p className="text-sm font-medium">{selectedLog.organizationName || "N/A"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Aksi</Label>
                  <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Tipe Resource</Label>
                  <div className="mt-1">
                    <Badge variant="outline">{selectedLog.resourceType}</Badge>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Resource ID</Label>
                <code className="block mt-1 text-xs bg-muted px-2 py-1 rounded">
                  {selectedLog.resourceId}
                </code>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Deskripsi</Label>
                <p className="text-sm mt-1">{selectedLog.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">IP Address</Label>
                  <code className="block mt-1 text-xs bg-muted px-2 py-1 rounded">
                    {selectedLog.ipAddress || "N/A"}
                  </code>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">User Agent</Label>
                  <p className="text-xs mt-1 truncate">{selectedLog.userAgent || "N/A"}</p>
                </div>
              </div>

              {selectedLog.oldValues && (
                <div>
                  <Label className="text-xs text-muted-foreground">Nilai Lama</Label>
                  <pre className="mt-1 text-xs bg-muted p-3 rounded overflow-auto max-h-40">
                    {JSON.stringify(selectedLog.oldValues, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.newValues && (
                <div>
                  <Label className="text-xs text-muted-foreground">Nilai Baru</Label>
                  <pre className="mt-1 text-xs bg-muted p-3 rounded overflow-auto max-h-40">
                    {JSON.stringify(selectedLog.newValues, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.metadata && (
                <div>
                  <Label className="text-xs text-muted-foreground">Metadata</Label>
                  <pre className="mt-1 text-xs bg-muted p-3 rounded overflow-auto max-h-40">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
