package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.response.*;
import com.smartmart.exception.BadRequestException;
import com.smartmart.service.ReportService;
import com.smartmart.service.SettingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@RestController
@RequestMapping("/api/v1/reports")
@Tag(name = "Reports", description = "Báo cáo thống kê chuyên sâu")
@SecurityRequirement(name = "bearerAuth")
public class ReportController {

    private final ReportService reportService;
    private final SettingService settingService;

    public ReportController(ReportService reportService, SettingService settingService) {
        this.reportService = reportService;
        this.settingService = settingService;
    }

    private void validateDateRange(LocalDate from, LocalDate to) {
        if (from == null || to == null) return;
        if (from.isAfter(to)) {
            throw new BadRequestException("Ngày bắt đầu phải trước ngày kết thúc");
        }
        int maxDays = settingService.getIntValue("report_max_days", 366);
        long days = ChronoUnit.DAYS.between(from, to);
        if (days > maxDays) {
            throw new BadRequestException("Khoảng thời gian báo cáo không được vượt quá " + maxDays + " ngày");
        }
    }

    @GetMapping("/sales")
    @Operation(summary = "Báo cáo bán lẻ chuyên sâu theo ngày/tháng/năm")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ANALYST')")
    public ResponseEntity<ApiResponse<List<SalesReportResponse>>> getSalesReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String groupBy
    ) {
        validateDateRange(from, to);
        List<SalesReportResponse> data = reportService.getSalesReport(from, to, groupBy);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/purchase")
    @Operation(summary = "Thống kê số lượng tiền chi nhập hàng theo từng nhà cung cấp")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    public ResponseEntity<ApiResponse<List<PurchaseReportResponse>>> getPurchaseReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        validateDateRange(from, to);
        List<PurchaseReportResponse> data = reportService.getPurchaseReport(from, to);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/inventory")
    @Operation(summary = "Báo cáo chi tiết hao hụt kho, hàng cận date, tỷ lệ quay vòng kho")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    public ResponseEntity<ApiResponse<List<InventoryReportResponse>>> getInventoryReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        validateDateRange(from, to);
        List<InventoryReportResponse> data = reportService.getInventoryReport(from, to);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/nxt")
    @Operation(summary = "Báo cáo Nhập Xuất Tồn")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ANALYST')")
    public ResponseEntity<ApiResponse<List<InventoryNxtReportResponse>>> getNxtReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        validateDateRange(from, to);
        List<InventoryNxtReportResponse> data = reportService.getNxtReport(from, to);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/best-sellers")
    @Operation(summary = "Báo cáo sản phẩm bán chạy")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ANALYST')")
    public ResponseEntity<ApiResponse<List<BestSellerReportResponse>>> getBestSellers(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "10") int limit) {
        validateDateRange(from, to);
        return ResponseEntity.ok(ApiResponse.success(reportService.getBestSellers(from, to, limit)));
    }

    @GetMapping("/best-seller-categories")
    @Operation(summary = "Báo cáo danh mục bán chạy")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ANALYST')")
    public ResponseEntity<ApiResponse<List<BestSellerCategoryResponse>>> getBestSellerCategories(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "10") int limit) {
        validateDateRange(from, to);
        return ResponseEntity.ok(ApiResponse.success(reportService.getBestSellerCategories(from, to, limit)));
    }

    @GetMapping("/customer-due")
    @Operation(summary = "Báo cáo công nợ khách hàng")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ANALYST')")
    public ResponseEntity<ApiResponse<List<CustomerDueReportResponse>>> getCustomerDue() {
        return ResponseEntity.ok(ApiResponse.success(reportService.getCustomerDue()));
    }

    @GetMapping("/supplier-due")
    @Operation(summary = "Báo cáo công nợ nhà cung cấp")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ANALYST')")
    public ResponseEntity<ApiResponse<List<SupplierDueReportResponse>>> getSupplierDue() {
        return ResponseEntity.ok(ApiResponse.success(reportService.getSupplierDue()));
    }

    @GetMapping("/product-expiry")
    @Operation(summary = "Báo cáo sản phẩm cận hạn")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAREHOUSE')")
    public ResponseEntity<ApiResponse<List<ProductExpiryReportResponse>>> getProductExpiry() {
        return ResponseEntity.ok(ApiResponse.success(reportService.getProductExpiry()));
    }

    @GetMapping("/cash-flow")
    @Operation(summary = "Báo cáo dòng tiền")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ANALYST')")
    public ResponseEntity<ApiResponse<List<CashFlowReportResponse>>> getCashFlow(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        validateDateRange(from, to);
        return ResponseEntity.ok(ApiResponse.success(reportService.getCashFlow(from, to)));
    }

    @GetMapping("/profit-loss")
    @Operation(summary = "Báo cáo lãi lỗ")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ANALYST')")
    public ResponseEntity<ApiResponse<List<ProfitLossReportResponse>>> getProfitLoss(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        validateDateRange(from, to);
        return ResponseEntity.ok(ApiResponse.success(reportService.getProfitLoss(from, to)));
    }

    @GetMapping("/refund-statistics")
    @Operation(summary = "Báo cáo đổi trả hoàn tiền")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ANALYST')")
    public ResponseEntity<ApiResponse<RefundReportResponse>> getRefundReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        validateDateRange(from, to);
        return ResponseEntity.ok(ApiResponse.success(reportService.getRefundReport(from, to)));
    }

    @GetMapping("/export")
    @Operation(summary = "Xuất báo cáo dưới dạng Excel hoặc PDF")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER') or (hasRole('WAREHOUSE') and (#type == 'inventory' or #type == 'purchase' or #type == 'product-expiry')) or (hasRole('ANALYST') and (#type == 'customer-due' or #type == 'supplier-due' or #type == 'cash-flow' or #type == 'profit-loss' or #type == 'nxt' or #type == 'sales' or #type == 'best-sellers' or #type == 'best-seller-categories' or #type == 'refund'))")
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
            if ("nxt".equalsIgnoreCase(type)) {
                data = reportService.exportNxtExcel(from, to);
            } else {
                data = reportService.exportExcel(type, from, to, groupBy);
            }
            fileName += ".xlsx";
            headers.setContentType(org.springframework.http.MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        } else {
            throw new BadRequestException("Định dạng báo cáo không hợp lệ");
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
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
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
            throw new BadRequestException("Định dạng báo cáo không hợp lệ");
        }

        headers.setContentDispositionFormData("attachment", fileName);
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return ResponseEntity.ok()
                .headers(headers)
                .contentLength(data.length)
                .body(new org.springframework.core.io.ByteArrayResource(data));
    }
}
