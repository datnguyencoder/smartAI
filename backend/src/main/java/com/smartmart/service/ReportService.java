package com.smartmart.service;

import com.smartmart.dto.response.SalesReportResponse;
import com.smartmart.dto.response.PurchaseReportResponse;
import com.smartmart.dto.response.InventoryReportResponse;
import java.time.LocalDate;
import java.util.List;

public interface ReportService {
    List<SalesReportResponse> getSalesReport(LocalDate from, LocalDate to, String groupBy);
    List<PurchaseReportResponse> getPurchaseReport(LocalDate from, LocalDate to);
    List<InventoryReportResponse> getInventoryReport(LocalDate from, LocalDate to);

    byte[] exportExcel(String type, LocalDate from, LocalDate to, String groupBy);
    byte[] exportPdf(String type, LocalDate from, LocalDate to, String groupBy);
    byte[] exportComprehensivePdf(LocalDate from, LocalDate to, String groupBy);
    byte[] exportComprehensiveExcel(LocalDate from, LocalDate to, String groupBy);
}
