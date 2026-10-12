package com.example.projetstageocr.repository;

import com.example.projetstageocr.entity.Invoice;
import com.example.projetstageocr.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> , JpaSpecificationExecutor<Invoice> {
    
    // Trouver toutes les factures d'un utilisateur
    Page<Invoice> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
    
    // Trouver une facture par ID et utilisateur (sécurité)
    Optional<Invoice> findByIdAndUser(Long id, User user);
    
    // Recherche par numéro de facture pour un utilisateur
    List<Invoice> findByUserAndInvoiceNumberContainingIgnoreCase(User user, String invoiceNumber);
    
    // Recherche par fournisseur pour un utilisateur
    List<Invoice> findByUserAndSupplierNameContainingIgnoreCase(User user, String supplierName);
    
    // Recherche par date pour un utilisateur
    List<Invoice> findByUserAndInvoiceDateBetween(User user, LocalDate startDate, LocalDate endDate);
    
    // Statistiques pour un utilisateur
    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.user = :user")
    Long countByUser(@Param("user") User user);
    
    @Query("SELECT SUM(i.amountTtc) FROM Invoice i WHERE i.user = :user")
    BigDecimal sumTotalAmountByUser(@Param("user") User user);
    
    // Factures récentes
    @Query("SELECT i FROM Invoice i WHERE i.user = :user ORDER BY i.createdAt DESC")
    List<Invoice> findRecentInvoicesByUser(@Param("user") User user, Pageable pageable);
    
    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.user = :user AND i.isValidated = true")
    Long countValidatedByUser(@Param("user") User user);
    
    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.user = :user AND i.isValidated = false")
    Long countPendingByUser(@Param("user") User user);
    
    // Statistiques mensuelles
    @Query("SELECT FUNCTION('DATE_FORMAT', i.invoiceDate, '%Y-%m') as month, " +
           "COUNT(i) as count, SUM(i.amountTtc) as amount " +
           "FROM Invoice i WHERE i.user = :user " +
           "GROUP BY FUNCTION('DATE_FORMAT', i.invoiceDate, '%Y-%m') " +
           "ORDER BY month DESC")
    List<Object[]> getMonthlyStatsByUser(@Param("user") User user);
    
    // Statistiques par fournisseur
    @Query("SELECT i.supplierName as supplier, COUNT(i) as count, SUM(i.amountTtc) as amount " +
           "FROM Invoice i WHERE i.user = :user AND i.supplierName IS NOT NULL " +
           "GROUP BY i.supplierName " +
           "ORDER BY count DESC")
    List<Object[]> getSupplierStatsByUser(@Param("user") User user);
    
    // Tendance récente (7 derniers jours)
    @Query("SELECT FUNCTION('DATE', i.createdAt) as date, COUNT(i) as count, SUM(i.amountTtc) as amount " +
           "FROM Invoice i WHERE i.user = :user AND i.createdAt >= :startDate " +
           "GROUP BY FUNCTION('DATE', i.createdAt) " +
           "ORDER BY date DESC")
    List<Object[]> getRecentTrendByUser(@Param("user") User user, @Param("startDate") LocalDateTime startDate);
}
