"use client"

import type React from "react"
import { useState } from "react"
import { authService, RegisterRequest } from "@/lib/authService"

interface RegisterProps {
  onSwitchToLogin: () => void
}

export default function Register({ onSwitchToLogin }: RegisterProps) {
  const [formData, setFormData] = useState<RegisterRequest & { confirmPassword: string }>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const [errors, setErrors] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors([])

    // Validation côté client
    const newErrors: string[] = []

    if (formData.password !== formData.confirmPassword) {
      newErrors.push("Les mots de passe ne correspondent pas")
    }

    if (formData.password.length < 6) {
      newErrors.push("Le mot de passe doit contenir au moins 6 caractères")
    }

    if (formData.username.length < 3) {
      newErrors.push("Le nom d'utilisateur doit contenir au moins 3 caractères")
    }

    if (newErrors.length > 0) {
      setErrors(newErrors)
      setIsLoading(false)
      return
    }

    try {
      const { confirmPassword, ...registerData } = formData
      await authService.register(registerData)
      
      // Rediriger vers le login après inscription réussie
      onSwitchToLogin()
    } catch (err) {
      setErrors([err instanceof Error ? err.message : "Erreur lors de l'inscription"])
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
          S'inscrire
        </h2>
        <p className="text-muted">Créez votre compte pour commencer</p>
      </div>

      {errors.length > 0 && (
        <div className="alert alert-danger mb-3" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          <ul className="mb-0">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
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

        <div className="mb-3">
          <label htmlFor="email" className="form-label fw-medium">
            📧 Email
          </label>
          <input
            type="email"
            className="form-control"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="votre@email.com"
            required
            disabled={isLoading}
          />
        </div>

        <div className="mb-3">
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

        <div className="mb-4">
          <label htmlFor="confirmPassword" className="form-label fw-medium">
            🔒 Confirmation du mot de passe
          </label>
          <input
            type="password"
            className="form-control"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
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
              Inscription...
            </>
          ) : (
            <>
              <span className="me-2">✨</span>
              S'inscrire
            </>
          )}
        </button>
      </form>

      <div className="text-center">
        <p className="mb-0 text-muted">
          Déjà un compte ?{" "}
          <button
            type="button"
            className="btn btn-link p-0 fw-medium"
            onClick={onSwitchToLogin}
            style={{ color: "var(--primary)" }}
            disabled={isLoading}
          >
            Se connecter
          </button>
        </p>
      </div>
    </div>
  )
}