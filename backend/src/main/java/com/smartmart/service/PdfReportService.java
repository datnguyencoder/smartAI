package com.smartmart.service;

import com.lowagie.text.DocumentException;
import com.smartmart.dto.response.InventoryReportResponse;
import com.smartmart.dto.response.PurchaseReportResponse;
import com.smartmart.dto.response.SalesReportResponse;
import com.smartmart.dto.response.InventoryNxtReportResponse;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

public interface PdfReportService {
    byte[] generateSalesReport(List<SalesReportResponse> data, LocalDate from, LocalDate to, String storeName, String storeAddress, String storePhone);
    byte[] generatePurchaseReport(List<PurchaseReportResponse> data, LocalDate from, LocalDate to, String storeName, String storeAddress, String storePhone);
    byte[] generateInventoryReport(List<InventoryReportResponse> data, LocalDate from, LocalDate to, String storeName, String storeAddress, String storePhone);
    byte[] generateComprehensiveReport(List<SalesReportResponse> sales, List<PurchaseReportResponse> purchases, List<InventoryReportResponse> inventory, List<InventoryNxtReportResponse> nxt, LocalDate from, LocalDate to, String storeName, String storeAddress, String storePhone) throws DocumentException, IOException;
}
