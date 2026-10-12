"use client"

import type React from "react"
import { useState } from "react"
import { authService, LoginRequest } from "@/lib/authService"

interface LoginProps {
  onLogin: () => void
  onSwitchToRegister: () => void
}

export default function Login({ onLogin, onSwitchToRegister }: LoginProps) {
  const [formData, setFormData] = useState<LoginRequest>({
    username: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await authService.login(formData)
      onLogin()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="fade-in">
      <div className="text-center mb-4">
        <h2
          className="fw-bold"
          style={{
            background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Se connecter
        </h2>
        <p className="text-muted">Accédez à votre tableau de bord</p>
      </div>

      {error && (
        <div className="alert alert-danger mb-3" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="username" className="form-label fw-medium">
            👤 Nom d'utilisateur
          </label>
          <input
            type="text"
            className="form-control"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="votre_nom_utilisateur"
            required
            disabled={isLoading}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="password" className="form-label fw-medium">
            🔒 Mot de passe
          </label>
          <input
            type="password"
            className="form-control"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary w-100 mb-3 d-flex align-items-center justify-content-center"
          disabled={isLoading}
          style={{ height: "48px" }}
        >
          {isLoading ? (
            <>
              <div className="spinner-border spinner-border-sm me-2" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              Connexion...
            </>
          ) : (
            <>
              <span className="me-2">🚀</span>
              Se connecter
            </>
          )}
        </button>
      </form>

      <div className="text-center">
        <p className="mb-0 text-muted">
          Pas encore de compte ?{" "}
          <button
            type="button"
            className="btn btn-link p-0 fw-medium"
            onClick={onSwitchToRegister}
            style={{ color: "var(--primary)" }}
            disabled={isLoading}
          >
            S'inscrire ici
          </button>
        </p>
      </div>
    </div>
  )
}