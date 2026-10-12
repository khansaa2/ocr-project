"use client"

import { useState, useEffect } from "react"
import Register from "../components/Register"
import Login from "../components/Login"
import Dashboard from "../components/Dashboard"
import { authService } from "../lib/authService"

export default function Home() {
  const [currentView, setCurrentView] = useState<"login" | "register" | "dashboard">("login")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isValid = await authService.refreshTokenIfNeeded()
        if (isValid && authService.isAuthenticated()) {
          setIsAuthenticated(true)
          setCurrentView("dashboard")
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de l'authentification:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const handleLogin = () => {
    setIsAuthenticated(true)
    setCurrentView("dashboard")
  }

  const handleLogout = () => {
    authService.logout()
    setIsAuthenticated(false)
    setCurrentView("login")
  }

  if (isLoading) {
    return (
      <div className="auth-container d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-3 text-muted">Vérification de l'authentification...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated && currentView === "dashboard") {
    return <Dashboard onLogout={handleLogout} />
  }

  return (
    <div className="auth-container d-flex align-items-center justify-content-center">
      <div className="auth-card">
        {currentView === "login" ? (
          <Login onLogin={handleLogin} onSwitchToRegister={() => setCurrentView("register")} />
        ) : (
          <Register onSwitchToLogin={() => setCurrentView("login")} />
        )}
      </div>
    </div>
  )
}
