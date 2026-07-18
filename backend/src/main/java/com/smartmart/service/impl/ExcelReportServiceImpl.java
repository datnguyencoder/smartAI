package com.smartmart.service.impl;

import com.smartmart.dto.response.*;
import com.smartmart.enums.CustomerDebtStatus;
import com.smartmart.enums.SupplierDebtStatus;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.stereotype.Service;
import com.smartmart.service.ExcelReportService;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ExcelReportServiceImpl implements ExcelReportService {

    @Override
    public byte[] generateSalesReport(List<SalesReportResponse> data, LocalDate from, LocalDate to, String companyName, String companyAddress) throws IOException {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            
            Sheet sheet = workbook.createSheet("Báo Cáo Doanh Thu");
            CellStyle headerStyle = createHeaderStyle(workbook);
            fillSalesSheet(workbook, sheet, headerStyle, data, from, to, companyName, companyAddress);
            
            workbook.write(out);
            return out.toByteArray();
        }
    }

    @Override
    public byte[] generatePurchaseReport(List<PurchaseReportResponse> data, LocalDate from, LocalDate to, String companyName, String companyAddress) throws IOException {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            
            Sheet sheet = workbook.createSheet("Báo Cáo Nhập Hàng");
            CellStyle headerStyle = createHeaderStyle(workbook);
            fillPurchaseSheet(workbook, sheet, headerStyle, data, from, to, companyName, companyAddress);
            
            workbook.write(out);
            return out.toByteArray();
        }
    }

    @Override
    public byte[] generateInventoryReport(List<InventoryReportResponse> data, LocalDate from, LocalDate to, String companyName, String companyAddress) throws IOException {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            
            Sheet sheet = workbook.createSheet("Báo Cáo Tồn Kho");
            CellStyle headerStyle = createHeaderStyle(workbook);
            fillInventorySheet(workbook, sheet, headerStyle, data, from, to, companyName, companyAddress);
            
            workbook.write(out);
            return out.toByteArray();
        }
    }

    @Override
    public byte[] generateNxtReport(List<InventoryNxtReportResponse> data, LocalDate from, LocalDate to, String companyName, String companyAddress) throws IOException {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            
            Sheet sheet = workbook.createSheet("Nhập Xuất Tồn");
            fillNxtSheet(workbook, sheet, data, from, to, companyName, companyAddress);
            
            workbook.write(out);
            return out.toByteArray();
        }
    }


    @Override
    public byte[] generateComprehensiveExcel(List<SalesReportResponse> sales, 
                                             List<PurchaseReportResponse> purchases, 
                                             List<InventoryReportResponse> inventory, 
                                             List<InventoryNxtReportResponse> nxt,
                                             LocalDate from, LocalDate to, String companyName, String companyAddress) throws IOException {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            CellStyle headerStyle = createHeaderStyle(workbook);

            Sheet salesSheet = workbook.createSheet("Báo Cáo Doanh Thu");
            fillSalesSheet(workbook, salesSheet, headerStyle, sales, from, to, companyName, companyAddress);

            Sheet purchaseSheet = workbook.createSheet("Báo Cáo Nhập Hàng");
            fillPurchaseSheet(workbook, purchaseSheet, headerStyle, purchases, from, to, companyName, companyAddress);

            Sheet inventorySheet = workbook.createSheet("Báo Cáo Tồn Kho");
            fillInventorySheet(workbook, inventorySheet, headerStyle, inventory, from, to, companyName, companyAddress);

            Sheet nxtSheet = workbook.createSheet("Nhập Xuất Tồn");
            fillNxtSheet(workbook, nxtSheet, nxt, from, to, companyName, companyAddress);

            workbook.write(out);
            return out.toByteArray();
        }
    }

    private int addHeaderInfo(SXSSFWorkbook workbook, Sheet sheet, String title, LocalDate from, LocalDate to, String companyName, String companyAddress, int mergeCols) {
        int rowIndex = 0;

        // 1. Company Info
        Row row0 = sheet.createRow(rowIndex++);
        row0.createCell(0).setCellValue("CÔNG TY: " + companyName);
        Row row1 = sheet.createRow(rowIndex++);
        row1.createCell(0).setCellValue("ĐỊA CHỈ: " + companyAddress);
        rowIndex++; // empty row

        // 2. Title
        CellStyle titleStyle = workbook.createCellStyle();
        Font titleFont = workbook.createFont();
        titleFont.setBold(true);
        titleFont.setFontHeightInPoints((short) 16);
        titleStyle.setFont(titleFont);
        titleStyle.setAlignment(HorizontalAlignment.CENTER);

        Row titleRow = sheet.createRow(rowIndex++);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue(title);
        titleCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(rowIndex - 1, rowIndex - 1, 0, mergeCols));

        Row subtitleRow = sheet.createRow(rowIndex++);
        CellStyle subtitleStyle = workbook.createCellStyle();
        subtitleStyle.setAlignment(HorizontalAlignment.CENTER);
        Cell subtitleCell = subtitleRow.createCell(0);
        subtitleCell.setCellValue("Từ ngày: " + (from != null ? from : "...") + " đến ngày: " + (to != null ? to : "..."));
        subtitleCell.setCellStyle(subtitleStyle);
        sheet.addMergedRegion(new CellRangeAddress(rowIndex - 1, rowIndex - 1, 0, mergeCols));
        rowIndex++; // empty row

        return rowIndex;
    }

    private void fillSalesSheet(SXSSFWorkbook workbook, Sheet sheet, CellStyle headerStyle, List<SalesReportResponse> data, LocalDate from, LocalDate to, String companyName, String companyAddress) {
        int rowIdx = addHeaderInfo(workbook, sheet, "BÁO CÁO DOANH THU", from, to, companyName, companyAddress, 6);

        Row headerRow = sheet.createRow(rowIdx++);
        String[] columns = {"Chu kỳ", "Tổng đơn hàng", "Đơn hàng hủy", "Tổng doanh thu", "Tổng giá vốn", "Lợi nhuận gộp", "Tổng SP bán ra"};
        for (int i = 0; i < columns.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(columns[i]);
            cell.setCellStyle(headerStyle);
            sheet.setColumnWidth(i, 20 * 256);
        }

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


    }

    private void fillPurchaseSheet(SXSSFWorkbook workbook, Sheet sheet, CellStyle headerStyle, List<PurchaseReportResponse> data, LocalDate from, LocalDate to, String companyName, String companyAddress) {
        int rowIdx = addHeaderInfo(workbook, sheet, "BÁO CÁO NHẬP HÀNG", from, to, companyName, companyAddress, 5);

        Row headerRow = sheet.createRow(rowIdx++);
        String[] columns = {"Mã NCC", "Tên Nhà Cung Cấp", "Tổng số đơn", "Tổng tiền nhập", "Tổng số loại SP", "Tổng số lượng"};
        for (int i = 0; i < columns.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(columns[i]);
            cell.setCellStyle(headerStyle);
            sheet.setColumnWidth(i, 20 * 256);
        }

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

    private void fillInventorySheet(SXSSFWorkbook workbook, Sheet sheet, CellStyle headerStyle, List<InventoryReportResponse> data, LocalDate from, LocalDate to, String companyName, String companyAddress) {
        int rowIdx = addHeaderInfo(workbook, sheet, "BÁO CÁO TỒN KHO", from, to, companyName, companyAddress, 8);

        Row headerRow = sheet.createRow(rowIdx++);
        String[] columns = {"Mã SP", "Tên Sản Phẩm", "Danh Mục", "Tồn kho hiện tại", "Tổng Nhập", "Tổng Bán", "Hủy/Lỗi", "Thất Thoát", "Tỷ lệ vòng quay"};
        for (int i = 0; i < columns.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(columns[i]);
            cell.setCellStyle(headerStyle);
            sheet.setColumnWidth(i, 18 * 256);
        }

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

    private void fillNxtSheet(SXSSFWorkbook workbook, Sheet sheet, List<InventoryNxtReportResponse> data, LocalDate from, LocalDate to, String companyName, String companyAddress) {
        int rowIndex = addHeaderInfo(workbook, sheet, "BẢNG TỔNG HỢP VẬT TƯ NHẬP XUẤT TỒN", from, to, companyName, companyAddress, 12);

        // 3. Headers
        CellStyle baseHeaderStyle = createHeaderStyle(workbook);
        baseHeaderStyle.setAlignment(HorizontalAlignment.CENTER);
        baseHeaderStyle.setVerticalAlignment(VerticalAlignment.CENTER);

        CellStyle greenHeaderStyle = workbook.createCellStyle();
        greenHeaderStyle.cloneStyleFrom(baseHeaderStyle);
        greenHeaderStyle.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());

        CellStyle lightGreenHeaderStyle = workbook.createCellStyle();
        lightGreenHeaderStyle.cloneStyleFrom(baseHeaderStyle);
        lightGreenHeaderStyle.setFillForegroundColor(IndexedColors.PALE_BLUE.getIndex()); // Use pale blue for contrast

        CellStyle yellowHeaderStyle = workbook.createCellStyle();
        yellowHeaderStyle.cloneStyleFrom(baseHeaderStyle);
        yellowHeaderStyle.setFillForegroundColor(IndexedColors.LIGHT_YELLOW.getIndex());

        Row headerRow1 = sheet.createRow(rowIndex++);
        Row headerRow2 = sheet.createRow(rowIndex++);

        // Level 1 Headers setup
        String[] topHeaders = {"STT", "Mã VT", "Tên vật tư", "Đơn vị"};
        for (int i = 0; i < 4; i++) {
            Cell c1 = headerRow1.createCell(i);
            c1.setCellValue(topHeaders[i]);
            c1.setCellStyle(baseHeaderStyle);
            Cell c2 = headerRow2.createCell(i);
            c2.setCellStyle(baseHeaderStyle);
            sheet.addMergedRegion(new CellRangeAddress(rowIndex - 2, rowIndex - 1, i, i));
        }

        // Group: Tồn đầu kỳ
        Cell openingHeader = headerRow1.createCell(4);
        openingHeader.setCellValue("Tồn đầu kỳ");
        openingHeader.setCellStyle(greenHeaderStyle);
        headerRow1.createCell(5).setCellStyle(greenHeaderStyle);
        sheet.addMergedRegion(new CellRangeAddress(rowIndex - 2, rowIndex - 2, 4, 5));
        
        Cell opQty = headerRow2.createCell(4); opQty.setCellValue("Số lượng"); opQty.setCellStyle(greenHeaderStyle);
        Cell opVal = headerRow2.createCell(5); opVal.setCellValue("Thành tiền"); opVal.setCellStyle(greenHeaderStyle);

        // Group: Nhập trong kỳ
        Cell importedHeader = headerRow1.createCell(6);
        importedHeader.setCellValue("Nhập trong kỳ");
        importedHeader.setCellStyle(lightGreenHeaderStyle);
        headerRow1.createCell(7).setCellStyle(lightGreenHeaderStyle);
        sheet.addMergedRegion(new CellRangeAddress(rowIndex - 2, rowIndex - 2, 6, 7));

        Cell imQty = headerRow2.createCell(6); imQty.setCellValue("Số lượng"); imQty.setCellStyle(lightGreenHeaderStyle);
        Cell imVal = headerRow2.createCell(7); imVal.setCellValue("Thành tiền"); imVal.setCellStyle(lightGreenHeaderStyle);

        // Group: Xuất trong kỳ
        Cell exportedHeader = headerRow1.createCell(8);
        exportedHeader.setCellValue("Xuất trong kỳ");
        exportedHeader.setCellStyle(lightGreenHeaderStyle);
        headerRow1.createCell(9).setCellStyle(lightGreenHeaderStyle);
        sheet.addMergedRegion(new CellRangeAddress(rowIndex - 2, rowIndex - 2, 8, 9));

        Cell exQty = headerRow2.createCell(8); exQty.setCellValue("Số lượng"); exQty.setCellStyle(lightGreenHeaderStyle);
        Cell exVal = headerRow2.createCell(9); exVal.setCellValue("Thành tiền"); exVal.setCellStyle(lightGreenHeaderStyle);

        // Group: Tồn cuối kỳ
        Cell closingHeader = headerRow1.createCell(10);
        closingHeader.setCellValue("Tồn cuối kỳ");
        closingHeader.setCellStyle(greenHeaderStyle);
        headerRow1.createCell(11).setCellStyle(greenHeaderStyle);
        sheet.addMergedRegion(new CellRangeAddress(rowIndex - 2, rowIndex - 2, 10, 11));

        Cell clQty = headerRow2.createCell(10); clQty.setCellValue("Số lượng"); clQty.setCellStyle(greenHeaderStyle);
        Cell clVal = headerRow2.createCell(11); clVal.setCellValue("Thành tiền"); clVal.setCellStyle(greenHeaderStyle);

        // Group: Đơn giá BQGQ
        Cell refPriceHeader = headerRow1.createCell(12);
        refPriceHeader.setCellValue("Giá Tham Khảo");
        refPriceHeader.setCellStyle(yellowHeaderStyle);
        Cell refPriceSub = headerRow2.createCell(12);
        refPriceSub.setCellValue("Đơn giá");
        refPriceSub.setCellStyle(yellowHeaderStyle);

        // Set column widths
        sheet.setColumnWidth(0, 5 * 256);
        sheet.setColumnWidth(1, 15 * 256);
        sheet.setColumnWidth(2, 30 * 256);
        for(int i=3; i<=12; i++) {
            sheet.setColumnWidth(i, 15 * 256);
        }

        // 4. Data Rows
        CellStyle rowStyle = workbook.createCellStyle();
        rowStyle.setBorderBottom(BorderStyle.THIN);
        rowStyle.setBorderTop(BorderStyle.THIN);
        rowStyle.setBorderRight(BorderStyle.THIN);
        rowStyle.setBorderLeft(BorderStyle.THIN);

        double sumOpVal = 0, sumImVal = 0, sumExVal = 0, sumClVal = 0;
        int stt = 1;

        for (InventoryNxtReportResponse rowData : data) {
            Row row = sheet.createRow(rowIndex++);
            row.createCell(0).setCellValue(stt++);
            row.createCell(1).setCellValue(rowData.getItemCode());
            row.createCell(2).setCellValue(rowData.getItemName());
            row.createCell(3).setCellValue(rowData.getUnitName() != null ? rowData.getUnitName() : "");

            row.createCell(4).setCellValue(rowData.getOpeningQty() != null ? rowData.getOpeningQty().doubleValue() : 0.0);
            row.createCell(5).setCellValue(rowData.getOpeningValue() != null ? rowData.getOpeningValue().doubleValue() : 0.0);

            row.createCell(6).setCellValue(rowData.getImportedQty() != null ? rowData.getImportedQty().doubleValue() : 0.0);
            row.createCell(7).setCellValue(rowData.getImportedValue() != null ? rowData.getImportedValue().doubleValue() : 0.0);

            row.createCell(8).setCellValue(rowData.getExportedQty() != null ? rowData.getExportedQty().doubleValue() : 0.0);
            row.createCell(9).setCellValue(rowData.getExportedValue() != null ? rowData.getExportedValue().doubleValue() : 0.0);

            row.createCell(10).setCellValue(rowData.getClosingQty() != null ? rowData.getClosingQty().doubleValue() : 0.0);
            row.createCell(11).setCellValue(rowData.getClosingValue() != null ? rowData.getClosingValue().doubleValue() : 0.0);

            row.createCell(12).setCellValue(rowData.getReferencePrice() != null ? rowData.getReferencePrice().doubleValue() : 0.0);

            for(int i=0; i<=12; i++) {
                if (row.getCell(i) != null) row.getCell(i).setCellStyle(rowStyle);
            }

            sumOpVal += (rowData.getOpeningValue() != null ? rowData.getOpeningValue().doubleValue() : 0.0);
            sumImVal += (rowData.getImportedValue() != null ? rowData.getImportedValue().doubleValue() : 0.0);
            sumExVal += (rowData.getExportedValue() != null ? rowData.getExportedValue().doubleValue() : 0.0);
            sumClVal += (rowData.getClosingValue() != null ? rowData.getClosingValue().doubleValue() : 0.0);
        }

        // 5. Total Row (at bottom)
        CellStyle totalStyle = workbook.createCellStyle();
        totalStyle.cloneStyleFrom(baseHeaderStyle);
        totalStyle.setFillForegroundColor(IndexedColors.ROSE.getIndex()); // Pink

        Row totalRow = sheet.createRow(rowIndex++);
        Cell totalLabelCell = totalRow.createCell(0);
        totalLabelCell.setCellValue("CỘNG");
        totalLabelCell.setCellStyle(totalStyle);
        for(int i=1; i<=3; i++) {
            Cell c = totalRow.createCell(i);
            c.setCellStyle(totalStyle);
        }
        sheet.addMergedRegion(new CellRangeAddress(rowIndex - 1, rowIndex - 1, 0, 3));

        totalRow.createCell(4).setCellStyle(totalStyle); // Empty qty
        Cell opTotal = totalRow.createCell(5); opTotal.setCellValue(sumOpVal); opTotal.setCellStyle(totalStyle);

        totalRow.createCell(6).setCellStyle(totalStyle);
        Cell imTotal = totalRow.createCell(7); imTotal.setCellValue(sumImVal); imTotal.setCellStyle(totalStyle);

        totalRow.createCell(8).setCellStyle(totalStyle);
        Cell exTotal = totalRow.createCell(9); exTotal.setCellValue(sumExVal); exTotal.setCellStyle(totalStyle);

        totalRow.createCell(10).setCellStyle(totalStyle);
        Cell clTotal = totalRow.createCell(11); clTotal.setCellValue(sumClVal); clTotal.setCellStyle(totalStyle);

        totalRow.createCell(12).setCellStyle(totalStyle);
    }

    // ==================== New Report Types ====================

    @Override
    public byte[] generateBestSellersReport(List<BestSellerReportResponse> data, LocalDate from, LocalDate to, String companyName, String companyAddress) throws IOException {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Sản Phẩm Bán Chạy");
            CellStyle headerStyle = createHeaderStyle(workbook);
            fillBestSellersSheet(workbook, sheet, headerStyle, data, from, to, companyName, companyAddress);
            workbook.write(out);
            return out.toByteArray();
        }
    }

    @Override
    public byte[] generateCustomerDueReport(List<CustomerDueReportResponse> data, String companyName, String companyAddress) throws IOException {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Công Nợ Khách Hàng");
            CellStyle headerStyle = createHeaderStyle(workbook);
            fillCustomerDueSheet(workbook, sheet, headerStyle, data, companyName, companyAddress);
            workbook.write(out);
            return out.toByteArray();
        }
    }

    @Override
    public byte[] generateSupplierDueReport(List<SupplierDueReportResponse> data, String companyName, String companyAddress) throws IOException {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Công Nợ Nhà Cung Cấp");
            CellStyle headerStyle = createHeaderStyle(workbook);
            fillSupplierDueSheet(workbook, sheet, headerStyle, data, companyName, companyAddress);
            workbook.write(out);
            return out.toByteArray();
        }
    }

    @Override
    public byte[] generateProductExpiryReport(List<ProductExpiryReportResponse> data, String companyName, String companyAddress) throws IOException {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Sản Phẩm Cận Hạn");
            CellStyle headerStyle = createHeaderStyle(workbook);
            fillProductExpirySheet(workbook, sheet, headerStyle, data, companyName, companyAddress);
            workbook.write(out);
            return out.toByteArray();
        }
    }

    @Override
    public byte[] generateCashFlowReport(List<CashFlowReportResponse> data, LocalDate from, LocalDate to, String companyName, String companyAddress) throws IOException {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Dòng Tiền");
            CellStyle headerStyle = createHeaderStyle(workbook);
            fillCashFlowSheet(workbook, sheet, headerStyle, data, from, to, companyName, companyAddress);
            workbook.write(out);
            return out.toByteArray();
        }
    }

    @Override
    public byte[] generateProfitLossReport(List<ProfitLossReportResponse> data, LocalDate from, LocalDate to, String companyName, String companyAddress) throws IOException {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Lãi Lỗ");
            CellStyle headerStyle = createHeaderStyle(workbook);
            fillProfitLossSheet(workbook, sheet, headerStyle, data, from, to, companyName, companyAddress);
            workbook.write(out);
            return out.toByteArray();
        }
    }

    // ==================== Fill Helpers for New Report Types ====================

    private void fillBestSellersSheet(SXSSFWorkbook workbook, Sheet sheet, CellStyle headerStyle, List<BestSellerReportResponse> data, LocalDate from, LocalDate to, String companyName, String companyAddress) {
        int rowIdx = addHeaderInfo(workbook, sheet, "BÁO CÁO SẢN PHẨM BÁN CHẠY", from, to, companyName, companyAddress, 4);

        Row headerRow = sheet.createRow(rowIdx++);
        String[] columns = {"STT", "Mã SP", "Tên Sản Phẩm", "SL Bán", "Doanh Thu"};
        for (int i = 0; i < columns.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(columns[i]);
            cell.setCellStyle(headerStyle);
        }
        sheet.setColumnWidth(0, 6 * 256);
        sheet.setColumnWidth(1, 15 * 256);
        sheet.setColumnWidth(2, 30 * 256);
        sheet.setColumnWidth(3, 15 * 256);
        sheet.setColumnWidth(4, 20 * 256);

        int stt = 1;
        for (BestSellerReportResponse rowData : data) {
            Row row = sheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(stt++);
            row.createCell(1).setCellValue(safeStr(rowData.getItemCode()));
            row.createCell(2).setCellValue(safeStr(rowData.getItemName()));
            row.createCell(3).setCellValue(rowData.getQuantitySold() != null ? rowData.getQuantitySold().doubleValue() : 0.0);
            row.createCell(4).setCellValue(rowData.getRevenue() != null ? rowData.getRevenue().doubleValue() : 0.0);
        }
    }

    private void fillCustomerDueSheet(SXSSFWorkbook workbook, Sheet sheet, CellStyle headerStyle, List<CustomerDueReportResponse> data, String companyName, String companyAddress) {
        int rowIdx = addHeaderInfo(workbook, sheet, "BÁO CÁO CÔNG NỢ KHÁCH HÀNG", null, null, companyName, companyAddress, 7);

        Row headerRow = sheet.createRow(rowIdx++);
        String[] columns = {"Mã nợ", "Mã KH", "Tên Khách Hàng", "Mã Đơn", "Tổng nợ", "Đã trả", "Còn nợ", "Hạn trả", "Trạng thái"};
        for (int i = 0; i < columns.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(columns[i]);
            cell.setCellStyle(headerStyle);
            sheet.setColumnWidth(i, 18 * 256);
        }
        sheet.setColumnWidth(2, 25 * 256);

        for (CustomerDueReportResponse rowData : data) {
            Row row = sheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(rowData.getDebtId() != null ? rowData.getDebtId() : 0);
            row.createCell(1).setCellValue(rowData.getCustomerId() != null ? rowData.getCustomerId() : 0);
            row.createCell(2).setCellValue(safeStr(rowData.getCustomerName()));
            row.createCell(3).setCellValue(rowData.getOrderId() != null ? rowData.getOrderId() : 0);
            row.createCell(4).setCellValue(rowData.getAmount() != null ? rowData.getAmount().doubleValue() : 0.0);
            row.createCell(5).setCellValue(rowData.getPaidAmount() != null ? rowData.getPaidAmount().doubleValue() : 0.0);
            row.createCell(6).setCellValue(rowData.getRemainingAmount() != null ? rowData.getRemainingAmount().doubleValue() : 0.0);
            row.createCell(7).setCellValue(rowData.getDueDate() != null ? rowData.getDueDate().toString() : "");
            row.createCell(8).setCellValue(customerDebtStatusLabel(rowData.getStatus()));
        }
    }

    private void fillSupplierDueSheet(SXSSFWorkbook workbook, Sheet sheet, CellStyle headerStyle, List<SupplierDueReportResponse> data, String companyName, String companyAddress) {
        int rowIdx = addHeaderInfo(workbook, sheet, "BÁO CÁO CÔNG NỢ NHÀ CUNG CẤP", null, null, companyName, companyAddress, 7);

        Row headerRow = sheet.createRow(rowIdx++);
        String[] columns = {"Mã nợ", "Mã NCC", "Tên Nhà Cung Cấp", "Mã Đơn Nhập", "Tổng nợ", "Đã trả", "Còn nợ", "Hạn trả", "Trạng thái"};
        for (int i = 0; i < columns.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(columns[i]);
            cell.setCellStyle(headerStyle);
            sheet.setColumnWidth(i, 18 * 256);
        }
        sheet.setColumnWidth(2, 25 * 256);

        for (SupplierDueReportResponse rowData : data) {
            Row row = sheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(rowData.getDebtId() != null ? rowData.getDebtId() : 0);
            row.createCell(1).setCellValue(rowData.getSupplierId() != null ? rowData.getSupplierId() : 0);
            row.createCell(2).setCellValue(safeStr(rowData.getSupplierName()));
            row.createCell(3).setCellValue(rowData.getPurchaseOrderId() != null ? rowData.getPurchaseOrderId() : 0);
            row.createCell(4).setCellValue(rowData.getAmount() != null ? rowData.getAmount().doubleValue() : 0.0);
            row.createCell(5).setCellValue(rowData.getPaidAmount() != null ? rowData.getPaidAmount().doubleValue() : 0.0);
            row.createCell(6).setCellValue(rowData.getRemainingAmount() != null ? rowData.getRemainingAmount().doubleValue() : 0.0);
            row.createCell(7).setCellValue(rowData.getDueDate() != null ? rowData.getDueDate().toString() : "");
            row.createCell(8).setCellValue(supplierDebtStatusLabel(rowData.getStatus()));
        }
    }

    private void fillProductExpirySheet(SXSSFWorkbook workbook, Sheet sheet, CellStyle headerStyle, List<ProductExpiryReportResponse> data, String companyName, String companyAddress) {
        int rowIdx = addHeaderInfo(workbook, sheet, "BÁO CÁO SẢN PHẨM CẬN HẠN SỬ DỤNG", null, null, companyName, companyAddress, 7);

        Row headerRow = sheet.createRow(rowIdx++);
        String[] columns = {"Mã SP", "Tên Sản Phẩm", "Mã Lô", "Số Lô", "Ngày Hết Hạn", "Còn (ngày)", "Số Lượng", "Vị Trí"};
        for (int i = 0; i < columns.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(columns[i]);
            cell.setCellStyle(headerStyle);
            sheet.setColumnWidth(i, 18 * 256);
        }
        sheet.setColumnWidth(1, 28 * 256);

        CellStyle warningStyle = workbook.createCellStyle();
        warningStyle.setFillForegroundColor(IndexedColors.LIGHT_YELLOW.getIndex());
        warningStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        CellStyle dangerStyle = workbook.createCellStyle();
        Font dangerFont = workbook.createFont();
        dangerFont.setBold(true);
        dangerFont.setColor(IndexedColors.WHITE.getIndex());
        dangerStyle.setFont(dangerFont);
        dangerStyle.setFillForegroundColor(IndexedColors.RED.getIndex());
        dangerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        for (ProductExpiryReportResponse rowData : data) {
            Row row = sheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(safeStr(rowData.getItemCode()));
            row.createCell(1).setCellValue(safeStr(rowData.getItemName()));
            row.createCell(2).setCellValue(rowData.getLotId() != null ? rowData.getLotId() : 0);
            row.createCell(3).setCellValue(safeStr(rowData.getLotNumber()));
            row.createCell(4).setCellValue(rowData.getExpiryDate() != null ? rowData.getExpiryDate().toString() : "");

            Cell daysCell = row.createCell(5);
            if (rowData.getDaysUntilExpiry() != null) {
                daysCell.setCellValue(rowData.getDaysUntilExpiry());
                if (rowData.getDaysUntilExpiry() <= 0) {
                    daysCell.setCellStyle(dangerStyle);
                } else if (rowData.getDaysUntilExpiry() <= 30) {
                    daysCell.setCellStyle(warningStyle);
                }
            } else {
                daysCell.setCellValue("");
            }

            row.createCell(6).setCellValue(rowData.getQuantity() != null ? rowData.getQuantity().doubleValue() : 0.0);
            row.createCell(7).setCellValue(safeStr(rowData.getLocationName()));
        }
    }

    private void fillCashFlowSheet(SXSSFWorkbook workbook, Sheet sheet, CellStyle headerStyle, List<CashFlowReportResponse> data, LocalDate from, LocalDate to, String companyName, String companyAddress) {
        int rowIdx = addHeaderInfo(workbook, sheet, "BÁO CÁO DÒNG TIỀN", from, to, companyName, companyAddress, 4);

        Row headerRow = sheet.createRow(rowIdx++);
        String[] columns = {"Ngày", "Loại", "Danh Mục", "Số Tiền", "Số Dư Lũy Kế"};
        for (int i = 0; i < columns.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(columns[i]);
            cell.setCellStyle(headerStyle);
            sheet.setColumnWidth(i, 20 * 256);
        }

        CellStyle incomeStyle = workbook.createCellStyle();
        Font incomeFont = workbook.createFont();
        incomeFont.setColor(IndexedColors.DARK_GREEN.getIndex());
        incomeStyle.setFont(incomeFont);

        CellStyle expenseStyle = workbook.createCellStyle();
        Font expenseFont = workbook.createFont();
        expenseFont.setColor(IndexedColors.RED.getIndex());
        expenseStyle.setFont(expenseFont);

        for (CashFlowReportResponse rowData : data) {
            Row row = sheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(rowData.getDate() != null ? rowData.getDate().toString() : "");

            String typeStr = rowData.getType() != null ? rowData.getType().name() : "";
            Cell typeCell = row.createCell(1);
            typeCell.setCellValue("INCOME".equals(typeStr) ? "Thu" : "Chi");
            typeCell.setCellStyle("INCOME".equals(typeStr) ? incomeStyle : expenseStyle);

            row.createCell(2).setCellValue(safeStr(rowData.getCategory()));
            row.createCell(3).setCellValue(rowData.getAmount() != null ? rowData.getAmount().doubleValue() : 0.0);
            row.createCell(4).setCellValue(rowData.getRunningBalance() != null ? rowData.getRunningBalance().doubleValue() : 0.0);
        }
    }

    private void fillProfitLossSheet(SXSSFWorkbook workbook, Sheet sheet, CellStyle headerStyle, List<ProfitLossReportResponse> data, LocalDate from, LocalDate to, String companyName, String companyAddress) {
        int rowIdx = addHeaderInfo(workbook, sheet, "BÁO CÁO LÃI LỖ", from, to, companyName, companyAddress, 5);

        Row headerRow = sheet.createRow(rowIdx++);
        String[] columns = {"Ngày", "Doanh Thu", "Giá Vốn", "Lãi Gộp", "Chi Phí", "Lãi Ròng"};
        for (int i = 0; i < columns.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(columns[i]);
            cell.setCellStyle(headerStyle);
            sheet.setColumnWidth(i, 20 * 256);
        }

        CellStyle profitStyle = workbook.createCellStyle();
        Font profitFont = workbook.createFont();
        profitFont.setColor(IndexedColors.DARK_GREEN.getIndex());
        profitFont.setBold(true);
        profitStyle.setFont(profitFont);

        CellStyle lossStyle = workbook.createCellStyle();
        Font lossFont = workbook.createFont();
        lossFont.setColor(IndexedColors.RED.getIndex());
        lossFont.setBold(true);
        lossStyle.setFont(lossFont);

        for (ProfitLossReportResponse rowData : data) {
            Row row = sheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(rowData.getDate() != null ? rowData.getDate().toString() : "");
            row.createCell(1).setCellValue(rowData.getRevenue() != null ? rowData.getRevenue().doubleValue() : 0.0);
            row.createCell(2).setCellValue(rowData.getCostOfGoods() != null ? rowData.getCostOfGoods().doubleValue() : 0.0);
            row.createCell(3).setCellValue(rowData.getGrossProfit() != null ? rowData.getGrossProfit().doubleValue() : 0.0);
            row.createCell(4).setCellValue(rowData.getExpenses() != null ? rowData.getExpenses().doubleValue() : 0.0);

            Cell netCell = row.createCell(5);
            double netProfit = rowData.getNetProfit() != null ? rowData.getNetProfit().doubleValue() : 0.0;
            netCell.setCellValue(netProfit);
            if (netProfit >= 0) {
                netCell.setCellStyle(profitStyle);
            } else {
                netCell.setCellStyle(lossStyle);
            }
        }
    }

    // ==================== Label Helpers ====================

    private String customerDebtStatusLabel(CustomerDebtStatus status) {
        if (status == null) return "";
        return switch (status) {
            case UNPAID -> "Chưa thanh toán";
            case PARTIAL -> "Thanh toán một phần";
            case PAID -> "Đã thanh toán";
            case OVERDUE -> "Quá hạn";
        };
    }

    private String supplierDebtStatusLabel(SupplierDebtStatus status) {
        if (status == null) return "";
        return switch (status) {
            case UNPAID -> "Chưa thanh toán";
            case PARTIAL -> "Thanh toán một phần";
            case PAID -> "Đã thanh toán";
            case OVERDUE -> "Quá hạn";
        };
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

    // ==================== Overloaded methods with AI data ====================

    @Override
    public byte[] generateSalesReport(List<SalesReportResponse> data, LocalDate from, LocalDate to,
                                      String companyName, String companyAddress,
                                      List<ForecastResultResponse> forecasts) throws IOException {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Báo Cáo Doanh Thu");
            CellStyle headerStyle = createHeaderStyle(workbook);
            fillSalesSheet(workbook, sheet, headerStyle, data, from, to, companyName, companyAddress);

            if (forecasts != null && !forecasts.isEmpty()) {
                fillAiForecastSection(workbook, sheet, sheet.getLastRowNum() + 3, forecasts);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    @Override
    public byte[] generateInventoryReport(List<InventoryReportResponse> data, LocalDate from, LocalDate to,
                                          String companyName, String companyAddress,
                                          List<Map<String, Object>> reorderRecs) throws IOException {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Báo Cáo Tồn Kho");
            CellStyle headerStyle = createHeaderStyle(workbook);
            fillInventorySheet(workbook, sheet, headerStyle, data, from, to, companyName, companyAddress);

            if (reorderRecs != null && !reorderRecs.isEmpty()) {
                fillReorderSection(workbook, sheet, sheet.getLastRowNum() + 3, reorderRecs);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    @Override
    public byte[] generateComprehensiveExcel(List<SalesReportResponse> sales,
                                              List<PurchaseReportResponse> purchases,
                                              List<InventoryReportResponse> inventory,
                                              List<InventoryNxtReportResponse> nxt,
                                              LocalDate from, LocalDate to,
                                              String companyName, String companyAddress,
                                              List<ForecastResultResponse> forecasts,
                                              List<Map<String, Object>> reorderRecs) throws IOException {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            CellStyle headerStyle = createHeaderStyle(workbook);

            Sheet salesSheet = workbook.createSheet("Báo Cáo Doanh Thu");
            fillSalesSheet(workbook, salesSheet, headerStyle, sales, from, to, companyName, companyAddress);
            if (forecasts != null && !forecasts.isEmpty()) {
                fillAiForecastSection(workbook, salesSheet, salesSheet.getLastRowNum() + 3, forecasts);
            }

            Sheet purchaseSheet = workbook.createSheet("Báo Cáo Nhập Hàng");
            fillPurchaseSheet(workbook, purchaseSheet, headerStyle, purchases, from, to, companyName, companyAddress);

            Sheet inventorySheet = workbook.createSheet("Báo Cáo Tồn Kho");
            fillInventorySheet(workbook, inventorySheet, headerStyle, inventory, from, to, companyName, companyAddress);
            if (reorderRecs != null && !reorderRecs.isEmpty()) {
                fillReorderSection(workbook, inventorySheet, inventorySheet.getLastRowNum() + 3, reorderRecs);
            }

            Sheet nxtSheet = workbook.createSheet("Nhập Xuất Tồn");
            fillNxtSheet(workbook, nxtSheet, nxt, from, to, companyName, companyAddress);

            // Sheet AI Insights tổng hợp
            boolean hasAiData = (forecasts != null && !forecasts.isEmpty())
                    || (reorderRecs != null && !reorderRecs.isEmpty());
            if (hasAiData) {
                Sheet aiSheet = workbook.createSheet("AI Insights");
                fillAiInsightsSheet(workbook, aiSheet, from, to, companyName, companyAddress, forecasts, reorderRecs);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    // ==================== AI Section Helpers ====================

    private void fillAiForecastSection(SXSSFWorkbook workbook, Sheet sheet, int startRow,
                                       List<ForecastResultResponse> forecasts) {
        CellStyle sectionTitleStyle = createSectionTitleStyle(workbook);

        Row titleRow = sheet.createRow(startRow);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("DỰ BÁO NHU CẦU TỪ AI");
        titleCell.setCellStyle(sectionTitleStyle);
        sheet.addMergedRegion(new CellRangeAddress(startRow, startRow, 0, 8));

        int rowIdx = startRow + 1;

        CellStyle headerStyle = createHeaderStyle(workbook);
        Row headerRow = sheet.createRow(rowIdx++);
        String[] columns = {"Mã SP", "Tên Sản Phẩm", "Tồn kho", "Dự báo 7 ngày",
                "Dự báo 14 ngày", "Dự báo 30 ngày", "Model AI", "Trạng thái", "Gợi ý"};
        for (int i = 0; i < columns.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(columns[i]);
            cell.setCellStyle(headerStyle);
        }
        sheet.setColumnWidth(1, 28 * 256);
        sheet.setColumnWidth(8, 40 * 256);

        Map<String, CellStyle> riskStyles = createRiskStyles(workbook);

        for (ForecastResultResponse fr : forecasts) {
            Row row = sheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(safeStr(fr.getItemCode()));
            row.createCell(1).setCellValue(safeStr(fr.getItemName()));
            row.createCell(2).setCellValue(safeDbl(fr.getStockOnHand()));
            row.createCell(3).setCellValue(safeDbl(fr.getPred7d()));
            row.createCell(4).setCellValue(safeDbl(fr.getPred14d()));
            row.createCell(5).setCellValue(safeDbl(fr.getPred30d()));
            row.createCell(6).setCellValue(fr.getModelType() != null ? fr.getModelType() : "N/A");

            Cell riskCell = row.createCell(7);
            String risk = fr.getRiskLevel() != null ? fr.getRiskLevel() : "N/A";
            riskCell.setCellValue(riskLabel(risk));
            CellStyle riskStyle = riskStyles.get(risk);
            if (riskStyle != null) riskCell.setCellStyle(riskStyle);

            row.createCell(8).setCellValue(safeStr(fr.getRecommendation()));
        }

        Row noteRow = sheet.createRow(rowIdx + 1);
        CellStyle noteStyle = createNoteStyle(workbook);
        Cell noteCell = noteRow.createCell(0);
        noteCell.setCellValue("* Nguồn: Dữ liệu dự báo từ hệ thống ML (Machine Learning). Cập nhật tại thời điểm xuất báo cáo.");
        noteCell.setCellStyle(noteStyle);
    }

    private void fillReorderSection(SXSSFWorkbook workbook, Sheet sheet, int startRow,
                                    List<Map<String, Object>> reorderRecs) {
        CellStyle sectionTitleStyle = createSectionTitleStyle(workbook);

        Row titleRow = sheet.createRow(startRow);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("GỢI Ý NHẬP HÀNG TỪ AI");
        titleCell.setCellStyle(sectionTitleStyle);
        sheet.addMergedRegion(new CellRangeAddress(startRow, startRow, 0, 7));

        int rowIdx = startRow + 1;

        // Chỉ hiển thị items có suggestedQty > 0
        List<Map<String, Object>> filtered = reorderRecs.stream()
                .filter(r -> safeDblObj(r.get("suggestedQty")) > 0)
                .toList();

        if (filtered.isEmpty()) {
            Row emptyRow = sheet.createRow(rowIdx);
            emptyRow.createCell(0).setCellValue("Không có gợi ý nhập hàng tại thời điểm này.");
            return;
        }

        CellStyle headerStyle = createHeaderStyle(workbook);
        Row headerRow = sheet.createRow(rowIdx++);
        String[] columns = {"Mã SP", "Tên Sản Phẩm", "Tồn hiện tại", "Nhu cầu 7 ngày",
                "Nhu cầu 14 ngày", "SL gợi ý nhập", "Mức rủi ro", "Nguồn"};
        for (int i = 0; i < columns.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(columns[i]);
            cell.setCellStyle(headerStyle);
        }
        sheet.setColumnWidth(1, 28 * 256);

        Map<String, CellStyle> riskStyles = createRiskStyles(workbook);

        for (Map<String, Object> rec : filtered) {
            Row row = sheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(safeStr(rec.get("itemCode")));
            row.createCell(1).setCellValue(safeStr(rec.get("itemName")));
            row.createCell(2).setCellValue(safeDblObj(rec.get("currentAvailable")));
            row.createCell(3).setCellValue(safeDblObj(rec.get("predictedDemand7d")));
            row.createCell(4).setCellValue(safeDblObj(rec.get("predictedDemand14d")));
            row.createCell(5).setCellValue(safeDblObj(rec.get("suggestedQty")));

            Cell riskCell = row.createCell(6);
            String risk = safeStr(rec.get("riskLevel"));
            riskCell.setCellValue(riskLabel(risk));
            CellStyle riskStyle = riskStyles.get(risk);
            if (riskStyle != null) riskCell.setCellStyle(riskStyle);

            row.createCell(7).setCellValue(safeStr(rec.get("source")));
        }

        Row noteRow = sheet.createRow(rowIdx + 1);
        CellStyle noteStyle = createNoteStyle(workbook);
        Cell noteCell = noteRow.createCell(0);
        String source = filtered.get(0).get("source") != null ? safeStr(filtered.get(0).get("source")) : "AI";
        noteCell.setCellValue("* Nguồn: " + source + ". Công thức: Dự báo 14 ngày + Safety Stock − Tồn hiện tại.");
        noteCell.setCellStyle(noteStyle);
    }

    private void fillAiInsightsSheet(SXSSFWorkbook workbook, Sheet sheet,
                                     LocalDate from, LocalDate to,
                                     String companyName, String companyAddress,
                                     List<ForecastResultResponse> forecasts,
                                     List<Map<String, Object>> reorderRecs) {
        int rowIdx = addHeaderInfo(workbook, sheet, "PHÂN TÍCH AI TỔNG HỢP", from, to, companyName, companyAddress, 8);

        if (forecasts != null && !forecasts.isEmpty()) {
            fillAiForecastSection(workbook, sheet, rowIdx, forecasts);
            rowIdx = sheet.getLastRowNum() + 3;
        }

        if (reorderRecs != null && !reorderRecs.isEmpty()) {
            fillReorderSection(workbook, sheet, rowIdx, reorderRecs);
        }
    }

    // ==================== Style Helpers ====================

    private CellStyle createSectionTitleStyle(SXSSFWorkbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 13);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.LEFT);
        return style;
    }

    private CellStyle createNoteStyle(SXSSFWorkbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setItalic(true);
        font.setColor(IndexedColors.GREY_50_PERCENT.getIndex());
        style.setFont(font);
        return style;
    }

    private Map<String, CellStyle> createRiskStyles(SXSSFWorkbook workbook) {
        Map<String, CellStyle> styles = new HashMap<>();

        // CRITICAL / HIGH → đỏ
        CellStyle critical = workbook.createCellStyle();
        Font critFont = workbook.createFont();
        critFont.setBold(true);
        critFont.setColor(IndexedColors.WHITE.getIndex());
        critical.setFont(critFont);
        critical.setFillForegroundColor(IndexedColors.RED.getIndex());
        critical.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        styles.put("CRITICAL", critical);
        styles.put("HIGH", critical);

        // WARNING / MEDIUM → vàng
        CellStyle warning = workbook.createCellStyle();
        Font warnFont = workbook.createFont();
        warnFont.setBold(true);
        warning.setFont(warnFont);
        warning.setFillForegroundColor(IndexedColors.LIGHT_YELLOW.getIndex());
        warning.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        styles.put("WARNING", warning);
        styles.put("MEDIUM", warning);

        // OK / LOW → xanh
        CellStyle ok = workbook.createCellStyle();
        Font okFont = workbook.createFont();
        okFont.setColor(IndexedColors.DARK_GREEN.getIndex());
        ok.setFont(okFont);
        ok.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
        ok.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        styles.put("OK", ok);
        styles.put("LOW", ok);

        // OVERSTOCK → cam
        CellStyle overstock = workbook.createCellStyle();
        Font osFont = workbook.createFont();
        osFont.setBold(true);
        overstock.setFont(osFont);
        overstock.setFillForegroundColor(IndexedColors.LIGHT_ORANGE.getIndex());
        overstock.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        styles.put("OVERSTOCK", overstock);

        return styles;
    }

    private String riskLabel(String riskLevel) {
        if (riskLevel == null) return "N/A";
        return switch (riskLevel) {
            case "CRITICAL" -> "Nguy hiểm";
            case "HIGH" -> "Cao";
            case "WARNING" -> "Cảnh báo";
            case "MEDIUM" -> "Trung bình";
            case "OK" -> "An toàn";
            case "LOW" -> "Thấp";
            case "OVERSTOCK" -> "Tồn dư";
            default -> riskLevel;
        };
    }

    private String safeStr(Object obj) {
        return obj != null ? obj.toString() : "";
    }

    private double safeDbl(Number num) {
        return num != null ? num.doubleValue() : 0.0;
    }

    private double safeDblObj(Object obj) {
        if (obj == null) return 0.0;
        if (obj instanceof Number) return ((Number) obj).doubleValue();
        try { return Double.parseDouble(obj.toString()); } catch (Exception e) { return 0.0; }
    }
}
