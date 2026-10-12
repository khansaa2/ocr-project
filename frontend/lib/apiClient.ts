// lib/apiClient.ts
import { authService } from './authService'
import { handleApiError, AppError } from './errorHandler'

export interface ApiResponse<T> {
  data: T
  status: number
  message?: string
}

class ApiClient {
  private readonly SPRING_BOOT_URL = process.env.NEXT_PUBLIC_SPRING_BOOT_URL || "http://localhost:8080"
  private readonly FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000"

  private async makeRequest<T>(
    url: string,
    options: RequestInit = {},
    useAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers as Record<string, string>
      }

      // Ajouter l'authentification si nécessaire
      if (useAuth) {
        const authHeaders = authService.getAuthHeaders()
        Object.assign(headers, authHeaders)
      }

      const response = await fetch(url, {
        ...options,
        headers
      })

      // Vérifier si la réponse est ok
      if (!response.ok) {
        throw {
          response: {
            status: response.status,
            data: await response.json().catch(() => ({}))
          }
        }
      }

      const data = await response.json()
      
      return {
        data,
        status: response.status,
        message: response.statusText
      }
    } catch (error) {
      throw handleApiError(error)
    }
  }

  // Méthodes pour Spring Boot (avec authentification)
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(`${this.SPRING_BOOT_URL}${endpoint}`, {
      method: 'GET'
    })
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(`${this.SPRING_BOOT_URL}${endpoint}`, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(`${this.SPRING_BOOT_URL}${endpoint}`, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(`${this.SPRING_BOOT_URL}${endpoint}`, {
      method: 'DELETE'
    })
  }

  // Méthodes pour FastAPI (sans authentification)
  async uploadFile<T>(file: File): Promise<ApiResponse<T>> {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${this.FASTAPI_URL}/process-invoice`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw {
          response: {
            status: response.status,
            data: await response.json().catch(() => ({}))
          }
        }
      }

      const data = await response.json()
      
      return {
        data,
        status: response.status,
        message: response.statusText
      }
    } catch (error) {
      throw handleApiError(error)
    }
  }

  // Méthodes spécifiques pour les factures
  async getInvoices(page: number = 0, size: number = 10, search?: string, status?: string, dateFrom?: string, dateTo?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString()
    })
    
    if (search) params.append('search', search)
    if (status && status !== 'all') params.append('status', status)
    if (dateFrom) params.append('dateFrom', dateFrom)
    if (dateTo) params.append('dateTo', dateTo)
    
    return this.get(`/api/invoices?${params.toString()}`)
  }

  async getInvoicesList() {
    return this.get('/api/invoices/list')
  }

  async getInvoiceById(id: number) {
    return this.get(`/api/invoices/${id}`)
  }

  async createInvoice(invoiceData: any) {
    return this.post('/api/invoices', invoiceData)
  }

  async updateInvoice(id: number, invoiceData: any) {
    return this.put(`/api/invoices/${id}`, invoiceData)
  }

  async deleteInvoice(id: number) {
    return this.delete(`/api/invoices/${id}`)
  }

  async getStatistics() {
    return this.get('/api/invoices/stats')
  }

  // Méthodes d'authentification
  async login(credentials: { username: string; password: string }) {
    return this.makeRequest<any>(`${this.SPRING_BOOT_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify(credentials)
    }, false) // Pas d'authentification pour le login
  }

  async register(userData: { username: string; email: string; password: string }) {
    return this.makeRequest<any>(`${this.SPRING_BOOT_URL}/auth/register`, {
      method: 'POST',
      body: JSON.stringify(userData)
    }, false) // Pas d'authentification pour l'inscription
  }
}

export const apiClient = new ApiClient()
