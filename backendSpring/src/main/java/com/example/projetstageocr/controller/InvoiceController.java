package com.example.projetstageocr.controller;

import com.example.projetstageocr.dto.InvoiceRequest;
import com.example.projetstageocr.dto.InvoiceResponse;
import com.example.projetstageocr.dto.StatisticsResponse;
import com.example.projetstageocr.entity.User;
import com.example.projetstageocr.service.InvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @PostMapping
    public ResponseEntity<InvoiceResponse> createInvoice(
            @Valid @RequestBody InvoiceRequest request,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        InvoiceResponse response = invoiceService.createInvoice(request, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<Page<InvoiceResponse>> getUserInvoices(
            Authentication authentication,
            Pageable pageable,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        User user = (User) authentication.getPrincipal();
        Page<InvoiceResponse> invoices = invoiceService.getUserInvoices(user, pageable, search, status, dateFrom, dateTo);
        return ResponseEntity.ok(invoices);
    }

    @GetMapping("/list")
    public ResponseEntity<List<InvoiceResponse>> getUserInvoicesList(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<InvoiceResponse> invoices = invoiceService.getUserInvoicesList(user);
        return ResponseEntity.ok(invoices);
    }

    @GetMapping("/{id}")
    public ResponseEntity<InvoiceResponse> getInvoiceById(
            @PathVariable Long id,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        InvoiceResponse invoice = invoiceService.getInvoiceById(id, user);
        return ResponseEntity.ok(invoice);
    }

    @PutMapping("/{id}")
    public ResponseEntity<InvoiceResponse> updateInvoice(
            @PathVariable Long id,
            @Valid @RequestBody InvoiceRequest request,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        InvoiceResponse response = invoiceService.updateInvoice(id, request, user);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInvoice(
            @PathVariable Long id,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        invoiceService.deleteInvoice(id, user);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats")
    public ResponseEntity<StatisticsResponse> getInvoiceStats(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        StatisticsResponse stats = invoiceService.getStatistics(user);
        return ResponseEntity.ok(stats);
    }
}
