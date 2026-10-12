"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, FileText, Calendar, DollarSign, Building2, User, AlertCircle } from "lucide-react"
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
}

interface InvoiceListProps {
  refreshTrigger: number
}

export default function InvoiceList({ refreshTrigger }: InvoiceListProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchInvoices()
  }, [refreshTrigger])

  const fetchInvoices = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await apiClient.getInvoicesList()
      setInvoices(response.data)
      
    } catch (err) {
      const errorMessage = err instanceof AppError ? err.message : "Erreur lors du chargement des factures"
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD'
    }).format(amount)
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
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Mes Factures ({invoices.length})
        </CardTitle>
        <CardDescription>
          Liste de toutes les factures enregistrées
        </CardDescription>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune facture enregistrée</p>
            <p className="text-sm">Commencez par uploader votre première facture</p>
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <Card key={invoice.id} className="border-l-4 border-l-blue-500">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{invoice.invoiceNumber}</h3>
                        <Badge variant={invoice.isValidated ? "default" : "secondary"}>
                          {invoice.isValidated ? "Validée" : "En attente"}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Building2 className="h-4 w-4" />
                            <span className="font-medium">Fournisseur:</span>
                            <span>{invoice.supplierName}</span>
                          </div>
                          {invoice.supplierIce && (
                            <div className="ml-6 text-muted-foreground">
                              ICE: {invoice.supplierIce}
        </div>
                          )}
      </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span className="font-medium">Client:</span>
                            <span>{invoice.clientName || "Non spécifié"}</span>
        </div>
            </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span className="font-medium">Date:</span>
                            <span>{formatDate(invoice.invoiceDate)}</span>
            </div>
            </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <DollarSign className="h-4 w-4" />
                            <span className="font-medium">Montant:</span>
                            <span className="font-semibold text-green-600">
                              {formatAmount(invoice.amountTtc)}
                            </span>
            </div>
          </div>
        </div>
                      
                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        Créée le {formatDate(invoice.createdAt)}
                      </div>
      </div>

                    <div className="flex gap-2 ml-4">
                      <Button variant="outline" size="sm">
                        Voir détails
                      </Button>
                      <Button variant="outline" size="sm">
                        Modifier
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>
        )}
      </CardContent>
    </Card>
  )
}