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
import { AlertCircle, FileText, Download, Filter, Search } from "lucide-react"

type DocumentItem = {
  id: string
  documentCode: string
  categoryId: string
  categoryName: string | null
  title: string
  description: string | null
  fileUrl: string
  fileName: string
  fileSize: number
  mimeType: string
  version: number
  tags: string[] | null
  status: string
  relatedEntityType: string | null
  relatedEntityId: string | null
  uploadedByUserId: string
  uploaderName: string | null
  uploaderEmail: string | null
  createdAt: string
  updatedAt: string
}

type Category = {
  id: string
  name: string
  code: string
}

export default function DocumentsPage() {
  const { setBreadcrumbs } = useBreadcrumb()
  const [statusFilter, setStatusFilter] = useState<string>("ACTIVE")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [debouncedSearch, setDebouncedSearch] = useState<string>("")

  useEffect(() => {
    setBreadcrumbs([
      { label: "Dashboard", href: "/dashboard/stakeholder" },
      { label: "Dokumen" },
    ])
  }, [setBreadcrumbs])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Build query params
  const queryParams = new URLSearchParams({
    status: statusFilter,
    ...(categoryFilter !== "all" && { categoryId: categoryFilter }),
    ...(debouncedSearch && { search: debouncedSearch }),
  })

  // Fetch documents
  const { data, isLoading, isError } = useQuery<{
    success: boolean
    data: DocumentItem[]
    categories: Category[]
  }>({
    queryKey: ["documents", statusFilter, categoryFilter, debouncedSearch],
    queryFn: async () => {
      const response = await fetch(`/api/documents?${queryParams}`)
      if (!response.ok) throw new Error("Failed to fetch documents")
      return response.json()
    },
  })

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB"
    return (bytes / (1024 * 1024)).toFixed(2) + " MB"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      ARCHIVED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
      DELETED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    }

    const labels: Record<string, string> = {
      ACTIVE: "Aktif",
      ARCHIVED: "Diarsipkan",
      DELETED: "Dihapus",
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || ""}`}>
        {labels[status] || status}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dokumen</h2>
          <p className="text-muted-foreground">
            Kelola dan lihat semua dokumen organisasi
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
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Pencarian</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Cari kode, judul, deskripsi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {data?.categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Pilih Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Aktif</SelectItem>
                  <SelectItem value="ARCHIVED">Diarsipkan</SelectItem>
                  <SelectItem value="DELETED">Dihapus</SelectItem>
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
              {[1, 2, 3].map((i) => (
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
            <p className="text-destructive">Gagal memuat data dokumen</p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !isError && data?.data.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tidak Ada Dokumen</h3>
            <p className="text-muted-foreground text-center">
              Tidak ada dokumen yang ditemukan dengan filter yang dipilih.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Documents Table */}
      {!isLoading && !isError && data?.data && data.data.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Judul</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Ukuran</TableHead>
                    <TableHead>Versi</TableHead>
                    <TableHead>Diunggah Oleh</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.documentCode}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{doc.title}</p>
                          {doc.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {doc.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {doc.categoryName?.replace(/_/g, " ") || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                      <TableCell>v{doc.version}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{doc.uploaderName}</p>
                          {doc.uploaderEmail && (
                            <p className="text-xs text-muted-foreground">
                              {doc.uploaderEmail}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(doc.createdAt)}</TableCell>
                      <TableCell>{getStatusBadge(doc.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            <Download className="h-3 w-3" />
                            Unduh
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
