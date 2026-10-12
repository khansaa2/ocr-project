package com.example.projetstageocr.service;

import com.example.projetstageocr.dto.InvoiceRequest;
import com.example.projetstageocr.dto.InvoiceResponse;
import com.example.projetstageocr.dto.StatisticsResponse;
import com.example.projetstageocr.entity.Invoice;
import com.example.projetstageocr.entity.User;
import com.example.projetstageocr.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;

    public InvoiceResponse createInvoice(InvoiceRequest request, User user) {
        Invoice invoice = Invoice.builder()
                .user(user)
                .supplierIce(request.getSupplierIce())
                .supplierIf(request.getSupplierIf())
                .supplierRc(request.getSupplierRc())
                .supplierPatente(request.getSupplierPatente())
                .supplierCnss(request.getSupplierCnss())
                .supplierName(request.getSupplierName())
                .supplierAddress(request.getSupplierAddress())
                .clientIce(request.getClientIce())
                .clientName(request.getClientName())
                .invoiceNumber(request.getInvoiceNumber())
                .invoiceDate(request.getInvoiceDate())
                .dueDate(request.getDueDate())
                .deliveryDate(request.getDeliveryDate())
                .amountHt(request.getAmountHt())
                .amountTva(request.getAmountTva())
                .tvaRate(request.getTvaRate())
                .amountTtc(request.getAmountTtc())
                .originalFilename(request.getOriginalFilename())
                .filePath(request.getFilePath())
                .ocrConfidence(request.getOcrConfidence())
                .isValidated(request.getIsValidated())
                .build();

        Invoice savedInvoice = invoiceRepository.save(invoice);
        return mapToResponse(savedInvoice);
    }

    @Transactional(readOnly = true)
    public Page<InvoiceResponse> getUserInvoices(User user, Pageable pageable, String search, String status, String dateFrom, String dateTo) {
        Specification<Invoice> spec = Specification.where((root, query, cb) -> cb.equal(root.get("user"), user));
        
        // Recherche textuelle
        if (search != null && !search.trim().isEmpty()) {
            Specification<Invoice> searchSpec = Specification.where((root, query, cb) -> 
                cb.or(
                    cb.like(cb.lower(root.get("invoiceNumber")), "%" + search.toLowerCase() + "%"),
                    cb.like(cb.lower(root.get("supplierName")), "%" + search.toLowerCase() + "%"),
                    cb.like(cb.lower(root.get("clientName")), "%" + search.toLowerCase() + "%"),
                    cb.like(cb.lower(root.get("supplierIce")), "%" + search.toLowerCase() + "%")
                )
            );
            spec = spec.and(searchSpec);
        }
        
        // Filtre par statut
        if (status != null && !status.equals("all")) {
            boolean isValidated = status.equals("validated");
            Specification<Invoice> statusSpec = Specification.where((root, query, cb) -> 
                cb.equal(root.get("isValidated"), isValidated)
            );
            spec = spec.and(statusSpec);
        }
        
        // Filtre par date
        if (dateFrom != null && !dateFrom.trim().isEmpty()) {
            try {
                LocalDate fromDate = LocalDate.parse(dateFrom, DateTimeFormatter.ISO_LOCAL_DATE);
                Specification<Invoice> dateFromSpec = Specification.where((root, query, cb) -> 
                    cb.greaterThanOrEqualTo(root.get("invoiceDate"), fromDate)
                );
                spec = spec.and(dateFromSpec);
            } catch (Exception e) {
                // Ignorer les dates invalides
            }
        }
        
        if (dateTo != null && !dateTo.trim().isEmpty()) {
            try {
                LocalDate toDate = LocalDate.parse(dateTo, DateTimeFormatter.ISO_LOCAL_DATE);
                Specification<Invoice> dateToSpec = Specification.where((root, query, cb) -> 
                    cb.lessThanOrEqualTo(root.get("invoiceDate"), toDate)
                );
                spec = spec.and(dateToSpec);
            } catch (Exception e) {
                // Ignorer les dates invalides
            }
        }
        
        Page<Invoice> invoices = invoiceRepository.findAll(spec, pageable);
        return invoices.map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> getUserInvoicesList(User user) {
        List<Invoice> invoices = invoiceRepository.findByUserOrderByCreatedAtDesc(user, Pageable.unpaged()).getContent();
        return invoices.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceById(Long id, User user) {
        Invoice invoice = invoiceRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Facture non trouvée"));
        return mapToResponse(invoice);
    }

    public InvoiceResponse updateInvoice(Long id, InvoiceRequest request, User user) {
        Invoice invoice = invoiceRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Facture non trouvée"));

        // Mise à jour des champs
        invoice.setSupplierIce(request.getSupplierIce());
        invoice.setSupplierIf(request.getSupplierIf());
        invoice.setSupplierRc(request.getSupplierRc());
        invoice.setSupplierPatente(request.getSupplierPatente());
        invoice.setSupplierCnss(request.getSupplierCnss());
        invoice.setSupplierName(request.getSupplierName());
        invoice.setSupplierAddress(request.getSupplierAddress());
        invoice.setClientIce(request.getClientIce());
        invoice.setClientName(request.getClientName());
        invoice.setInvoiceNumber(request.getInvoiceNumber());
        invoice.setInvoiceDate(request.getInvoiceDate());
        invoice.setDueDate(request.getDueDate());
        invoice.setDeliveryDate(request.getDeliveryDate());
        invoice.setAmountHt(request.getAmountHt());
        invoice.setAmountTva(request.getAmountTva());
        invoice.setTvaRate(request.getTvaRate());
        invoice.setAmountTtc(request.getAmountTtc());
        invoice.setIsValidated(request.getIsValidated());

        Invoice updatedInvoice = invoiceRepository.save(invoice);
        return mapToResponse(updatedInvoice);
    }

    public void deleteInvoice(Long id, User user) {
        Invoice invoice = invoiceRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Facture non trouvée"));
        invoiceRepository.delete(invoice);
    }

    @Transactional(readOnly = true)
    public StatisticsResponse getStatistics(User user) {
        // Statistiques générales
        Long totalInvoices = invoiceRepository.countByUser(user);
        BigDecimal totalAmount = invoiceRepository.sumTotalAmountByUser(user);
        Long validatedInvoices = invoiceRepository.countValidatedByUser(user);
        Long pendingInvoices = invoiceRepository.countPendingByUser(user);
        
        BigDecimal averageAmount = totalInvoices > 0 ? 
            totalAmount.divide(BigDecimal.valueOf(totalInvoices), 2, BigDecimal.ROUND_HALF_UP) : 
            BigDecimal.ZERO;

        // Statistiques mensuelles
        List<Object[]> monthlyData = invoiceRepository.getMonthlyStatsByUser(user);
        List<StatisticsResponse.MonthlyStat> monthlyStats = monthlyData.stream()
            .map(row -> StatisticsResponse.MonthlyStat.builder()
                .month((String) row[0])
                .count(((Number) row[1]).longValue())
                .amount((BigDecimal) row[2])
                .build())
            .collect(Collectors.toList());

        // Statistiques par fournisseur
        List<Object[]> supplierData = invoiceRepository.getSupplierStatsByUser(user);
        List<StatisticsResponse.SupplierStat> supplierStats = supplierData.stream()
            .map(row -> StatisticsResponse.SupplierStat.builder()
                .supplier((String) row[0])
                .count(((Number) row[1]).longValue())
                .amount((BigDecimal) row[2])
                .build())
            .collect(Collectors.toList());

        // Distribution des statuts
        List<StatisticsResponse.StatusDistribution> statusDistribution = new ArrayList<>();
        if (totalInvoices > 0) {
            double validatedPercentage = (validatedInvoices.doubleValue() / totalInvoices.doubleValue()) * 100;
            double pendingPercentage = (pendingInvoices.doubleValue() / totalInvoices.doubleValue()) * 100;
            
            statusDistribution.add(StatisticsResponse.StatusDistribution.builder()
                .status("Validées")
                .count(validatedInvoices)
                .percentage(validatedPercentage)
                .build());
            
            statusDistribution.add(StatisticsResponse.StatusDistribution.builder()
                .status("En attente")
                .count(pendingInvoices)
                .percentage(pendingPercentage)
                .build());
        }

        // Tendance récente (7 derniers jours)
        LocalDateTime startDate = LocalDateTime.now().minusDays(7);
        List<Object[]> trendData = invoiceRepository.getRecentTrendByUser(user, startDate);
        List<StatisticsResponse.RecentTrend> recentTrend = trendData.stream()
            .map(row -> StatisticsResponse.RecentTrend.builder()
                .date(row[0].toString())
                .count(((Number) row[1]).longValue())
                .amount((BigDecimal) row[2])
                .build())
            .collect(Collectors.toList());

        return StatisticsResponse.builder()
            .totalInvoices(totalInvoices)
            .totalAmount(totalAmount != null ? totalAmount : BigDecimal.ZERO)
            .validatedInvoices(validatedInvoices)
            .pendingInvoices(pendingInvoices)
            .averageAmount(averageAmount)
            .monthlyStats(monthlyStats)
            .supplierStats(supplierStats)
            .statusDistribution(statusDistribution)
            .recentTrend(recentTrend)
            .build();
    }

    private InvoiceResponse mapToResponse(Invoice invoice) {
        return InvoiceResponse.builder()
                .id(invoice.getId())
                .supplierIce(invoice.getSupplierIce())
                .supplierIf(invoice.getSupplierIf())
                .supplierRc(invoice.getSupplierRc())
                .supplierPatente(invoice.getSupplierPatente())
                .supplierCnss(invoice.getSupplierCnss())
                .supplierName(invoice.getSupplierName())
                .supplierAddress(invoice.getSupplierAddress())
                .clientIce(invoice.getClientIce())
                .clientName(invoice.getClientName())
                .invoiceNumber(invoice.getInvoiceNumber())
                .invoiceDate(invoice.getInvoiceDate())
                .dueDate(invoice.getDueDate())
                .deliveryDate(invoice.getDeliveryDate())
                .amountHt(invoice.getAmountHt())
                .amountTva(invoice.getAmountTva())
                .tvaRate(invoice.getTvaRate())
                .amountTtc(invoice.getAmountTtc())
                .originalFilename(invoice.getOriginalFilename())
                .filePath(invoice.getFilePath())
                .ocrConfidence(invoice.getOcrConfidence())
                .isValidated(invoice.getIsValidated())
                .createdAt(invoice.getCreatedAt())
                .updatedAt(invoice.getUpdatedAt())
                .build();
    }
}
