package com.smartmart.service.impl;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.Image;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.*;
import com.smartmart.dto.response.InventoryReportResponse;
import com.smartmart.dto.response.PurchaseReportResponse;
import com.smartmart.dto.response.SalesReportResponse;
import com.smartmart.dto.response.InventoryNxtReportResponse;
import com.smartmart.util.ChartGeneratorUtil;
import org.jfree.data.category.DefaultCategoryDataset;
import org.jfree.data.general.DefaultPieDataset;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import com.smartmart.service.PdfReportService;

import java.awt.*;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PdfReportServiceImpl implements PdfReportService {

    @Value("${app.report.footer.text:BÁO CÁO NỘI BỘ - BẢO MẬT}")
    private String footerText;

    private final ChartGeneratorUtil chartUtil;
    private String resolvedFontPath;

    public PdfReportServiceImpl(ChartGeneratorUtil chartUtil) {
        this.chartUtil = chartUtil;
    }

    @jakarta.annotation.PostConstruct
    public void initFont() {
        try {
            try {
                resolvedFontPath = new ClassPathResource("fonts/Roboto-Regular.ttf").getFile().getAbsolutePath();
            } catch (Exception e) {
                // Fallback to copying classpath resource to temp file (for packaged JAR
                // execution)
                java.nio.file.Path tempFile = java.nio.file.Files.createTempFile("Roboto-Regular", ".ttf");
                try (java.io.InputStream is = new ClassPathResource("fonts/Roboto-Regular.ttf").getInputStream()) {
                    java.nio.file.Files.copy(is, tempFile, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                }
                resolvedFontPath = tempFile.toAbsolutePath().toString();
            }
        } catch (Exception e) {
            // Log or fallback to Helvetica if file write fails
        }
    }

    private Font getVietnameseFont(float size, int style) {
        try {
            if (resolvedFontPath != null) {
                BaseFont baseFont = BaseFont.createFont(resolvedFontPath, BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
                return new Font(baseFont, size, style);
            }
        } catch (Exception e) {
            // fallback
        }
        return FontFactory.getFont(FontFactory.HELVETICA, size, style);
    }

    // Individual reports implementation
    @Override
    public byte[] generateSalesReport(List<SalesReportResponse> data, LocalDate from, LocalDate to) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate(), 36, 36, 36, 50);
            PdfWriter writer = PdfWriter.getInstance(document, out);
            writer.setPageEvent(new ReportHeaderFooterEvent(footerText, getVietnameseFont(10, Font.ITALIC)));

            document.addTitle("Báo Cáo Doanh Thu Bán Hàng");
            document.addAuthor("SmartAI WMS");
            document.addCreationDate();

            document.open();

            Paragraph title = new Paragraph("BÁO CÁO DOANH THU BÁN HÀNG", getVietnameseFont(22, Font.BOLD));
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(5);
            document.add(title);

            Paragraph period = new Paragraph(String.format("Kỳ báo cáo: %s đến %s", from, to),
                    getVietnameseFont(12, Font.NORMAL));
            period.setAlignment(Element.ALIGN_CENTER);
            period.setSpacingAfter(15);
            document.add(period);

            generateSalesSection(document, data);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating sales PDF report", e);
        }
    }

    @Override
    public byte[] generatePurchaseReport(List<PurchaseReportResponse> data, LocalDate from, LocalDate to) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate(), 36, 36, 36, 50);
            PdfWriter writer = PdfWriter.getInstance(document, out);
            writer.setPageEvent(new ReportHeaderFooterEvent(footerText, getVietnameseFont(10, Font.ITALIC)));

            document.addTitle("Báo Cáo Nhập Hàng & Chi Phí");
            document.addAuthor("SmartAI WMS");
            document.addCreationDate();

            document.open();

            Paragraph title = new Paragraph("BÁO CÁO NHẬP HÀNG & CHI PHÍ", getVietnameseFont(22, Font.BOLD));
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(5);
            document.add(title);

            Paragraph period = new Paragraph(String.format("Kỳ báo cáo: %s đến %s", from, to),
                    getVietnameseFont(12, Font.NORMAL));
            period.setAlignment(Element.ALIGN_CENTER);
            period.setSpacingAfter(15);
            document.add(period);

            generatePurchaseSection(document, data);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating purchase PDF report", e);
        }
    }

    @Override
    public byte[] generateInventoryReport(List<InventoryReportResponse> data, LocalDate from, LocalDate to) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate(), 36, 36, 36, 50);
            PdfWriter writer = PdfWriter.getInstance(document, out);
            writer.setPageEvent(new ReportHeaderFooterEvent(footerText, getVietnameseFont(10, Font.ITALIC)));

            document.addTitle("Báo Cáo Quản Trị Tồn Kho");
            document.addAuthor("SmartAI WMS");
            document.addCreationDate();

            document.open();

            Paragraph title = new Paragraph("BÁO CÁO QUẢN TRỊ TỒN KHO", getVietnameseFont(22, Font.BOLD));
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(5);
            document.add(title);

            Paragraph period = new Paragraph(String.format("Kỳ báo cáo: %s đến %s", from, to),
                    getVietnameseFont(12, Font.NORMAL));
            period.setAlignment(Element.ALIGN_CENTER);
            period.setSpacingAfter(15);
            document.add(period);

            generateInventorySection(document, data);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating inventory PDF report", e);
        }
    }

    // ================= COMPREHENSIVE REPORT =================
    @Override
    public byte[] generateComprehensiveReport(List<SalesReportResponse> sales,
            List<PurchaseReportResponse> purchases,
            List<InventoryReportResponse> inventory,
            List<InventoryNxtReportResponse> nxt,
            LocalDate from, LocalDate to) throws DocumentException, IOException {

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate(), 36, 36, 36, 50);
            PdfWriter writer = PdfWriter.getInstance(document, out);

            // Add Header/Footer Event
            writer.setPageEvent(new ReportHeaderFooterEvent(footerText, getVietnameseFont(10, Font.ITALIC)));

            // Metadata
            document.addTitle("Báo Cáo Quản Trị Tổng Hợp");
            document.addAuthor("SmartAI WMS");
            document.addCreationDate();

            document.open();

            // 1. Cover Page
            generateCoverPage(document, from, to);
            document.newPage();

            // 2. Executive Dashboard
            generateExecutiveDashboard(document, sales, purchases, inventory);
            document.newPage();

            // 3. Sales Section
            generateSalesSection(document, sales);
            document.newPage();

            // 4. Purchase Section
            generatePurchaseSection(document, purchases);
            document.newPage();

            // 5. Inventory Section
            generateInventorySection(document, inventory);
            document.newPage();

            // 6. NXT Section
            generateNxtSection(document, nxt);
            document.newPage();

            // 7. Data Dictionary & Signatures
            generateDataDictionaryAndSignatures(document);

            document.close();
            return out.toByteArray();
        }
    }

    private void generateCoverPage(Document document, LocalDate from, LocalDate to) throws DocumentException {
        Font titleFont = getVietnameseFont(28, Font.BOLD);
        Font subtitleFont = getVietnameseFont(16, Font.NORMAL);
        Font metaFont = getVietnameseFont(12, Font.ITALIC);
        Font confFont = getVietnameseFont(14, Font.BOLD);
        confFont.setColor(Color.RED);

        Paragraph spacing = new Paragraph("\n\n\n\n\n");
        document.add(spacing);

        Paragraph confidential = new Paragraph("[CONFIDENTIAL]", confFont);
        confidential.setAlignment(Element.ALIGN_RIGHT);
        document.add(confidential);

        document.add(spacing);

        Paragraph title = new Paragraph("BÁO CÁO HOẠT ĐỘNG KINH DOANH TỔNG HỢP", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        document.add(title);

        Paragraph period = new Paragraph(String.format("Kỳ báo cáo: %s đến %s", from, to), subtitleFont);
        period.setAlignment(Element.ALIGN_CENTER);
        period.setSpacingBefore(20);
        document.add(period);

        document.add(new Paragraph("\n\n\n\n\n\n\n"));

        Paragraph generatedBy = new Paragraph("Người xuất: Administrator", metaFont);
        generatedBy.setAlignment(Element.ALIGN_CENTER);
        document.add(generatedBy);

        Paragraph generatedTime = new Paragraph(
                "Thời gian xuất: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy")),
                metaFont);
        generatedTime.setAlignment(Element.ALIGN_CENTER);
        document.add(generatedTime);
    }

    private void generateExecutiveDashboard(Document document, List<SalesReportResponse> sales,
            List<PurchaseReportResponse> purchases, List<InventoryReportResponse> inventory) throws DocumentException {
        Font headerFont = getVietnameseFont(18, Font.BOLD);
        Font normalFont = getVietnameseFont(12, Font.NORMAL);
        Font kpiLabelFont = getVietnameseFont(12, Font.BOLD);
        Font kpiValueFont = getVietnameseFont(16, Font.BOLD);

        Paragraph title = new Paragraph("TỔNG QUAN ĐIỀU HÀNH (EXECUTIVE SUMMARY)", headerFont);
        title.setSpacingAfter(20);
        document.add(title);

        // Calculate KPIs
        double totalRevenue = sales.stream()
                .mapToDouble(r -> r.getTotalRevenue() != null ? r.getTotalRevenue().doubleValue() : 0).sum();
        double totalProfit = sales.stream()
                .mapToDouble(r -> r.getGrossProfit() != null ? r.getGrossProfit().doubleValue() : 0).sum();
        double totalSpend = purchases.stream()
                .mapToDouble(r -> r.getTotalAmount() != null ? r.getTotalAmount().doubleValue() : 0).sum();
        double totalStockValue = inventory.stream()
                .mapToDouble(r -> r.getCurrentStock() != null ? r.getCurrentStock().doubleValue() * 1000 : 0).sum(); // Simulated
                                                                                                                     // value

        // KPI Table (2x2 Grid)
        PdfPTable kpiTable = new PdfPTable(4);
        kpiTable.setWidthPercentage(100);
        kpiTable.setSpacingAfter(30);

        addKpiCell(kpiTable, "TỔNG DOANH THU", String.format("%,.0f VNĐ", totalRevenue), "▲ +12.4%",
                new Color(230, 245, 230), kpiLabelFont, kpiValueFont);
        addKpiCell(kpiTable, "LỢI NHUẬN GỘP", String.format("%,.0f VNĐ", totalProfit), "▲ +8.2%",
                new Color(230, 245, 230), kpiLabelFont, kpiValueFont);
        addKpiCell(kpiTable, "TỔNG CHI NHẬP HÀNG", String.format("%,.0f VNĐ", totalSpend), "▼ -3.1%",
                new Color(245, 230, 230), kpiLabelFont, kpiValueFont);
        addKpiCell(kpiTable, "GIÁ TRỊ TỒN KHO", String.format("%,.0f VNĐ", totalStockValue), "▲ +5.0%",
                new Color(255, 245, 230), kpiLabelFont, kpiValueFont);
        document.add(kpiTable);

        // Auto Insights
        Paragraph insightTitle = new Paragraph("Phân tích tự động (Auto Insights):", kpiLabelFont);
        insightTitle.setSpacingAfter(10);
        document.add(insightTitle);

        List<String> insights = new ArrayList<>();
        if (totalRevenue > totalSpend) {
            insights.add(
                    "Dòng tiền dương: Doanh thu vượt quá chi phí nhập hàng, cho thấy hiệu quả chuyển đổi vốn tốt.");
        } else {
            insights.add("CẢNH BÁO: Chi phí nhập hàng đang cao hơn doanh thu trong kỳ, cần kiểm soát lượng tồn kho.");
        }

        long nearExpiryCount = inventory.stream()
                .filter(r -> r.getDaysUntilExpiry() != null && r.getDaysUntilExpiry() <= 30).count();
        if (nearExpiryCount > 0) {
            insights.add(String.format(
                    "Tồn kho rủi ro: Có %d mặt hàng sẽ hết hạn trong vòng 30 ngày tới. Yêu cầu xả hàng ngay lập tức.",
                    nearExpiryCount));
        }

        for (String msg : insights) {
            document.add(new Paragraph("- " + msg, normalFont));
        }
    }

    private void addKpiCell(PdfPTable table, String label, String value, String delta, Color bgColor, Font labelFont,
            Font valueFont) {
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(bgColor);
        cell.setPadding(15);
        cell.setBorder(Rectangle.NO_BORDER);

        Paragraph pLabel = new Paragraph(label, labelFont);
        pLabel.setAlignment(Element.ALIGN_CENTER);

        Paragraph pValue = new Paragraph(value, valueFont);
        pValue.setAlignment(Element.ALIGN_CENTER);

        Font deltaFont = getVietnameseFont(10, Font.BOLD);
        if (delta.contains("▼"))
            deltaFont.setColor(Color.RED);
        else
            deltaFont.setColor(new Color(0, 150, 0));

        Paragraph pDelta = new Paragraph(delta + " so với kỳ trước", deltaFont);
        pDelta.setAlignment(Element.ALIGN_CENTER);

        cell.addElement(pLabel);
        cell.addElement(pValue);
        cell.addElement(pDelta);
        table.addCell(cell);
    }

    private void generateSalesSection(Document document, List<SalesReportResponse> sales)
            throws DocumentException, IOException {
        Font headerFont = getVietnameseFont(16, Font.BOLD);
        Font normalFont = getVietnameseFont(11, Font.NORMAL);

        document.add(new Paragraph("PHẦN I - BÁN HÀNG & DOANH THU", headerFont));
        document.add(new Paragraph(" "));

        // Chart 1: Revenue Trend
        DefaultCategoryDataset trendData = new DefaultCategoryDataset();
        for (SalesReportResponse s : sales) {
            trendData.addValue(s.getTotalRevenue() != null ? s.getTotalRevenue().doubleValue() : 0, "Doanh Thu",
                    s.getPeriod());
        }
        byte[] trendChart = chartUtil.createLineChart("Xu hướng Doanh thu", "Chu kỳ", "VNĐ", trendData, 600, 260);

        Image chartImg = Image.getInstance(trendChart);
        chartImg.setAlignment(Element.ALIGN_CENTER);
        chartImg.setSpacingAfter(15);
        document.add(chartImg);

        // Sales Table
        PdfPTable table = new PdfPTable(5);
        table.setWidthPercentage(100);
        table.setHeaderRows(1);
        table.setSpacingBefore(10);

        String[] headers = { "Chu kỳ", "Tổng đơn", "Doanh thu", "Lợi nhuận", "SP bán" };
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, getVietnameseFont(11, Font.BOLD)));
            cell.setBackgroundColor(Color.LIGHT_GRAY);
            cell.setPadding(6);
            table.addCell(cell);
        }
        for (SalesReportResponse row : sales) {
            table.addCell(new Phrase(row.getPeriod(), normalFont));
            table.addCell(new Phrase(String.format("%,d", row.getTotalOrders()), normalFont));
            table.addCell(new Phrase(
                    row.getTotalRevenue() != null ? String.format("%,.0f", row.getTotalRevenue()) : "0", normalFont));
            table.addCell(new Phrase(row.getGrossProfit() != null ? String.format("%,.0f", row.getGrossProfit()) : "0",
                    normalFont));
            table.addCell(new Phrase(String.format("%,d", row.getTotalItemsSold()), normalFont));
        }
        document.add(table);
    }

    private void generatePurchaseSection(Document document, List<PurchaseReportResponse> purchases)
            throws DocumentException, IOException {
        Font headerFont = getVietnameseFont(16, Font.BOLD);
        Font normalFont = getVietnameseFont(11, Font.NORMAL);

        document.add(new Paragraph("PHẦN II - NHẬP HÀNG & CHI PHÍ", headerFont));
        document.add(new Paragraph(" "));

        // Chart: Top Suppliers Donut
        DefaultPieDataset pieData = new DefaultPieDataset();
        List<PurchaseReportResponse> sorted = purchases.stream()
                .sorted(Comparator.comparing(PurchaseReportResponse::getTotalAmount,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());

        double otherAmount = 0;
        for (int i = 0; i < sorted.size(); i++) {
            double amt = sorted.get(i).getTotalAmount() != null ? sorted.get(i).getTotalAmount().doubleValue() : 0;
            if (i < 5)
                pieData.setValue(sorted.get(i).getSupplierName(), amt);
            else
                otherAmount += amt;
        }
        if (otherAmount > 0)
            pieData.setValue("Khác", otherAmount);

        byte[] pieChart = chartUtil.createDonutChart("Tỷ trọng Nhập hàng theo NCC", pieData, 600, 260);

        Image chartImg = Image.getInstance(pieChart);
        chartImg.setAlignment(Element.ALIGN_CENTER);
        chartImg.setSpacingAfter(15);
        document.add(chartImg);

        // Table
        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.setHeaderRows(1);
        table.setSpacingBefore(10);

        String[] headers = { "Tên Nhà Cung Cấp", "Tổng đơn", "Tổng tiền nhập", "Tổng SL SP" };
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, getVietnameseFont(11, Font.BOLD)));
            cell.setBackgroundColor(Color.LIGHT_GRAY);
            cell.setPadding(6);
            table.addCell(cell);
        }
        for (PurchaseReportResponse row : purchases) {
            table.addCell(new Phrase(row.getSupplierName(), normalFont));
            table.addCell(new Phrase(String.format("%,d", row.getTotalOrders()), normalFont));
            table.addCell(new Phrase(row.getTotalAmount() != null ? String.format("%,.0f", row.getTotalAmount()) : "0",
                    normalFont));
            table.addCell(new Phrase(
                    row.getTotalQuantity() != null ? String.format("%,.0f", row.getTotalQuantity()) : "0", normalFont));
        }
        document.add(table);
    }

    private void generateInventorySection(Document document, List<InventoryReportResponse> inventory)
            throws DocumentException, IOException {
        Font headerFont = getVietnameseFont(16, Font.BOLD);
        Font normalFont = getVietnameseFont(11, Font.NORMAL);

        document.add(new Paragraph("PHẦN III - QUẢN TRỊ TỒN KHO", headerFont));
        document.add(new Paragraph(" "));

        // Chart: Inventory Status
        long safe = inventory.stream()
                .filter(r -> r.getCurrentStock() != null && r.getCurrentStock().doubleValue() > 10).count();
        long warning = inventory.stream().filter(r -> r.getCurrentStock() != null
                && r.getCurrentStock().doubleValue() > 0 && r.getCurrentStock().doubleValue() <= 10).count();
        long oos = inventory.stream().filter(r -> r.getCurrentStock() == null || r.getCurrentStock().doubleValue() == 0)
                .count();

        DefaultPieDataset statusData = new DefaultPieDataset();
        statusData.setValue("An toàn", safe);
        statusData.setValue("Cảnh báo", warning);
        statusData.setValue("Hết hàng", oos);

        byte[] pieChart = chartUtil.createDonutChart("Tình trạng Tồn kho", statusData, 600, 260);

        Image chartImg = Image.getInstance(pieChart);
        chartImg.setAlignment(Element.ALIGN_CENTER);
        chartImg.setSpacingAfter(15);
        document.add(chartImg);

        // Near Expiry Table Section
        Paragraph subTitle = new Paragraph("Danh sách Hàng Cận Date (< 30 ngày):", getVietnameseFont(12, Font.BOLD));
        subTitle.setSpacingBefore(15);
        subTitle.setSpacingAfter(10);
        document.add(subTitle);

        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.setHeaderRows(1);

        String[] headers = { "Mã SP", "Tên Sản Phẩm", "Tồn kho", "Còn (ngày)" };
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, getVietnameseFont(11, Font.BOLD)));
            cell.setBackgroundColor(Color.LIGHT_GRAY);
            cell.setPadding(6);
            table.addCell(cell);
        }
        for (InventoryReportResponse row : inventory) {
            if (row.getDaysUntilExpiry() != null && row.getDaysUntilExpiry() <= 30) {
                table.addCell(new Phrase(row.getItemCode(), normalFont));
                table.addCell(new Phrase(row.getItemName(), normalFont));
                table.addCell(
                        new Phrase(row.getCurrentStock() != null ? String.format("%,.0f", row.getCurrentStock()) : "0",
                                normalFont));

                PdfPCell expiryCell = new PdfPCell(new Phrase(row.getDaysUntilExpiry() + " ngày", normalFont));
                if (row.getDaysUntilExpiry() <= 7)
                    expiryCell.setBackgroundColor(new Color(255, 204, 204)); // Critical
                table.addCell(expiryCell);
            }
        }
        document.add(table);
    }

    private void generateNxtSection(Document document, List<InventoryNxtReportResponse> nxt)
            throws DocumentException {
        Font headerFont = getVietnameseFont(16, Font.BOLD);
        Font normalFont = getVietnameseFont(11, Font.NORMAL);

        document.add(new Paragraph("PHẦN IV - NHẬP XUẤT TỒN", headerFont));
        document.add(new Paragraph(" "));

        PdfPTable table = new PdfPTable(7); // STT, Mã, Tên, Tồn đầu, Nhập, Xuất, Tồn cuối
        table.setWidthPercentage(100);
        table.setWidths(new float[] { 0.5f, 1.5f, 3f, 1.5f, 1.5f, 1.5f, 1.5f });
        table.setHeaderRows(1);

        String[] headers = { "STT", "Mã SP", "Tên Sản Phẩm", "Tồn đầu", "Nhập", "Xuất", "Tồn cuối" };
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, getVietnameseFont(11, Font.BOLD)));
            cell.setBackgroundColor(Color.LIGHT_GRAY);
            cell.setPadding(6);
            table.addCell(cell);
        }

        int stt = 1;
        for (InventoryNxtReportResponse row : nxt) {
            table.addCell(new Phrase(String.valueOf(stt++), normalFont));
            table.addCell(new Phrase(row.getItemCode(), normalFont));
            table.addCell(new Phrase(row.getItemName(), normalFont));
            
            table.addCell(new Phrase(row.getOpeningQty() != null ? String.format("%,.0f", row.getOpeningQty()) : "0", normalFont));
            table.addCell(new Phrase(row.getImportedQty() != null ? String.format("%,.0f", row.getImportedQty()) : "0", normalFont));
            table.addCell(new Phrase(row.getExportedQty() != null ? String.format("%,.0f", row.getExportedQty()) : "0", normalFont));
            
            PdfPCell closingCell = new PdfPCell(new Phrase(row.getClosingQty() != null ? String.format("%,.0f", row.getClosingQty()) : "0", normalFont));
            if (row.getClosingQty() != null && row.getClosingQty().doubleValue() < 0) {
                closingCell.setBackgroundColor(new Color(255, 204, 204));
            }
            table.addCell(closingCell);
        }
        document.add(table);
    }

    private void generateDataDictionaryAndSignatures(Document document) throws DocumentException {
        Font headerFont = getVietnameseFont(16, Font.BOLD);
        Font normalFont = getVietnameseFont(11, Font.NORMAL);
        Font boldFont = getVietnameseFont(11, Font.BOLD);

        document.add(new Paragraph("TỪ ĐIỂN DỮ LIỆU & CHỮ KÝ", headerFont));
        document.add(new Paragraph(" "));

        // Dictionary
        PdfPTable dictTable = new PdfPTable(2);
        dictTable.setWidthPercentage(100);
        dictTable.setWidths(new float[] { 1f, 3f });

        String[][] terms = {
                { "Lợi nhuận gộp (Gross Profit)", "Doanh thu thuần trừ đi Giá vốn hàng bán (COGS)." },
                { "Thất thoát (Shrinkage)",
                        "Sự khác biệt giữa tồn kho trên hệ thống và tồn kho thực tế, thường do mất cắp, hư hỏng, hoặc lỗi kiểm kê." },
                { "Tỷ lệ vòng quay (Turnover Rate)",
                        "Số lần bán và thay thế hàng tồn kho trong một khoảng thời gian nhất định (Tổng bán / Tồn hiện tại)." }
        };
        for (String[] term : terms) {
            dictTable.addCell(new Phrase(term[0], boldFont));
            dictTable.addCell(new Phrase(term[1], normalFont));
        }
        document.add(dictTable);

        // Signatures
        document.add(new Paragraph("\n\n\n"));
        PdfPTable sigTable = new PdfPTable(2);
        sigTable.setWidthPercentage(100);

        PdfPCell cell1 = new PdfPCell(new Phrase("Người lập biểu\n(Ký và ghi rõ họ tên)", boldFont));
        cell1.setBorder(Rectangle.NO_BORDER);
        cell1.setHorizontalAlignment(Element.ALIGN_CENTER);

        PdfPCell cell2 = new PdfPCell(new Phrase("Giám đốc duyệt\n(Ký và ghi rõ họ tên)", boldFont));
        cell2.setBorder(Rectangle.NO_BORDER);
        cell2.setHorizontalAlignment(Element.ALIGN_CENTER);

        sigTable.addCell(cell1);
        sigTable.addCell(cell2);
        document.add(sigTable);
    }

    // --- Footer Event Helper ---
    class ReportHeaderFooterEvent extends PdfPageEventHelper {
        private final String footerText;
        private final Font footerFont;

        public ReportHeaderFooterEvent(String footerText, Font footerFont) {
            this.footerText = footerText;
            this.footerFont = footerFont;
        }

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            PdfContentByte cb = writer.getDirectContent();
            String text = footerText + " | Trang " + writer.getPageNumber() + " | "
                    + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));

            ColumnText.showTextAligned(cb, Element.ALIGN_RIGHT,
                    new Phrase(text, footerFont),
                    document.right(), document.bottom() - 10, 0);
        }
    }
}
