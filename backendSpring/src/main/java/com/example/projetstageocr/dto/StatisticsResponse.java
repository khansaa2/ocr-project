package com.example.projetstageocr.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatisticsResponse {
    private Long totalInvoices;
    private BigDecimal totalAmount;
    private Long validatedInvoices;
    private Long pendingInvoices;
    private BigDecimal averageAmount;
    private List<MonthlyStat> monthlyStats;
    private List<SupplierStat> supplierStats;
    private List<StatusDistribution> statusDistribution;
    private List<RecentTrend> recentTrend;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyStat {
        private String month;
        private Long count;
        private BigDecimal amount;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SupplierStat {
        private String supplier;
        private Long count;
        private BigDecimal amount;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusDistribution {
        private String status;
        private Long count;
        private Double percentage;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentTrend {
        private String date;
        private Long count;
        private BigDecimal amount;
    }
}
