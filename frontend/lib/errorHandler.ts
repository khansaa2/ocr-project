// lib/errorHandler.ts
export interface ApiError {
  message: string
  status?: number
  code?: string
  details?: any
}

export class AppError extends Error {
  public status?: number
  public code?: string
  public details?: any

  constructor(message: string, status?: number, code?: string, details?: any) {
    super(message)
    this.name = 'AppError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export const errorMessages = {
  // Erreurs d'authentification
  AUTH_INVALID_CREDENTIALS: "Nom d'utilisateur ou mot de passe incorrect",
  AUTH_TOKEN_EXPIRED: "Votre session a expiré, veuillez vous reconnecter",
  AUTH_TOKEN_INVALID: "Token d'authentification invalide",
  AUTH_UNAUTHORIZED: "Vous n'êtes pas autorisé à effectuer cette action",
  
  // Erreurs de validation
  VALIDATION_REQUIRED_FIELD: "Ce champ est obligatoire",
  VALIDATION_INVALID_EMAIL: "Adresse email invalide",
  VALIDATION_PASSWORD_TOO_SHORT: "Le mot de passe doit contenir au moins 6 caractères",
  VALIDATION_PASSWORDS_DONT_MATCH: "Les mots de passe ne correspondent pas",
  VALIDATION_USERNAME_TOO_SHORT: "Le nom d'utilisateur doit contenir au moins 3 caractères",
  
  // Erreurs de fichier
  FILE_TOO_LARGE: "Le fichier est trop volumineux (max 10MB)",
  FILE_INVALID_TYPE: "Type de fichier non supporté",
  FILE_UPLOAD_FAILED: "Échec de l'upload du fichier",
  
  // Erreurs OCR
  OCR_PROCESSING_FAILED: "Échec du traitement OCR",
  OCR_NO_TEXT_FOUND: "Aucun texte détecté dans le fichier",
  OCR_INVALID_FORMAT: "Format de fichier non supporté pour l'OCR",
  
  // Erreurs réseau
  NETWORK_ERROR: "Erreur de connexion réseau",
  SERVER_ERROR: "Erreur du serveur",
  TIMEOUT_ERROR: "Délai d'attente dépassé",
  
  // Erreurs génériques
  UNKNOWN_ERROR: "Une erreur inattendue s'est produite",
  VALIDATION_ERROR: "Erreur de validation des données"
}

export const handleApiError = (error: any): AppError => {
  if (error instanceof AppError) {
    return error
  }

  // Erreur de réseau
  if (!error.response) {
    return new AppError(
      errorMessages.NETWORK_ERROR,
      0,
      'NETWORK_ERROR',
      { originalError: error.message }
    )
  }

  const { status, data } = error.response
  
  // Erreurs spécifiques selon le code de statut
  switch (status) {
    case 400:
      return new AppError(
        data?.message || errorMessages.VALIDATION_ERROR,
        400,
        'VALIDATION_ERROR',
        data
      )
    case 401:
      return new AppError(
        data?.message || errorMessages.AUTH_UNAUTHORIZED,
        401,
        'AUTH_UNAUTHORIZED',
        data
      )
    case 403:
      return new AppError(
        "Accès refusé",
        403,
        'FORBIDDEN',
        data
      )
    case 404:
      return new AppError(
        "Ressource non trouvée",
        404,
        'NOT_FOUND',
        data
      )
    case 409:
      return new AppError(
        data?.message || "Conflit de données",
        409,
        'CONFLICT',
        data
      )
    case 413:
      return new AppError(
        errorMessages.FILE_TOO_LARGE,
        413,
        'FILE_TOO_LARGE',
        data
      )
    case 415:
      return new AppError(
        errorMessages.FILE_INVALID_TYPE,
        415,
        'FILE_INVALID_TYPE',
        data
      )
    case 500:
      return new AppError(
        errorMessages.SERVER_ERROR,
        500,
        'SERVER_ERROR',
        data
      )
    default:
      return new AppError(
        data?.message || errorMessages.UNKNOWN_ERROR,
        status,
        'UNKNOWN_ERROR',
        data
      )
  }
}

export const validateFile = (file: File): string | null => {
  // Vérifier la taille (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return errorMessages.FILE_TOO_LARGE
  }

  // Vérifier le type de fichier
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'application/pdf'
  ]
  
  if (!allowedTypes.includes(file.type)) {
    return errorMessages.FILE_INVALID_TYPE
  }

  return null
}

export const validateInvoiceData = (data: any): string[] => {
  const errors: string[] = []

  // Validation du numéro de facture
  if (!data.facture?.numero_facture?.trim()) {
    errors.push("Le numéro de facture est obligatoire")
  }

  // Validation du fournisseur
  if (!data.fournisseur?.raison_sociale?.trim()) {
    errors.push("La raison sociale du fournisseur est obligatoire")
  }

  // Validation des montants
  if (data.facture?.montant_ht && data.facture.montant_ht < 0) {
    errors.push("Le montant HT ne peut pas être négatif")
  }

  if (data.facture?.montant_tva && data.facture.montant_tva < 0) {
    errors.push("Le montant TVA ne peut pas être négatif")
  }

  if (data.facture?.montant_ttc && data.facture.montant_ttc < 0) {
    errors.push("Le montant TTC ne peut pas être négatif")
  }

  // Validation du taux TVA
  if (data.facture?.taux_tva && (data.facture.taux_tva < 0 || data.facture.taux_tva > 100)) {
    errors.push("Le taux TVA doit être entre 0 et 100%")
  }

  return errors
}

export const showErrorToast = (error: AppError | string) => {
  const message = typeof error === 'string' ? error : error.message
  
  // Utiliser le système de toast de votre UI library
  // Exemple avec react-hot-toast ou sonner
  if (typeof window !== 'undefined') {
    // Implémentation dépendante de votre système de toast
    console.error('Error:', message)
  }
}
