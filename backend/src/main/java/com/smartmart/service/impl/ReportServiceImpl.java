package com.smartmart.service.impl;

import com.smartmart.dto.response.SalesReportResponse;
import com.smartmart.dto.response.TopProductResponse;
import com.smartmart.dto.response.PurchaseReportResponse;
import com.smartmart.dto.response.InventoryReportResponse;
import com.smartmart.dto.response.InventoryNxtReportResponse;
import com.smartmart.dto.response.ForecastResultResponse;
import com.smartmart.repository.OrderRepository;
import com.smartmart.repository.PurchaseOrderRepository;
import com.smartmart.repository.CurrentInventoryRepository;
import com.smartmart.service.ExcelReportService;
import com.smartmart.service.PdfReportService;
import com.smartmart.service.ReportService;
import com.smartmart.service.SettingService;
import com.smartmart.service.ai.ForecastOrchestrationService;
import com.smartmart.service.ai.ReorderRecommendationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class ReportServiceImpl implements ReportService {

    private static final Logger log = LoggerFactory.getLogger(ReportServiceImpl.class);

    private final OrderRepository orderRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final CurrentInventoryRepository currentInventoryRepository;
    private final ExcelReportService excelReportService;
    private final PdfReportService pdfReportService;
    private final SettingService settingService;
    private final ForecastOrchestrationService forecastService;
    private final ReorderRecommendationService reorderService;

    public ReportServiceImpl(
            OrderRepository orderRepository,
            PurchaseOrderRepository purchaseOrderRepository,
            CurrentInventoryRepository currentInventoryRepository,
            ExcelReportService excelReportService,
            PdfReportService pdfReportService,
            SettingService settingService,
            ForecastOrchestrationService forecastService,
            ReorderRecommendationService reorderService) {
        this.orderRepository = orderRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.currentInventoryRepository = currentInventoryRepository;
        this.excelReportService = excelReportService;
        this.pdfReportService = pdfReportService;
        this.settingService = settingService;
        this.forecastService = forecastService;
        this.reorderService = reorderService;
    }

    @Override
    public List<SalesReportResponse> getSalesReport(LocalDate from, LocalDate to, String groupBy) {
        // Defaults
        if (from == null) {
            from = LocalDate.now().minusDays(30);
        }
        if (to == null) {
            to = LocalDate.now();
        }
        if (groupBy == null || groupBy.trim().isEmpty()) {
            groupBy = "DAY";
        }

        LocalDateTime fromTime = from.atStartOfDay();
        LocalDateTime toTime = to.plusDays(1).atStartOfDay();

        // 1. Get overall top 5 products for this period
        List<Object[]> topProductsRaw = orderRepository.reportTopProducts(fromTime, toTime);
        List<TopProductResponse> topProducts = new ArrayList<>();
        for (Object[] row : topProductsRaw) {
            topProducts.add(TopProductResponse.builder()
                    .itemId(toLong(row[0]))
                    .itemCode((String) row[1])
                    .itemName((String) row[2])
                    .quantitySold(toBigDecimal(row[3]))
                    .revenue(toBigDecimal(row[4]))
                    .build());
        }

        // 2. Get periodic details
        List<Object[]> rawSales;
        switch (groupBy.toUpperCase()) {
            case "MONTH":
                rawSales = orderRepository.reportSalesByMonth(fromTime, toTime);
                break;
            case "YEAR":
                rawSales = orderRepository.reportSalesByYear(fromTime, toTime);
                break;
            case "DAY":
            default:
                rawSales = orderRepository.reportSalesByDay(fromTime, toTime);
                break;
        }

        List<SalesReportResponse> report = new ArrayList<>();
        for (Object[] row : rawSales) {
            BigDecimal revenue = toBigDecimal(row[3]);
            BigDecimal cost = toBigDecimal(row[4]);
            BigDecimal profit = revenue.subtract(cost);

            report.add(SalesReportResponse.builder()
                    .period((String) row[0])
                    .totalOrders(toLong(row[1]))
                    .cancelledOrders(toLong(row[2]))
                    .totalRevenue(revenue)
                    .totalCost(cost)
                    .grossProfit(profit)
                    .totalItemsSold(toLong(row[5]))
                    .topProducts(topProducts)
                    .build());
        }

        return report;
    }

    @Override
    public List<PurchaseReportResponse> getPurchaseReport(LocalDate from, LocalDate to) {
        if (from == null) {
            from = LocalDate.now().minusDays(30);
        }
        if (to == null) {
            to = LocalDate.now();
        }

        LocalDateTime fromTime = from.atStartOfDay();
        LocalDateTime toTime = to.plusDays(1).atStartOfDay();

        List<Object[]> rawPurchases = purchaseOrderRepository.reportPurchaseBySupplier(fromTime, toTime);
        List<PurchaseReportResponse> report = new ArrayList<>();

        for (Object[] row : rawPurchases) {
            report.add(PurchaseReportResponse.builder()
                    .supplierId(toLong(row[0]))
                    .supplierName((String) row[1])
                    .totalOrders(toLong(row[2]))
                    .totalAmount(toBigDecimal(row[3]))
                    .totalItemTypes(toLong(row[4]))
                    .totalQuantity(toBigDecimal(row[5]))
                    .build());
        }

        return report;
    }

    @Override
    public List<InventoryReportResponse> getInventoryReport(LocalDate from, LocalDate to) {
        if (from == null) {
            from = LocalDate.now().minusDays(30);
        }
        if (to == null) {
            to = LocalDate.now();
        }

        LocalDateTime fromTime = from.atStartOfDay();
        LocalDateTime toTime = to.plusDays(1).atStartOfDay();

        List<Object[]> rawInventory = currentInventoryRepository.reportInventoryDetails(fromTime, toTime);
        List<InventoryReportResponse> report = new ArrayList<>();

        for (Object[] row : rawInventory) {
            BigDecimal currentStock = toBigDecimal(row[4]);
            BigDecimal totalPurchased = toBigDecimal(row[5]);
            BigDecimal totalSold = toBigDecimal(row[6]);
            BigDecimal totalScrapped = toBigDecimal(row[7]);
            BigDecimal shrinkage = toBigDecimal(row[8]);

            // turnoverRate = totalSold / currentStock (protect /0)
            BigDecimal turnoverRate = BigDecimal.ZERO;
            if (currentStock.compareTo(BigDecimal.ZERO) > 0) {
                turnoverRate = totalSold.divide(currentStock, 4, RoundingMode.HALF_UP);
            }

            LocalDate nearestExpiry = toLocalDate(row[9]);
            Integer daysUntilExpiry = null;
            if (nearestExpiry != null) {
                daysUntilExpiry = (int) ChronoUnit.DAYS.between(LocalDate.now(), nearestExpiry);
            }

            report.add(InventoryReportResponse.builder()
                    .itemId(toLong(row[0]))
                    .itemCode((String) row[1])
                    .itemName((String) row[2])
                    .categoryName((String) row[3])
                    .currentStock(currentStock)
                    .totalPurchased(totalPurchased)
                    .totalSold(totalSold)
                    .totalScrapped(totalScrapped)
                    .shrinkage(shrinkage)
                    .turnoverRate(turnoverRate)
                    .nearestExpiryDate(nearestExpiry)
                    .daysUntilExpiry(daysUntilExpiry)
                    .build());
        }

        return report;
    }

    @Override
    public List<InventoryNxtReportResponse> getNxtReport(LocalDate from, LocalDate to) {
        if (from == null) {
            from = LocalDate.now().minusDays(30);
        }
        if (to == null) {
            to = LocalDate.now();
        }

        LocalDateTime fromTime = from.atStartOfDay();
        LocalDateTime toTime = to.plusDays(1).atStartOfDay();

        List<Object[]> rawNxt = currentInventoryRepository.reportNxtDetails(fromTime, toTime);
        List<InventoryNxtReportResponse> report = new ArrayList<>();

        for (Object[] row : rawNxt) {
            String itemCode = (String) row[1];
            String itemName = (String) row[2];
            String unitName = (String) row[3];
            BigDecimal costPrice = toBigDecimal(row[4]);
            
            BigDecimal openingQty = toBigDecimal(row[5]);
            BigDecimal importedQty = toBigDecimal(row[6]);
            BigDecimal exportedQty = toBigDecimal(row[7]);
            BigDecimal currentStock = toBigDecimal(row[8]); // Used for verification

            // Calculate closing quantity
            BigDecimal closingQty = openingQty.add(importedQty).subtract(exportedQty);

            // Verification logging
            if (to.isEqual(LocalDate.now()) && closingQty.compareTo(currentStock) != 0) {
                log.warn("NXT Verification Failed for item {}: calculated closingQty={}, actual currentStock={}", itemCode, closingQty, currentStock);
            }

            // Calculate values (Thành tiền)
            BigDecimal openingValue = openingQty.multiply(costPrice);
            BigDecimal importedValue = importedQty.multiply(costPrice);
            BigDecimal exportedValue = exportedQty.multiply(costPrice);
            BigDecimal closingValue = closingQty.multiply(costPrice);

            report.add(InventoryNxtReportResponse.builder()
                    .itemCode(itemCode)
                    .itemName(itemName)
                    .unitName(unitName)
                    .openingQty(openingQty)
                    .openingValue(openingValue)
                    .importedQty(importedQty)
                    .importedValue(importedValue)
                    .exportedQty(exportedQty)
                    .exportedValue(exportedValue)
                    .closingQty(closingQty)
                    .closingValue(closingValue)
                    .referencePrice(costPrice)
                    .build());
        }

        return report;
    }

    // Defensive helper methods to convert Object values from native queries
    private LocalDate toLocalDate(Object obj) {
        if (obj == null)
            return null;
        if (obj instanceof java.sql.Date) {
            return ((java.sql.Date) obj).toLocalDate();
        }
        if (obj instanceof java.sql.Timestamp) {
            return ((java.sql.Timestamp) obj).toLocalDateTime().toLocalDate();
        }
        if (obj instanceof LocalDate) {
            return (LocalDate) obj;
        }
        return LocalDate.parse(obj.toString());
    }

    private BigDecimal toBigDecimal(Object obj) {
        if (obj == null)
            return BigDecimal.ZERO;
        if (obj instanceof BigDecimal) {
            return (BigDecimal) obj;
        }
        return new BigDecimal(obj.toString());
    }

    private long toLong(Object obj) {
        if (obj == null)
            return 0L;
        if (obj instanceof Number) {
            return ((Number) obj).longValue();
        }
        return Long.parseLong(obj.toString());
    }

    @Override
    public byte[] exportExcel(String type, LocalDate from, LocalDate to, String groupBy) {
        try {
            String companyName = settingService.getValue("company_name", "---");
            String companyAddress = settingService.getValue("company_address", "---");
            switch (type.toLowerCase()) {
                case "sales":
                    List<ForecastResultResponse> forecasts = loadForecastsSafe();
                    return excelReportService.generateSalesReport(
                            getSalesReport(from, to, groupBy), from, to, companyName, companyAddress, forecasts);
                case "purchase":
                    return excelReportService.generatePurchaseReport(
                            getPurchaseReport(from, to), from, to, companyName, companyAddress);
                case "inventory":
                    List<Map<String, Object>> reorderRecs = loadReorderRecsSafe();
                    return excelReportService.generateInventoryReport(
                            getInventoryReport(from, to), from, to, companyName, companyAddress, reorderRecs);
                default:
                    throw new IllegalArgumentException("Unknown report type: " + type);
            }
        } catch (Exception e) {
            throw new RuntimeException("Error generating Excel report", e);
        }
    }

    @Override
    public byte[] exportNxtExcel(LocalDate from, LocalDate to) {
        try {
            List<InventoryNxtReportResponse> data = getNxtReport(from, to);
            String companyName = settingService.getValue("company_name", "---");
            String companyAddress = settingService.getValue("company_address", "---");
            return excelReportService.generateNxtReport(data, from, to, companyName, companyAddress);
        } catch (Exception e) {
            throw new RuntimeException("Error generating NXT Excel report", e);
        }
    }

    @Override
    public byte[] exportPdf(String type, LocalDate from, LocalDate to, String groupBy) {
        try {
            switch (type.toLowerCase()) {
                case "sales":
                    return pdfReportService.generateSalesReport(getSalesReport(from, to, groupBy), from, to);
                case "purchase":
                    return pdfReportService.generatePurchaseReport(getPurchaseReport(from, to), from, to);
                case "inventory":
                    return pdfReportService.generateInventoryReport(getInventoryReport(from, to), from, to);
                default:
                    throw new IllegalArgumentException("Unknown report type: " + type);
            }
        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF report", e);
        }
    }

    @Override
    public byte[] exportComprehensivePdf(LocalDate from, LocalDate to, String groupBy) {
        try {
            List<SalesReportResponse> sales = getSalesReport(from, to, groupBy);
            List<PurchaseReportResponse> purchases = getPurchaseReport(from, to);
            List<InventoryReportResponse> inventory = getInventoryReport(from, to);
            List<InventoryNxtReportResponse> nxt = getNxtReport(from, to);

            return pdfReportService.generateComprehensiveReport(sales, purchases, inventory, nxt, from, to);
        } catch (Exception e) {
            throw new RuntimeException("Error generating Comprehensive PDF report", e);
        }
    }

    @Override
    public byte[] exportComprehensiveExcel(LocalDate from, LocalDate to, String groupBy) {
        try {
            List<SalesReportResponse> sales = getSalesReport(from, to, groupBy);
            List<PurchaseReportResponse> purchases = getPurchaseReport(from, to);
            List<InventoryReportResponse> inventory = getInventoryReport(from, to);
            List<InventoryNxtReportResponse> nxt = getNxtReport(from, to);

            String companyName = settingService.getValue("company_name", "---");
            String companyAddress = settingService.getValue("company_address", "---");

            List<ForecastResultResponse> forecasts = loadForecastsSafe();
            List<Map<String, Object>> reorderRecs = loadReorderRecsSafe();

            return excelReportService.generateComprehensiveExcel(
                    sales, purchases, inventory, nxt, from, to, companyName, companyAddress, forecasts, reorderRecs);
        } catch (Exception e) {
            throw new RuntimeException("Error generating Comprehensive Excel report", e);
        }
    }

    // --- AI data loading with graceful fallback ---

    private List<ForecastResultResponse> loadForecastsSafe() {
        try {
            return forecastService.listResults();
        } catch (Exception e) {
            log.warn("Could not load AI forecast data for report: {}", e.getMessage());
            return List.of();
        }
    }

    private List<Map<String, Object>> loadReorderRecsSafe() {
        try {
            return reorderService.listActive();
        } catch (Exception e) {
            log.warn("Could not load reorder recommendations for report: {}", e.getMessage());
            return List.of();
        }
    }
}
