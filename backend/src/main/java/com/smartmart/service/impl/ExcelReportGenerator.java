package com.smartmart.service.impl;

import com.smartmart.dto.response.InventoryReportResponse;
import com.smartmart.dto.response.PurchaseReportResponse;
import com.smartmart.dto.response.SalesReportResponse;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

@Component
public class ExcelReportGenerator {

    public byte[] generateSalesReport(List<SalesReportResponse> data, LocalDate from, LocalDate to) throws IOException {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            
            Sheet sheet = workbook.createSheet("Báo Cáo Doanh Thu");
            CellStyle headerStyle = createHeaderStyle(workbook);
            fillSalesSheet(sheet, headerStyle, data);
            
            workbook.write(out);
            return out.toByteArray();
        }
    }

    public byte[] generatePurchaseReport(List<PurchaseReportResponse> data, LocalDate from, LocalDate to) throws IOException {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            
            Sheet sheet = workbook.createSheet("Báo Cáo Nhập Hàng");
            CellStyle headerStyle = createHeaderStyle(workbook);
            fillPurchaseSheet(sheet, headerStyle, data);
            
            workbook.write(out);
            return out.toByteArray();
        }
    }

    public byte[] generateInventoryReport(List<InventoryReportResponse> data, LocalDate from, LocalDate to) throws IOException {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            
            Sheet sheet = workbook.createSheet("Báo Cáo Tồn Kho");
            CellStyle headerStyle = createHeaderStyle(workbook);
            fillInventorySheet(sheet, headerStyle, data);
            
            workbook.write(out);
            return out.toByteArray();
        }
    }

    public byte[] generateComprehensiveExcel(List<SalesReportResponse> sales, 
                                             List<PurchaseReportResponse> purchases, 
                                             List<InventoryReportResponse> inventory, 
                                             LocalDate from, LocalDate to) throws IOException {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            CellStyle headerStyle = createHeaderStyle(workbook);

            Sheet salesSheet = workbook.createSheet("Báo Cáo Doanh Thu");
            fillSalesSheet(salesSheet, headerStyle, sales);

            Sheet purchaseSheet = workbook.createSheet("Báo Cáo Nhập Hàng");
            fillPurchaseSheet(purchaseSheet, headerStyle, purchases);

            Sheet inventorySheet = workbook.createSheet("Báo Cáo Tồn Kho");
            fillInventorySheet(inventorySheet, headerStyle, inventory);

            workbook.write(out);
            return out.toByteArray();
        }
    }

    private void fillSalesSheet(Sheet sheet, CellStyle headerStyle, List<SalesReportResponse> data) {
        Row headerRow = sheet.createRow(0);
        String[] columns = {"Chu kỳ", "Tổng đơn hàng", "Đơn hàng hủy", "Tổng doanh thu", "Tổng giá vốn", "Lợi nhuận gộp", "Tổng SP bán ra"};
        for (int i = 0; i < columns.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(columns[i]);
            cell.setCellStyle(headerStyle);
            sheet.setColumnWidth(i, 20 * 256);
        }

        int rowIdx = 1;
        for (SalesReportResponse rowData : data) {
            Row row = sheet.createRow(rowIdx++);

            row.createCell(0).setCellValue(rowData.getPeriod());
            row.createCell(1).setCellValue(rowData.getTotalOrders());
            row.createCell(2).setCellValue(rowData.getCancelledOrders());
            row.createCell(3).setCellValue(rowData.getTotalRevenue() != null ? rowData.getTotalRevenue().doubleValue() : 0.0);
            row.createCell(4).setCellValue(rowData.getTotalCost() != null ? rowData.getTotalCost().doubleValue() : 0.0);
            row.createCell(5).setCellValue(rowData.getGrossProfit() != null ? rowData.getGrossProfit().doubleValue() : 0.0);
            row.createCell(6).setCellValue(rowData.getTotalItemsSold());
        }

        Row aiNoteRow = sheet.createRow(rowIdx + 2);
        aiNoteRow.createCell(0).setCellValue("* Lưu ý: Chỉ số Dự báo AI đang sử dụng công thức Tạm thời (Hệ số 5%). Sẽ được cập nhật khi hệ thống AI hoàn thiện.");
    }

    private void fillPurchaseSheet(Sheet sheet, CellStyle headerStyle, List<PurchaseReportResponse> data) {
        Row headerRow = sheet.createRow(0);
        String[] columns = {"Mã NCC", "Tên Nhà Cung Cấp", "Tổng số đơn", "Tổng tiền nhập", "Tổng số loại SP", "Tổng số lượng"};
        for (int i = 0; i < columns.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(columns[i]);
            cell.setCellStyle(headerStyle);
            sheet.setColumnWidth(i, 20 * 256);
        }

        int rowIdx = 1;
        for (PurchaseReportResponse rowData : data) {
            Row row = sheet.createRow(rowIdx++);

            row.createCell(0).setCellValue(rowData.getSupplierId());
            row.createCell(1).setCellValue(rowData.getSupplierName());
            row.createCell(2).setCellValue(rowData.getTotalOrders());
            row.createCell(3).setCellValue(rowData.getTotalAmount() != null ? rowData.getTotalAmount().doubleValue() : 0.0);
            row.createCell(4).setCellValue(rowData.getTotalItemTypes());
            row.createCell(5).setCellValue(rowData.getTotalQuantity() != null ? rowData.getTotalQuantity().doubleValue() : 0.0);
        }
    }

    private void fillInventorySheet(Sheet sheet, CellStyle headerStyle, List<InventoryReportResponse> data) {
        Row headerRow = sheet.createRow(0);
        String[] columns = {"Mã SP", "Tên Sản Phẩm", "Danh Mục", "Tồn kho hiện tại", "Tổng Nhập", "Tổng Bán", "Hủy/Lỗi", "Thất Thoát", "Tỷ lệ vòng quay"};
        for (int i = 0; i < columns.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(columns[i]);
            cell.setCellStyle(headerStyle);
            sheet.setColumnWidth(i, 18 * 256);
        }

        int rowIdx = 1;
        for (InventoryReportResponse rowData : data) {
            Row row = sheet.createRow(rowIdx++);

            row.createCell(0).setCellValue(rowData.getItemCode());
            row.createCell(1).setCellValue(rowData.getItemName());
            row.createCell(2).setCellValue(rowData.getCategoryName());
            row.createCell(3).setCellValue(rowData.getCurrentStock() != null ? rowData.getCurrentStock().doubleValue() : 0.0);
            row.createCell(4).setCellValue(rowData.getTotalPurchased() != null ? rowData.getTotalPurchased().doubleValue() : 0.0);
            row.createCell(5).setCellValue(rowData.getTotalSold() != null ? rowData.getTotalSold().doubleValue() : 0.0);
            row.createCell(6).setCellValue(rowData.getTotalScrapped() != null ? rowData.getTotalScrapped().doubleValue() : 0.0);
            row.createCell(7).setCellValue(rowData.getShrinkage() != null ? rowData.getShrinkage().doubleValue() : 0.0);
            row.createCell(8).setCellValue(rowData.getTurnoverRate() != null ? rowData.getTurnoverRate().doubleValue() : 0.0);
        }
    }

    private CellStyle createHeaderStyle(SXSSFWorkbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        return style;
    }
}
