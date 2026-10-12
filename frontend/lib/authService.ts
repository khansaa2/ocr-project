// services/authService.ts
import { apiClient } from './apiClient'
import { AppError } from './errorHandler'

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  username: string
  email: string
  role: string
}

export interface User {
  username: string
  email: string
  role: string
}

class AuthService {
  private readonly TOKEN_KEY = 'jwt_token'
  private readonly USER_KEY = 'user_data'

  // Login
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.login(credentials)
      const data: AuthResponse = response.data
      
      // Stocker le token et les données utilisateur
      this.setToken(data.token)
      this.setUser({
        username: data.username,
        email: data.email,
        role: data.role
      })

      return data
    } catch (error) {
      console.error('Erreur lors de la connexion:', error)
      throw error
    }
  }

  // Register
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.register(userData)
      const data: AuthResponse = response.data
      
      // Stocker le token et les données utilisateur
      this.setToken(data.token)
      this.setUser({
        username: data.username,
        email: data.email,
        role: data.role
      })

      return data
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error)
      throw error
    }
  }

  // Logout
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY)
    localStorage.removeItem(this.USER_KEY)
  }

  // Vérifier si l'utilisateur est connecté
  isAuthenticated(): boolean {
    return !!this.getToken()
  }

  // Obtenir le token
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY)
  }

  // Définir le token
  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token)
  }

  // Obtenir les données utilisateur
  getUser(): User | null {
    const userData = localStorage.getItem(this.USER_KEY)
    return userData ? JSON.parse(userData) : null
  }

  // Définir les données utilisateur
  private setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user))
  }

  // Obtenir les headers d'authentification
  getAuthHeaders(): Record<string, string> {
    const token = this.getToken()
    return token ? { 'Authorization': `Bearer ${token}` } : {}
  }

  // Vérifier si le token est expiré (basique)
  isTokenExpired(): boolean {
    const token = this.getToken()
    if (!token) return true

    try {
      // Décoder le payload du JWT (sans vérification de signature)
      const payload = JSON.parse(atob(token.split('.')[1]))
      const currentTime = Math.floor(Date.now() / 1000)
      
      // Vérifier si le token est expiré
      return payload.exp < currentTime
    } catch (error) {
      console.error('Erreur lors de la vérification du token:', error)
      return true
    }
  }

  // Rafraîchir automatiquement le token si nécessaire
  async refreshTokenIfNeeded(): Promise<boolean> {
    if (this.isTokenExpired()) {
      this.logout()
      return false
    }
    return true
  }
}

export const authService = new AuthService()
