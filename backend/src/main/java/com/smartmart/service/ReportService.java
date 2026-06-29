package com.smartmart.service;

import com.smartmart.dto.response.*;
import java.time.LocalDate;
import java.util.List;

public interface ReportService {
    List<SalesReportResponse> getSalesReport(LocalDate from, LocalDate to, String groupBy);
    List<PurchaseReportResponse> getPurchaseReport(LocalDate from, LocalDate to);
    List<InventoryReportResponse> getInventoryReport(LocalDate from, LocalDate to);
    List<InventoryNxtReportResponse> getNxtReport(LocalDate from, LocalDate to);

    List<BestSellerReportResponse> getBestSellers(LocalDate from, LocalDate to, int limit);
    List<CustomerDueReportResponse> getCustomerDue();
    List<SupplierDueReportResponse> getSupplierDue();
    List<ProductExpiryReportResponse> getProductExpiry();
    List<CashFlowReportResponse> getCashFlow(LocalDate from, LocalDate to);
    List<ProfitLossReportResponse> getProfitLoss(LocalDate from, LocalDate to);

    byte[] exportExcel(String type, LocalDate from, LocalDate to, String groupBy);
    byte[] exportNxtExcel(LocalDate from, LocalDate to);
    byte[] exportPdf(String type, LocalDate from, LocalDate to, String groupBy);
    byte[] exportComprehensivePdf(LocalDate from, LocalDate to, String groupBy);
    byte[] exportComprehensiveExcel(LocalDate from, LocalDate to, String groupBy);
}
