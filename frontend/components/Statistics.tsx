"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  CheckCircle, 
  Clock, 
  Calendar,
  Building2,
  AlertCircle,
  BarChart3,
  PieChart
} from "lucide-react"
import { apiClient } from "@/lib/apiClient"
import { AppError } from "@/lib/errorHandler"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  LineChart,
  Line
} from "recharts"

interface StatisticsData {
  totalInvoices: number
  totalAmount: number
  validatedInvoices: number
  pendingInvoices: number
  averageAmount: number
  monthlyStats: Array<{
    month: string
    count: number
    amount: number
  }>
  supplierStats: Array<{
    supplier: string
    count: number
    amount: number
  }>
  statusDistribution: Array<{
    status: string
    count: number
    percentage: number
  }>
  recentTrend: Array<{
    date: string
    count: number
    amount: number
  }>
}

interface StatisticsProps {
  refreshTrigger: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function Statistics({ refreshTrigger }: StatisticsProps) {
  const [stats, setStats] = useState<StatisticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStatistics()
  }, [refreshTrigger])

  const fetchStatistics = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await apiClient.getStatistics()
      setStats(response.data)
    } catch (err) {
      const errorMessage = err instanceof AppError ? err.message : "Erreur lors du chargement des statistiques"
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD'
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Chargement des statistiques...</span>
          </CardContent>
        </Card>
      </div>
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

  if (!stats) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Aucune donnée statistique disponible</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Factures</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInvoices}</div>
            <p className="text-xs text-muted-foreground">
              {stats.validatedInvoices} validées, {stats.pendingInvoices} en attente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatAmount(stats.totalAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              Moyenne: {formatAmount(stats.averageAmount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Validation</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage((stats.validatedInvoices / stats.totalInvoices) * 100)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.validatedInvoices} sur {stats.totalInvoices} factures
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fournisseurs</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.supplierStats.length}</div>
            <p className="text-xs text-muted-foreground">
              Fournisseurs uniques
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution mensuelle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Évolution Mensuelle
            </CardTitle>
            <CardDescription>Nombre de factures par mois</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'count' ? `${value} factures` : formatAmount(value as number),
                    name === 'count' ? 'Nombre' : 'Montant'
                  ]}
                />
                <Bar dataKey="count" fill="#8884D8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribution des statuts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Distribution des Statuts
            </CardTitle>
            <CardDescription>Répartition des factures par statut</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Tooltip formatter={(value, name) => [`${value} factures`, name]} />
                <RechartsPieChart
                  data={stats.statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884D8"
                  dataKey="count"
                >
                  {stats.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </RechartsPieChart>
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top fournisseurs et tendance récente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top fournisseurs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Top Fournisseurs
            </CardTitle>
            <CardDescription>Fournisseurs les plus fréquents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.supplierStats.slice(0, 5).map((supplier, index) => (
                <div key={supplier.supplier} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{index + 1}</Badge>
                    <div>
                      <p className="font-medium">{supplier.supplier}</p>
                      <p className="text-sm text-muted-foreground">
                        {supplier.count} facture(s)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      {formatAmount(supplier.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tendance récente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tendance Récente
            </CardTitle>
            <CardDescription>Évolution des 7 derniers jours</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stats.recentTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'count' ? `${value} factures` : formatAmount(value as number),
                    name === 'count' ? 'Nombre' : 'Montant'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#8884D8" 
                  strokeWidth={2}
                  dot={{ fill: '#8884D8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Résumé des métriques */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Résumé des Performances
          </CardTitle>
          <CardDescription>Indicateurs clés de performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {formatPercentage((stats.validatedInvoices / stats.totalInvoices) * 100)}
              </div>
              <p className="text-sm text-muted-foreground">Taux de validation</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {formatAmount(stats.averageAmount)}
              </div>
              <p className="text-sm text-muted-foreground">Montant moyen par facture</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {stats.supplierStats.length}
              </div>
              <p className="text-sm text-muted-foreground">Fournisseurs actifs</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
