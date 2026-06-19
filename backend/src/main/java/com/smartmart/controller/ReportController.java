package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.response.SalesReportResponse;
import com.smartmart.dto.response.PurchaseReportResponse;
import com.smartmart.dto.response.InventoryReportResponse;
import com.smartmart.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/reports")
@Tag(name = "Reports", description = "Báo cáo thống kê chuyên sâu")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('ADMIN','MANAGER','ANALYST')")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/sales")
    @Operation(summary = "Báo cáo bán lẻ chuyên sâu theo ngày/tháng/năm")
    public ResponseEntity<ApiResponse<List<SalesReportResponse>>> getSalesReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String groupBy
    ) {
        List<SalesReportResponse> data = reportService.getSalesReport(from, to, groupBy);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/purchase")
    @Operation(summary = "Thống kê số lượng tiền chi nhập hàng theo từng nhà cung cấp")
    public ResponseEntity<ApiResponse<List<PurchaseReportResponse>>> getPurchaseReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        List<PurchaseReportResponse> data = reportService.getPurchaseReport(from, to);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/inventory")
    @Operation(summary = "Báo cáo chi tiết hao hụt kho, hàng cận date, tỷ lệ quay vòng kho")
    public ResponseEntity<ApiResponse<List<InventoryReportResponse>>> getInventoryReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        List<InventoryReportResponse> data = reportService.getInventoryReport(from, to);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/export")
    @Operation(summary = "Xuất báo cáo dưới dạng Excel hoặc PDF")
    public ResponseEntity<org.springframework.core.io.Resource> exportReport(
            @RequestParam String type,
            @RequestParam String format,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String groupBy
    ) {
        byte[] data;
        String fileName = type + "-report-" + LocalDate.now();
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();

        if ("pdf".equalsIgnoreCase(format)) {
            data = reportService.exportPdf(type, from, to, groupBy);
            fileName += ".pdf";
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_PDF);
        } else if ("excel".equalsIgnoreCase(format)) {
            data = reportService.exportExcel(type, from, to, groupBy);
            fileName += ".xlsx";
            headers.setContentType(org.springframework.http.MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        } else {
            return ResponseEntity.badRequest().build();
        }

        headers.setContentDispositionFormData("attachment", fileName);
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return ResponseEntity.ok()
                .headers(headers)
                .contentLength(data.length)
                .body(new org.springframework.core.io.ByteArrayResource(data));
    }

    @GetMapping("/comprehensive")
    @Operation(summary = "Xuất báo cáo quản trị tổng hợp (PDF hoặc Excel 3 sheet)")
    public ResponseEntity<org.springframework.core.io.Resource> exportComprehensiveReport(
            @RequestParam(defaultValue = "pdf") String format,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String groupBy
    ) {
        byte[] data;
        String fileName = "comprehensive-report-" + LocalDate.now();
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();

        if ("pdf".equalsIgnoreCase(format)) {
            data = reportService.exportComprehensivePdf(from, to, groupBy);
            fileName += ".pdf";
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_PDF);
        } else if ("excel".equalsIgnoreCase(format)) {
            data = reportService.exportComprehensiveExcel(from, to, groupBy);
            fileName += ".xlsx";
            headers.setContentType(org.springframework.http.MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        } else {
            return ResponseEntity.badRequest().build();
        }

        headers.setContentDispositionFormData("attachment", fileName);
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return ResponseEntity.ok()
                .headers(headers)
                .contentLength(data.length)
                .body(new org.springframework.core.io.ByteArrayResource(data));
    }
}
