package com.smartmart.service;

import com.smartmart.dto.response.ForecastResultResponse;
import com.smartmart.dto.response.InventoryReportResponse;
import com.smartmart.dto.response.PurchaseReportResponse;
import com.smartmart.dto.response.SalesReportResponse;
import com.smartmart.dto.response.InventoryNxtReportResponse;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface ExcelReportService {
    byte[] generateSalesReport(List<SalesReportResponse> data, LocalDate from, LocalDate to, String companyName, String companyAddress) throws IOException;
    byte[] generatePurchaseReport(List<PurchaseReportResponse> data, LocalDate from, LocalDate to, String companyName, String companyAddress) throws IOException;
    byte[] generateInventoryReport(List<InventoryReportResponse> data, LocalDate from, LocalDate to, String companyName, String companyAddress) throws IOException;
    byte[] generateNxtReport(List<InventoryNxtReportResponse> data, LocalDate from, LocalDate to, String companyName, String companyAddress) throws IOException;
    byte[] generateComprehensiveExcel(List<SalesReportResponse> sales, List<PurchaseReportResponse> purchases, List<InventoryReportResponse> inventory, List<InventoryNxtReportResponse> nxt, LocalDate from, LocalDate to, String companyName, String companyAddress) throws IOException;

    // --- Overloaded methods with AI data ---
    byte[] generateSalesReport(List<SalesReportResponse> data, LocalDate from, LocalDate to, String companyName, String companyAddress, List<ForecastResultResponse> forecasts) throws IOException;
    byte[] generateInventoryReport(List<InventoryReportResponse> data, LocalDate from, LocalDate to, String companyName, String companyAddress, List<Map<String, Object>> reorderRecs) throws IOException;
    byte[] generateComprehensiveExcel(List<SalesReportResponse> sales, List<PurchaseReportResponse> purchases, List<InventoryReportResponse> inventory, List<InventoryNxtReportResponse> nxt, LocalDate from, LocalDate to, String companyName, String companyAddress, List<ForecastResultResponse> forecasts, List<Map<String, Object>> reorderRecs) throws IOException;
}
