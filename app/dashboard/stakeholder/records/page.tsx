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
import { AlertCircle, Receipt, Filter, Search, TrendingUp, TrendingDown, DollarSign } from "lucide-react"

type TransactionItem = {
  id: string
  transactionCode: string
  transactionType: string
  categoryId: string | null
  categoryName: string | null
  amount: string
  transactionDate: string
  referenceType: string | null
  referenceId: string | null
  description: string | null
  proofDocumentUrl: string | null
  createdByUserId: string
  creatorName: string | null
  creatorEmail: string | null
  createdAt: string
}

type Category = {
  id: string
  name: string
  type: string
  code: string
}

type Summary = {
  type: string
  total: string
}

export default function RecordsPage() {
  const { setBreadcrumbs } = useBreadcrumb()
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [debouncedSearch, setDebouncedSearch] = useState<string>("")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")

  useEffect(() => {
    setBreadcrumbs([
      { label: "Dashboard", href: "/dashboard/stakeholder" },
      { label: "Pencatatan" },
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
    ...(typeFilter !== "all" && { type: typeFilter }),
    ...(categoryFilter !== "all" && { categoryId: categoryFilter }),
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
  })

  // Fetch transactions
  const { data, isLoading, isError } = useQuery<{
    success: boolean
    data: TransactionItem[]
    categories: Category[]
    summary: Summary[]
  }>({
    queryKey: ["transactions", typeFilter, categoryFilter, debouncedSearch, startDate, endDate],
    queryFn: async () => {
      const response = await fetch(`/api/transactions?${queryParams}`)
      if (!response.ok) throw new Error("Failed to fetch transactions")
      return response.json()
    },
  })

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(parseFloat(amount))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      CAPITAL_INJECTION: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      REVENUE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      EXPENSE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    }

    const labels: Record<string, string> = {
      CAPITAL_INJECTION: "Injeksi Modal",
      REVENUE: "Pendapatan",
      EXPENSE: "Pengeluaran",
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[type] || ""}`}>
        {labels[type] || type}
      </span>
    )
  }

  // Calculate totals from summary
  const getTotalByType = (type: string) => {
    const item = data?.summary.find(s => s.type === type)
    return item ? formatCurrency(item.total) : formatCurrency("0")
  }

  const getNetBalance = () => {
    const capital = parseFloat(data?.summary.find(s => s.type === "CAPITAL_INJECTION")?.total || "0")
    const revenue = parseFloat(data?.summary.find(s => s.type === "REVENUE")?.total || "0")
    const expense = parseFloat(data?.summary.find(s => s.type === "EXPENSE")?.total || "0")
    return formatCurrency(String(capital + revenue - expense))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pencatatan Transaksi</h2>
          <p className="text-muted-foreground">
            Kelola dan lihat semua transaksi keuangan
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      {!isLoading && data?.summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Modal</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTotalByType("CAPITAL_INJECTION")}</div>
              <p className="text-xs text-muted-foreground">Injeksi modal</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTotalByType("REVENUE")}</div>
              <p className="text-xs text-muted-foreground">Pemasukan</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTotalByType("EXPENSE")}</div>
              <p className="text-xs text-muted-foreground">Biaya operasional</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Bersih</CardTitle>
              <Receipt className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getNetBalance()}</div>
              <p className="text-xs text-muted-foreground">Modal + Pendapatan - Pengeluaran</p>
            </CardContent>
          </Card>
        </div>
      )}

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
                  placeholder="Cari kode, deskripsi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipe Transaksi</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Semua Tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  <SelectItem value="CAPITAL_INJECTION">Injeksi Modal</SelectItem>
                  <SelectItem value="REVENUE">Pendapatan</SelectItem>
                  <SelectItem value="EXPENSE">Pengeluaran</SelectItem>
                </SelectContent>
              </Select>
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
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Tanggal Mulai</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Tanggal Akhir</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
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
            <p className="text-destructive">Gagal memuat data transaksi</p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !isError && data?.data.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tidak Ada Transaksi</h3>
            <p className="text-muted-foreground text-center">
              Tidak ada transaksi yang ditemukan dengan filter yang dipilih.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Transactions Table */}
      {!isLoading && !isError && data?.data && data.data.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead>Dibuat Oleh</TableHead>
                    <TableHead>Referensi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.transactionCode}</TableCell>
                      <TableCell>{formatDate(transaction.transactionDate)}</TableCell>
                      <TableCell>{getTypeBadge(transaction.transactionType)}</TableCell>
                      <TableCell>
                        {transaction.categoryName ? (
                          <Badge variant="outline">
                            {transaction.categoryName.replace(/_/g, " ")}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-sm truncate">
                            {transaction.description || "-"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`font-semibold ${
                            transaction.transactionType === "EXPENSE"
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          {transaction.transactionType === "EXPENSE" ? "-" : "+"}
                          {formatCurrency(transaction.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{transaction.creatorName}</p>
                          {transaction.creatorEmail && (
                            <p className="text-xs text-muted-foreground">
                              {transaction.creatorEmail}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {transaction.referenceType ? (
                          <Badge variant="secondary" className="text-xs">
                            {transaction.referenceType}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
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
