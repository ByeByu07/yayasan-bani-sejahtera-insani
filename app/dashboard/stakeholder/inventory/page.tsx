"use client"

import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useBreadcrumb } from "@/components/breadcrumb-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import {
  AlertCircle,
  Package,
  Filter,
  Search,
  AlertTriangle,
  DollarSign,
  Boxes,
  Plus,
  Edit,
  Info,
} from "lucide-react"
import { toast } from "sonner"

type InventoryItem = {
  id: string
  itemCode: string
  name: string
  category: string
  unit: string
  quantityOnHand: number
  minimumStock: number
  averageUnitCost: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

type Stats = {
  category: string
  count: number
  totalValue: string
}

type InventoryFormData = {
  itemCode: string
  name: string
  category: string
  unit: string
  quantityOnHand: number
  minimumStock: number
  averageUnitCost: string
  isActive: boolean
}

export default function InventoryPage() {
  const { setBreadcrumbs } = useBreadcrumb()
  const queryClient = useQueryClient()
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [activeFilter, setActiveFilter] = useState<string>("true")
  const [lowStockFilter, setLowStockFilter] = useState<string>("false")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [debouncedSearch, setDebouncedSearch] = useState<string>("")

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [currentItem, setCurrentItem] = useState<InventoryItem | null>(null)

  // Form states
  const [formData, setFormData] = useState<InventoryFormData>({
    itemCode: "",
    name: "",
    category: "GENERAL",
    unit: "",
    quantityOnHand: 0,
    minimumStock: 0,
    averageUnitCost: "0",
    isActive: true,
  })

  useEffect(() => {
    setBreadcrumbs([
      { label: "Dashboard", href: "/dashboard/stakeholder" },
      { label: "Inventaris" },
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
    ...(categoryFilter !== "all" && { category: categoryFilter }),
    ...(activeFilter !== "all" && { isActive: activeFilter }),
    ...(lowStockFilter === "true" && { lowStock: "true" }),
    ...(debouncedSearch && { search: debouncedSearch }),
  })

  // Fetch inventory
  const { data, isLoading, isError } = useQuery<{
    success: boolean
    data: InventoryItem[]
    stats: Stats[]
    lowStockCount: number
  }>({
    queryKey: ["inventory", categoryFilter, activeFilter, lowStockFilter, debouncedSearch],
    queryFn: async () => {
      const response = await fetch(`/api/inventory?${queryParams}`)
      if (!response.ok) throw new Error("Failed to fetch inventory")
      return response.json()
    },
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: InventoryFormData) => {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error("Failed to create inventory item")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] })
      setIsAddModalOpen(false)
      resetForm()
      toast.success("Item inventaris berhasil ditambahkan")
    },
    onError: () => {
      toast.error("Gagal menambahkan item inventaris")
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InventoryFormData }) => {
      const response = await fetch(`/api/inventory/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error("Failed to update inventory item")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] })
      setIsEditModalOpen(false)
      setCurrentItem(null)
      resetForm()
      toast.success("Item inventaris berhasil diperbarui")
    },
    onError: () => {
      toast.error("Gagal memperbarui item inventaris")
    },
  })

  const resetForm = () => {
    setFormData({
      itemCode: "",
      name: "",
      category: "GENERAL",
      unit: "",
      quantityOnHand: 0,
      minimumStock: 0,
      averageUnitCost: "0",
      isActive: true,
    })
  }

  const handleOpenAddModal = () => {
    resetForm()
    setIsAddModalOpen(true)
  }

  const handleOpenEditModal = (item: InventoryItem) => {
    setCurrentItem(item)
    setFormData({
      itemCode: item.itemCode,
      name: item.name,
      category: item.category,
      unit: item.unit,
      quantityOnHand: item.quantityOnHand,
      minimumStock: item.minimumStock,
      averageUnitCost: item.averageUnitCost,
      isActive: item.isActive,
    })
    setIsEditModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isEditModalOpen && currentItem) {
      updateMutation.mutate({ id: currentItem.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(parseFloat(amount))
  }

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      MEDICAL_SUPPLIES: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      FOOD: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      GENERAL: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    }

    const labels: Record<string, string> = {
      MEDICAL_SUPPLIES: "Medis",
      FOOD: "Makanan",
      GENERAL: "Umum",
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[category] || ""}`}>
        {labels[category] || category}
      </span>
    )
  }

  const isLowStock = (item: InventoryItem) => {
    return item.quantityOnHand < item.minimumStock
  }

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantityOnHand === 0) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1 w-fit">
          <AlertCircle className="h-3 w-3" />
          Habis
        </Badge>
      )
    } else if (isLowStock(item)) {
      return (
        <Badge variant="default" className="bg-orange-600 flex items-center gap-1 w-fit">
          <AlertTriangle className="h-3 w-3" />
          Stok Rendah
        </Badge>
      )
    } else {
      return (
        <Badge variant="default" className="bg-green-600 w-fit">
          Normal
        </Badge>
      )
    }
  }

  const getTotalItems = () => {
    return data?.stats.reduce((sum, s) => sum + s.count, 0) || 0
  }

  const getTotalValue = () => {
    const total = data?.stats.reduce((sum, s) => sum + parseFloat(s.totalValue || '0'), 0) || 0
    return formatCurrency(String(total))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inventaris</h2>
          <p className="text-muted-foreground">
            Kelola dan pantau stok barang
          </p>
        </div>
        {/* <Button onClick={handleOpenAddModal} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Tambah Item
        </Button> */}
      </div>

      {/* Summary Cards */}
      {!isLoading && data?.stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Item</CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getTotalItems()}
              </div>
              <p className="text-xs text-muted-foreground">Item aktif</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nilai Total</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {getTotalValue()}
              </div>
              <p className="text-xs text-muted-foreground">Nilai inventaris</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stok Rendah</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {data.lowStockCount}
              </div>
              <p className="text-xs text-muted-foreground">Perlu restock</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kategori</CardTitle>
              <Boxes className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {data.stats.length}
              </div>
              <p className="text-xs text-muted-foreground">Jenis kategori</p>
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
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Pencarian</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Cari kode atau nama item..."
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
                  <SelectItem value="MEDICAL_SUPPLIES">Medis</SelectItem>
                  <SelectItem value="FOOD">Makanan</SelectItem>
                  <SelectItem value="GENERAL">Umum</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lowStock">Status Stok</Label>
              <Select value={lowStockFilter} onValueChange={setLowStockFilter}>
                <SelectTrigger id="lowStock">
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Semua</SelectItem>
                  <SelectItem value="true">Stok Rendah</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="active">Keaktifan</Label>
              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger id="active">
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="true">Aktif</SelectItem>
                  <SelectItem value="false">Nonaktif</SelectItem>
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
            <p className="text-destructive">Gagal memuat data inventaris</p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !isError && data?.data.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tidak Ada Item</h3>
            <p className="text-muted-foreground text-center">
              Tidak ada item inventaris yang ditemukan dengan filter yang dipilih.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Inventory Table */}
      {!isLoading && !isError && data?.data && data.data.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode Item</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Stok Tersedia</TableHead>
                    <TableHead>Stok Minimum</TableHead>
                    <TableHead>Satuan</TableHead>
                    <TableHead>Harga Rata-rata</TableHead>
                    <TableHead>Nilai Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aktif</TableHead>
                    {/* <TableHead>Aksi</TableHead> */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((item) => (
                    <TableRow key={item.id} className={isLowStock(item) ? "bg-orange-50 dark:bg-orange-950/10" : ""}>
                      <TableCell className="font-medium font-mono">
                        {item.itemCode}
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.name}
                      </TableCell>
                      <TableCell>{getCategoryBadge(item.category)}</TableCell>
                      <TableCell>
                        <span className={`font-semibold ${item.quantityOnHand === 0 ? "text-red-600" : isLowStock(item) ? "text-orange-600" : "text-green-600"}`}>
                          {item.quantityOnHand}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">
                          {item.minimumStock}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {item.unit}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(item.averageUnitCost)}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">
                          {formatCurrency(String(item.quantityOnHand * parseFloat(item.averageUnitCost)))}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStockStatus(item)}
                      </TableCell>
                      <TableCell>
                        {item.isActive ? (
                          <Badge variant="default" className="bg-green-600">
                            Aktif
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            Nonaktif
                          </Badge>
                        )}
                      </TableCell>
                      {/* <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditModal(item)}
                          className="flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                      </TableCell> */}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddModalOpen(false)
          setIsEditModalOpen(false)
          setCurrentItem(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditModalOpen ? "Edit Item Inventaris" : "Tambah Item Inventaris"}
            </DialogTitle>
            <DialogDescription>
              {isEditModalOpen
                ? "Perbarui informasi item inventaris"
                : "Tambahkan item inventaris baru ke sistem"
              }
            </DialogDescription>
          </DialogHeader>

          <Alert variant="warning" className="my-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Perhatian</AlertTitle>
            <AlertDescription>
              Item inventaris yang ditambahkan tidak dapat dihapus dari sistem.
              Pastikan semua informasi sudah benar sebelum menyimpan.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="itemCode">
                  Kode Item <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="itemCode"
                  value={formData.itemCode}
                  onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
                  placeholder="Contoh: INV-001"
                  required
                  disabled={isEditModalOpen}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">
                  Nama Item <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nama item"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">
                  Kategori <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEDICAL_SUPPLIES">Medis</SelectItem>
                    <SelectItem value="FOOD">Makanan</SelectItem>
                    <SelectItem value="GENERAL">Umum</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">
                  Satuan <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="Contoh: pcs, box, kg"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantityOnHand">
                  Stok Tersedia <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="quantityOnHand"
                  type="number"
                  min="0"
                  value={formData.quantityOnHand}
                  onChange={(e) => setFormData({ ...formData, quantityOnHand: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimumStock">
                  Stok Minimum <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="minimumStock"
                  type="number"
                  min="0"
                  value={formData.minimumStock}
                  onChange={(e) => setFormData({ ...formData, minimumStock: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="averageUnitCost">
                  Harga Rata-rata (IDR) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="averageUnitCost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.averageUnitCost}
                  onChange={(e) => setFormData({ ...formData, averageUnitCost: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2 col-span-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    Item Aktif
                  </Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddModalOpen(false)
                  setIsEditModalOpen(false)
                  setCurrentItem(null)
                  resetForm()
                }}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
