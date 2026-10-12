"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Upload, FileText, CheckCircle, AlertCircle } from "lucide-react"
import { apiClient } from "@/lib/apiClient"
import { validateFile, validateInvoiceData, AppError } from "@/lib/errorHandler"

interface OCRData {
  fournisseur: {
    ice: string | null
    if: string | null
    raison_sociale: string | null
    cnss: string | null
    rc: string | null
    patente: string | null
    adresse: string | null
  }
  client: {
    ice: string | null
    raison_sociale: string | null
  }
  facture: {
    numero_facture: string | null
    date_facture: string | null
    date_echeance: string | null
    date_livraison: string | null
    montant_ht: number | null
    montant_tva: number | null
    taux_tva: number | null
    montant_ttc: number | null
  }
}

interface InvoiceUploadProps {
  onInvoiceSaved: () => void
}

export default function InvoiceUpload({ onInvoiceSaved }: InvoiceUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [ocrData, setOcrData] = useState<OCRData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      // Validation du fichier
      const validationError = validateFile(selectedFile)
      if (validationError) {
        setError(validationError)
        return
      }

      setFile(selectedFile)
      setError(null)
      setSuccess(null)
      setOcrData(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setError(null)

    try {
      const response = await apiClient.uploadFile<OCRData>(file)
      
      // Si c'est un PDF multipage, prendre la première page
      const invoiceData = Array.isArray(response.data) ? response.data[0] : response.data
      
      setOcrData(invoiceData)
      setSuccess("OCR terminé avec succès ! Vérifiez et corrigez les données si nécessaire.")
      
    } catch (err) {
      const errorMessage = err instanceof AppError ? err.message : "Erreur lors du traitement OCR"
      setError(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSaveInvoice = async () => {
    if (!ocrData) return

    setIsSaving(true)
    setError(null)

    try {
      // Validation des données avant envoi
      const validationErrors = validateInvoiceData(ocrData)
      if (validationErrors.length > 0) {
        setError(validationErrors.join(", "))
        setIsSaving(false)
        return
      }

      const invoiceRequest = {
        supplierIce: ocrData.fournisseur.ice,
        supplierIf: ocrData.fournisseur.if,
        supplierRc: ocrData.fournisseur.rc,
        supplierPatente: ocrData.fournisseur.patente,
        supplierCnss: ocrData.fournisseur.cnss,
        supplierName: ocrData.fournisseur.raison_sociale,
        supplierAddress: ocrData.fournisseur.adresse,
        clientIce: ocrData.client.ice,
        clientName: ocrData.client.raison_sociale,
        invoiceNumber: ocrData.facture.numero_facture,
        invoiceDate: ocrData.facture.date_facture,
        dueDate: ocrData.facture.date_echeance,
        deliveryDate: ocrData.facture.date_livraison,
        amountHt: ocrData.facture.montant_ht,
        amountTva: ocrData.facture.montant_tva,
        tvaRate: ocrData.facture.taux_tva,
        amountTtc: ocrData.facture.montant_ttc,
        originalFilename: file?.name,
        isValidated: true
      }

      await apiClient.createInvoice(invoiceRequest)

      setSuccess("Facture sauvegardée avec succès !")
      setOcrData(null)
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // Notifier le composant parent
      onInvoiceSaved()
      
    } catch (err) {
      const errorMessage = err instanceof AppError ? err.message : "Erreur lors de la sauvegarde"
      setError(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setOcrData(null)
    setError(null)
    setSuccess(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload de Facture
          </CardTitle>
          <CardDescription>
            Téléchargez une facture (image ou PDF) pour extraire automatiquement les informations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Sélectionner un fichier</Label>
            <Input
              ref={fileInputRef}
              id="file"
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            <p className="text-sm text-muted-foreground">
              Formats supportés: JPG, PNG, PDF (max 10MB)
            </p>
          </div>

          {file && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <FileText className="h-4 w-4" />
              <span className="text-sm font-medium">{file.name}</span>
              <span className="text-sm text-muted-foreground">
                ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={handleUpload} 
              disabled={!file || isUploading}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Traitement OCR...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Traiter avec OCR
                </>
              )}
            </Button>
            
            {file && (
              <Button variant="outline" onClick={handleReset}>
                Annuler
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {ocrData && (
        <Card>
          <CardHeader>
            <CardTitle>Données extraites</CardTitle>
            <CardDescription>
              Vérifiez et corrigez les informations extraites avant de sauvegarder
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Fournisseur */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Fournisseur</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier-name">Raison sociale</Label>
                  <Input
                    id="supplier-name"
                    value={ocrData.fournisseur.raison_sociale || ''}
                    onChange={(e) => setOcrData({
                      ...ocrData,
                      fournisseur: { ...ocrData.fournisseur, raison_sociale: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier-ice">ICE</Label>
                  <Input
                    id="supplier-ice"
                    value={ocrData.fournisseur.ice || ''}
                    onChange={(e) => setOcrData({
                      ...ocrData,
                      fournisseur: { ...ocrData.fournisseur, ice: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier-if">IF</Label>
                  <Input
                    id="supplier-if"
                    value={ocrData.fournisseur.if || ''}
                    onChange={(e) => setOcrData({
                      ...ocrData,
                      fournisseur: { ...ocrData.fournisseur, if: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier-rc">RC</Label>
                  <Input
                    id="supplier-rc"
                    value={ocrData.fournisseur.rc || ''}
                    onChange={(e) => setOcrData({
                      ...ocrData,
                      fournisseur: { ...ocrData.fournisseur, rc: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier-patente">Patente</Label>
                  <Input
                    id="supplier-patente"
                    value={ocrData.fournisseur.patente || ''}
                    onChange={(e) => setOcrData({
                      ...ocrData,
                      fournisseur: { ...ocrData.fournisseur, patente: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier-cnss">CNSS</Label>
                  <Input
                    id="supplier-cnss"
                    value={ocrData.fournisseur.cnss || ''}
                    onChange={(e) => setOcrData({
                      ...ocrData,
                      fournisseur: { ...ocrData.fournisseur, cnss: e.target.value }
                    })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier-address">Adresse</Label>
                <Textarea
                  id="supplier-address"
                  value={ocrData.fournisseur.adresse || ''}
                  onChange={(e) => setOcrData({
                    ...ocrData,
                    fournisseur: { ...ocrData.fournisseur, adresse: e.target.value }
                  })}
                  rows={3}
                />
              </div>
            </div>

            {/* Client */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Client</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client-name">Raison sociale</Label>
                  <Input
                    id="client-name"
                    value={ocrData.client.raison_sociale || ''}
                    onChange={(e) => setOcrData({
                      ...ocrData,
                      client: { ...ocrData.client, raison_sociale: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-ice">ICE</Label>
                  <Input
                    id="client-ice"
                    value={ocrData.client.ice || ''}
                    onChange={(e) => setOcrData({
                      ...ocrData,
                      client: { ...ocrData.client, ice: e.target.value }
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Facture */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Facture</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice-number">Numéro de facture</Label>
                  <Input
                    id="invoice-number"
                    value={ocrData.facture.numero_facture || ''}
                    onChange={(e) => setOcrData({
                      ...ocrData,
                      facture: { ...ocrData.facture, numero_facture: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoice-date">Date de facture</Label>
                  <Input
                    id="invoice-date"
                    type="date"
                    value={ocrData.facture.date_facture || ''}
                    onChange={(e) => setOcrData({
                      ...ocrData,
                      facture: { ...ocrData.facture, date_facture: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due-date">Date d'échéance</Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={ocrData.facture.date_echeance || ''}
                    onChange={(e) => setOcrData({
                      ...ocrData,
                      facture: { ...ocrData.facture, date_echeance: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery-date">Date de livraison</Label>
                  <Input
                    id="delivery-date"
                    type="date"
                    value={ocrData.facture.date_livraison || ''}
                    onChange={(e) => setOcrData({
                      ...ocrData,
                      facture: { ...ocrData.facture, date_livraison: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount-ht">Montant HT</Label>
                  <Input
                    id="amount-ht"
                    type="number"
                    step="0.01"
                    value={ocrData.facture.montant_ht || ''}
                    onChange={(e) => setOcrData({
                      ...ocrData,
                      facture: { ...ocrData.facture, montant_ht: parseFloat(e.target.value) || null }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount-tva">Montant TVA</Label>
                  <Input
                    id="amount-tva"
                    type="number"
                    step="0.01"
                    value={ocrData.facture.montant_tva || ''}
                    onChange={(e) => setOcrData({
                      ...ocrData,
                      facture: { ...ocrData.facture, montant_tva: parseFloat(e.target.value) || null }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tva-rate">Taux TVA (%)</Label>
                  <Input
                    id="tva-rate"
                    type="number"
                    value={ocrData.facture.taux_tva || ''}
                    onChange={(e) => setOcrData({
                      ...ocrData,
                      facture: { ...ocrData.facture, taux_tva: parseInt(e.target.value) || null }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount-ttc">Montant TTC</Label>
                  <Input
                    id="amount-ttc"
                    type="number"
                    step="0.01"
                    value={ocrData.facture.montant_ttc || ''}
                    onChange={(e) => setOcrData({
                      ...ocrData,
                      facture: { ...ocrData.facture, montant_ttc: parseFloat(e.target.value) || null }
                    })}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleSaveInvoice} 
                disabled={isSaving}
                className="flex-1"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Sauvegarder la facture
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
