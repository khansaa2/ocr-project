"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Loader2, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Calendar, 
  DollarSign, 
  Building2, 
  User, 
  AlertCircle,
  Eye,
  Edit,
  Trash2
} from "lucide-react"
import { apiClient } from "@/lib/apiClient"
import { AppError } from "@/lib/errorHandler"

interface Invoice {
  id: number
  supplierName: string
  supplierIce: string
  clientName: string
  invoiceNumber: string
  invoiceDate: string
  amountTtc: number
  isValidated: boolean
  createdAt: string
  supplierAddress?: string
  clientIce?: string
  amountHt?: number
  amountTva?: number
  tvaRate?: number
}

interface InvoiceTableProps {
  refreshTrigger: number
}

interface PaginationInfo {
  totalElements: number
  totalPages: number
  currentPage: number
  size: number
}

export default function InvoiceTable({ refreshTrigger }: InvoiceTableProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo>({
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
    size: 10
  })

  // États pour les filtres et recherche
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [amountFilter, setAmountFilter] = useState<string>("all")

  // Charger les factures avec pagination et filtres
  const fetchInvoices = async (page: number = 0, size: number = 10) => {
    setIsLoading(true)
    setError(null)

    try {
      // Calculer les dates pour les filtres
      let dateFrom: string | undefined
      let dateTo: string | undefined
      
      if (dateFilter !== "all") {
        const now = new Date()
        const filterDate = new Date()
        
        switch (dateFilter) {
          case "30days":
            filterDate.setDate(now.getDate() - 30)
            break
          case "3months":
            filterDate.setMonth(now.getMonth() - 3)
            break
          case "6months":
            filterDate.setMonth(now.getMonth() - 6)
            break
          case "1year":
            filterDate.setFullYear(now.getFullYear() - 1)
            break
        }
        
        dateFrom = filterDate.toISOString().split('T')[0]
        dateTo = now.toISOString().split('T')[0]
      }

      const response = await apiClient.getInvoices(
        page, 
        size, 
        searchTerm || undefined, 
        statusFilter !== "all" ? statusFilter : undefined,
        dateFrom,
        dateTo
      )
      
      // Si l'API retourne une structure de pagination Spring Boot
      if (response.data.content) {
        setInvoices(response.data.content)
        setPagination({
          totalElements: response.data.totalElements,
          totalPages: response.data.totalPages,
          currentPage: response.data.number,
          size: response.data.size
        })
      } else {
        // Fallback si l'API retourne directement un array
        setInvoices(response.data)
        setPagination({
          totalElements: response.data.length,
          totalPages: Math.ceil(response.data.length / size),
          currentPage: 0,
          size: size
        })
      }
      
    } catch (err) {
      const errorMessage = err instanceof AppError ? err.message : "Erreur lors du chargement des factures"
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices(pagination.currentPage, pagination.size)
  }, [refreshTrigger])

  // Déclencher la recherche quand les filtres changent
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchInvoices(0, pagination.size) // Reset à la première page
    }, 300) // Debounce de 300ms pour la recherche

    return () => clearTimeout(timeoutId)
  }, [searchTerm, statusFilter, dateFilter])

  // Filtrage côté client uniquement pour le montant (pas encore implémenté côté serveur)
  const filteredInvoices = useMemo(() => {
    let filtered = invoices

    // Filtre par montant (côté client pour l'instant)
    if (amountFilter !== "all") {
      filtered = filtered.filter(invoice => {
        const amount = invoice.amountTtc
        switch (amountFilter) {
          case "low": return amount < 1000
          case "medium": return amount >= 1000 && amount < 10000
          case "high": return amount >= 10000
          default: return true
        }
      })
    }

    return filtered
  }, [invoices, amountFilter])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD'
    }).format(amount)
  }

  const handlePageChange = (newPage: number) => {
    fetchInvoices(newPage, pagination.size)
  }

  const handlePageSizeChange = (newSize: string) => {
    const size = parseInt(newSize)
    fetchInvoices(0, size)
  }

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setDateFilter("all")
    setAmountFilter("all")
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Chargement des factures...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Tableau des Factures
            </CardTitle>
            <CardDescription>
              {filteredInvoices.length} facture(s) affichée(s) sur {pagination.totalElements} total
            </CardDescription>
          </div>
          <Button onClick={() => fetchInvoices(pagination.currentPage, pagination.size)} variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Barre de recherche et filtres */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Recherche */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numéro, fournisseur, client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filtres */}
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="validated">Validées</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les dates</SelectItem>
                  <SelectItem value="30days">30 derniers jours</SelectItem>
                  <SelectItem value="3months">3 derniers mois</SelectItem>
                  <SelectItem value="6months">6 derniers mois</SelectItem>
                  <SelectItem value="1year">1 an</SelectItem>
                </SelectContent>
              </Select>

              <Select value={amountFilter} onValueChange={setAmountFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Montant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les montants</SelectItem>
                  <SelectItem value="low">&lt; 1 000 MAD</SelectItem>
                  <SelectItem value="medium">1 000 - 10 000 MAD</SelectItem>
                  <SelectItem value="high">&gt; 10 000 MAD</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={clearFilters} size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Effacer
              </Button>
            </div>
          </div>
        </div>

        {/* Tableau */}
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune facture trouvée</p>
            <p className="text-sm">
              {searchTerm || statusFilter !== "all" || dateFilter !== "all" || amountFilter !== "all" 
                ? "Essayez de modifier vos critères de recherche" 
                : "Commencez par uploader votre première facture"}
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numéro</TableHead>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Montant TTC</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.supplierName}</div>
                          {invoice.supplierIce && (
                            <div className="text-sm text-muted-foreground">
                              ICE: {invoice.supplierIce}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.clientName || "Non spécifié"}</div>
                          {invoice.clientIce && (
                            <div className="text-sm text-muted-foreground">
                              ICE: {invoice.clientIce}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(invoice.invoiceDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-semibold text-green-600">
                            {formatAmount(invoice.amountTtc)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={invoice.isValidated ? "default" : "secondary"}>
                          {invoice.isValidated ? "Validée" : "En attente"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Affichage de {filteredInvoices.length} facture(s)
                </span>
                <Select value={pagination.size.toString()} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="w-[80px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">par page</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Précédent
                </Button>
                
                <span className="text-sm text-muted-foreground">
                  Page {pagination.currentPage + 1} sur {pagination.totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage >= pagination.totalPages - 1}
                >
                  Suivant
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
