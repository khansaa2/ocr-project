package com.example.projetstageocr.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceRequest {
    
    // Fournisseur
    private String supplierIce;
    private String supplierIf;
    private String supplierRc;
    private String supplierPatente;
    private String supplierCnss;
    private String supplierName;
    private String supplierAddress;

    // Client
    private String clientIce;
    private String clientName;

    // Facture
    @NotBlank(message = "Le numéro de facture est obligatoire")
    private String invoiceNumber;
    
    private LocalDate invoiceDate;
    private LocalDate dueDate;
    private LocalDate deliveryDate;
    
    private BigDecimal amountHt;
    private BigDecimal amountTva;
    private Integer tvaRate;
    private BigDecimal amountTtc;

    // Métadonnées
    private String originalFilename;
    private String filePath;
    private Double ocrConfidence;
    private Boolean isValidated = false;
}
