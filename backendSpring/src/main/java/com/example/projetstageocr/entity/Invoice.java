package com.example.projetstageocr.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
@Entity
@Table(name = "invoices")
public class Invoice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Fournisseur
    @Column(name = "supplier_ice")
    private String supplierIce;
    
    @Column(name = "supplier_if")
    private String supplierIf;
    
    @Column(name = "supplier_rc")
    private String supplierRc;
    
    @Column(name = "supplier_patente")
    private String supplierPatente;
    
    @Column(name = "supplier_cnss")
    private String supplierCnss;
    
    @Column(name = "supplier_name")
    private String supplierName;
    
    @Column(name = "supplier_address", columnDefinition = "TEXT")
    private String supplierAddress;

    // Client
    @Column(name = "client_ice")
    private String clientIce;
    
    @Column(name = "client_name")
    private String clientName;

    // Facture
    @NotBlank
    @Column(name = "invoice_number", nullable = false)
    private String invoiceNumber;
    
    @Column(name = "invoice_date")
    private LocalDate invoiceDate;
    
    @Column(name = "due_date")
    private LocalDate dueDate;
    
    @Column(name = "delivery_date")
    private LocalDate deliveryDate;
    
    @Column(name = "amount_ht", precision = 10, scale = 2)
    private BigDecimal amountHt;
    
    @Column(name = "amount_tva", precision = 10, scale = 2)
    private BigDecimal amountTva;
    
    @Column(name = "tva_rate")
    private Integer tvaRate;
    
    @Column(name = "amount_ttc", precision = 10, scale = 2)
    private BigDecimal amountTtc;

    // Métadonnées
    @Column(name = "original_filename")
    private String originalFilename;
    
    @Column(name = "file_path")
    private String filePath;
    
    @Column(name = "ocr_confidence")
    private Double ocrConfidence;
    
    @Column(name = "is_validated")
    private Boolean isValidated = false;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
