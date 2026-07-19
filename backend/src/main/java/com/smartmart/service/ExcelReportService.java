package com.smartmart.service;

import com.smartmart.dto.response.*;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface ExcelReportService {
    byte[] generateSalesReport(List<SalesReportResponse> data, LocalDate from, LocalDate to, String companyName, String companyAddress, String companyPhone) throws IOException;
    byte[] generatePurchaseReport(List<PurchaseReportResponse> data, LocalDate from, LocalDate to, String companyName, String companyAddress, String companyPhone) throws IOException;
    byte[] generateInventoryReport(List<InventoryReportResponse> data, LocalDate from, LocalDate to, String companyName, String companyAddress, String companyPhone) throws IOException;
    byte[] generateNxtReport(List<InventoryNxtReportResponse> data, LocalDate from, LocalDate to, String companyName, String companyAddress, String companyPhone) throws IOException;
    byte[] generateComprehensiveExcel(List<SalesReportResponse> sales, List<PurchaseReportResponse> purchases, List<InventoryReportResponse> inventory, List<InventoryNxtReportResponse> nxt, LocalDate from, LocalDate to, String companyName, String companyAddress, String companyPhone) throws IOException;

    // --- New report types ---
    byte[] generateBestSellersReport(List<BestSellerReportResponse> data, LocalDate from, LocalDate to, String companyName, String companyAddress, String companyPhone) throws IOException;
    byte[] generateBestSellerCategoriesReport(List<BestSellerCategoryResponse> data, LocalDate from, LocalDate to, String companyName, String companyAddress, String companyPhone) throws IOException;
    byte[] generateCustomerDueReport(List<CustomerDueReportResponse> data, String companyName, String companyAddress, String companyPhone) throws IOException;
    byte[] generateSupplierDueReport(List<SupplierDueReportResponse> data, String companyName, String companyAddress, String companyPhone) throws IOException;
    byte[] generateProductExpiryReport(List<ProductExpiryReportResponse> data, String companyName, String companyAddress, String companyPhone) throws IOException;
    byte[] generateCashFlowReport(List<CashFlowReportResponse> data, LocalDate from, LocalDate to, String companyName, String companyAddress, String companyPhone) throws IOException;
    byte[] generateProfitLossReport(List<ProfitLossReportResponse> data, LocalDate from, LocalDate to, String companyName, String companyAddress, String companyPhone) throws IOException;

    // --- Overloaded methods with AI data ---
    byte[] generateSalesReport(List<SalesReportResponse> data, LocalDate from, LocalDate to, String companyName, String companyAddress, String companyPhone, List<ForecastResultResponse> forecasts) throws IOException;
    byte[] generateInventoryReport(List<InventoryReportResponse> data, LocalDate from, LocalDate to, String companyName, String companyAddress, String companyPhone, List<Map<String, Object>> reorderRecs) throws IOException;
    byte[] generateComprehensiveExcel(List<SalesReportResponse> sales, List<PurchaseReportResponse> purchases, List<InventoryReportResponse> inventory, List<InventoryNxtReportResponse> nxt, LocalDate from, LocalDate to, String companyName, String companyAddress, String companyPhone, List<ForecastResultResponse> forecasts, List<Map<String, Object>> reorderRecs) throws IOException;
}
