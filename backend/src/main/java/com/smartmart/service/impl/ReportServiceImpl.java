package com.smartmart.service.impl;

import com.smartmart.dto.response.SalesReportResponse;
import com.smartmart.dto.response.TopProductResponse;
import com.smartmart.dto.response.PurchaseReportResponse;
import com.smartmart.dto.response.InventoryReportResponse;
import com.smartmart.repository.OrderRepository;
import com.smartmart.repository.PurchaseOrderRepository;
import com.smartmart.repository.CurrentInventoryRepository;
import com.smartmart.service.ReportService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class ReportServiceImpl implements ReportService {

    private final OrderRepository orderRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final CurrentInventoryRepository currentInventoryRepository;
    private final ExcelReportGenerator excelReportGenerator;
    private final PdfReportGenerator pdfReportGenerator;

    public ReportServiceImpl(
            OrderRepository orderRepository,
            PurchaseOrderRepository purchaseOrderRepository,
            CurrentInventoryRepository currentInventoryRepository,
            ExcelReportGenerator excelReportGenerator,
            PdfReportGenerator pdfReportGenerator) {
        this.orderRepository = orderRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.currentInventoryRepository = currentInventoryRepository;
        this.excelReportGenerator = excelReportGenerator;
        this.pdfReportGenerator = pdfReportGenerator;
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
            switch (type.toLowerCase()) {
                case "sales":
                    return excelReportGenerator.generateSalesReport(getSalesReport(from, to, groupBy), from, to);
                case "purchase":
                    return excelReportGenerator.generatePurchaseReport(getPurchaseReport(from, to), from, to);
                case "inventory":
                    return excelReportGenerator.generateInventoryReport(getInventoryReport(from, to), from, to);
                default:
                    throw new IllegalArgumentException("Unknown report type: " + type);
            }
        } catch (Exception e) {
            throw new RuntimeException("Error generating Excel report", e);
        }
    }

    @Override
    public byte[] exportPdf(String type, LocalDate from, LocalDate to, String groupBy) {
        try {
            switch (type.toLowerCase()) {
                case "sales":
                    return pdfReportGenerator.generateSalesReport(getSalesReport(from, to, groupBy), from, to);
                case "purchase":
                    return pdfReportGenerator.generatePurchaseReport(getPurchaseReport(from, to), from, to);
                case "inventory":
                    return pdfReportGenerator.generateInventoryReport(getInventoryReport(from, to), from, to);
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

            return pdfReportGenerator.generateComprehensiveReport(sales, purchases, inventory, from, to);
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

            return excelReportGenerator.generateComprehensiveExcel(sales, purchases, inventory, from, to);
        } catch (Exception e) {
            throw new RuntimeException("Error generating Comprehensive Excel report", e);
        }
    }
}
