package com.example.projetstageocr.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceResponse {
    private Long id;
    
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
    private Boolean isValidated;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
