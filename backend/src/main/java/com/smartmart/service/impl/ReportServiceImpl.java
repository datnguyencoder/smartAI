package com.smartmart.service.impl;

import com.smartmart.dto.response.*;
import com.smartmart.entity.CustomerDebt;
import com.smartmart.entity.FinanceTransaction;
import com.smartmart.entity.SupplierDebt;
import com.smartmart.enums.CustomerDebtStatus;
import com.smartmart.enums.FinanceTransactionType;
import com.smartmart.enums.SupplierDebtStatus;
import com.smartmart.repository.CustomerDebtRepository;
import com.smartmart.repository.FinanceTransactionRepository;
import com.smartmart.repository.OrderRepository;
import com.smartmart.repository.PurchaseOrderRepository;
import com.smartmart.repository.CurrentInventoryRepository;
import com.smartmart.repository.SupplierDebtRepository;
import com.smartmart.repository.ReturnOrderRepository;
import com.smartmart.repository.PurchaseReturnOrderRepository;
import com.smartmart.entity.ReturnOrder;
import com.smartmart.entity.PurchaseReturnOrder;
import com.smartmart.entity.PurchaseOrder;
import com.smartmart.entity.PurchaseOrderItem;
import com.smartmart.enums.PurchaseStatus;
import com.smartmart.mapper.WmsResponseMapper;
import java.util.HashMap;
import java.util.stream.Collectors;
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
    private final CustomerDebtRepository customerDebtRepository;
    private final SupplierDebtRepository supplierDebtRepository;
    private final FinanceTransactionRepository financeTransactionRepository;
    private final ExcelReportService excelReportService;
    private final PdfReportService pdfReportService;
    private final SettingService settingService;
    private final ForecastOrchestrationService forecastService;
    private final ReorderRecommendationService reorderService;
    private final ReturnOrderRepository returnOrderRepository;
    private final PurchaseReturnOrderRepository purchaseReturnOrderRepository;

    public ReportServiceImpl(
            OrderRepository orderRepository,
            PurchaseOrderRepository purchaseOrderRepository,
            CurrentInventoryRepository currentInventoryRepository,
            CustomerDebtRepository customerDebtRepository,
            SupplierDebtRepository supplierDebtRepository,
            FinanceTransactionRepository financeTransactionRepository,
            ExcelReportService excelReportService,
            PdfReportService pdfReportService,
            SettingService settingService,
            ForecastOrchestrationService forecastService,
            ReorderRecommendationService reorderService,
            ReturnOrderRepository returnOrderRepository,
            PurchaseReturnOrderRepository purchaseReturnOrderRepository) {
        this.orderRepository = orderRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.currentInventoryRepository = currentInventoryRepository;
        this.customerDebtRepository = customerDebtRepository;
        this.supplierDebtRepository = supplierDebtRepository;
        this.financeTransactionRepository = financeTransactionRepository;
        this.excelReportService = excelReportService;
        this.pdfReportService = pdfReportService;
        this.settingService = settingService;
        this.forecastService = forecastService;
        this.reorderService = reorderService;
        this.returnOrderRepository = returnOrderRepository;
        this.purchaseReturnOrderRepository = purchaseReturnOrderRepository;
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
            case "WEEK":
                rawSales = orderRepository.reportSalesByWeek(fromTime, toTime);
                break;
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
        List<PurchaseReturnOrder> returns = purchaseReturnOrderRepository.findByReturnDateBetween(fromTime, toTime);
        Map<Long, BigDecimal> refundMap = new HashMap<>();
        for (PurchaseReturnOrder r : returns) {
            if (r.getSupplier() != null) {
                refundMap.merge(r.getSupplier().getId(), r.getTotalAmount(), BigDecimal::add);
            }
        }

        List<PurchaseOrder> allOrders = purchaseOrderRepository.findAllByPurchaseDateBetween(fromTime, toTime);
        Map<Long, List<PurchaseOrder>> supplierOrdersMap = new HashMap<>();
        for (PurchaseOrder po : allOrders) {
            if (po.getSupplier() != null) {
                supplierOrdersMap.computeIfAbsent(po.getSupplier().getId(), k -> new ArrayList<>()).add(po);
            }
        }

        List<PurchaseReportResponse> report = new ArrayList<>();

        for (Object[] row : rawPurchases) {
            Long supplierId = toLong(row[0]);
            BigDecimal refundedAmount = refundMap.getOrDefault(supplierId, BigDecimal.ZERO);

            List<PurchaseOrder> sOrders = supplierOrdersMap.getOrDefault(supplierId, new ArrayList<>());
            long totalCount = sOrders.size();
            long faultyCount = 0;
            for (PurchaseOrder po : sOrders) {
                if (po.getStatus() == PurchaseStatus.CANCELLED) {
                    faultyCount++;
                } else if (po.getStatus() != PurchaseStatus.PENDING) {
                    boolean hasDiscrepancy = false;
                    for (PurchaseOrderItem item : po.getItems()) {
                        if (item.getOrderedQty().compareTo(item.getReceivedQty()) != 0) {
                            hasDiscrepancy = true;
                            break;
                        }
                    }
                    if (hasDiscrepancy) {
                        faultyCount++;
                    }
                }
            }

            BigDecimal discrepancyRate = BigDecimal.ZERO;
            if (totalCount > 0) {
                discrepancyRate = BigDecimal.valueOf(faultyCount)
                        .multiply(BigDecimal.valueOf(100))
                        .divide(BigDecimal.valueOf(totalCount), 2, RoundingMode.HALF_UP);
            }

            report.add(PurchaseReportResponse.builder()
                    .supplierId(supplierId)
                    .supplierName((String) row[1])
                    .totalOrders(toLong(row[2]))
                    .totalAmount(toBigDecimal(row[3]))
                    .totalItemTypes(toLong(row[4]))
                    .totalQuantity(toBigDecimal(row[5]))
                    .totalRefundedAmount(refundedAmount)
                    .discrepancyRate(discrepancyRate)
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

    @Override
    public List<BestSellerReportResponse> getBestSellers(LocalDate from, LocalDate to, int limit) {
        if (from == null) from = LocalDate.now().minusDays(30);
        if (to == null) to = LocalDate.now();
        if (limit <= 0) limit = 10;
        LocalDateTime fromTime = from.atStartOfDay();
        LocalDateTime toTime = to.plusDays(1).atStartOfDay();
        List<BestSellerReportResponse> result = new ArrayList<>();
        for (Object[] row : orderRepository.reportBestSellers(fromTime, toTime, limit)) {
            result.add(BestSellerReportResponse.builder()
                    .itemId(toLong(row[0]))
                    .itemCode((String) row[1])
                    .itemName((String) row[2])
                    .quantitySold(toBigDecimal(row[3]))
                    .revenue(toBigDecimal(row[4]))
                    .build());
        }
        return result;
    }

    @Override
    public List<BestSellerCategoryResponse> getBestSellerCategories(LocalDate from, LocalDate to, int limit) {
        if (from == null) from = LocalDate.now().minusDays(30);
        if (to == null) to = LocalDate.now();
        if (limit <= 0) limit = 10;
        LocalDateTime fromTime = from.atStartOfDay();
        LocalDateTime toTime = to.plusDays(1).atStartOfDay();
        List<BestSellerCategoryResponse> result = new ArrayList<>();
        for (Object[] row : orderRepository.reportBestSellerCategories(fromTime, toTime, limit)) {
            result.add(BestSellerCategoryResponse.builder()
                    .categoryId(toLong(row[0]))
                    .categoryName((String) row[1])
                    .quantitySold(toBigDecimal(row[2]))
                    .revenue(toBigDecimal(row[3]))
                    .build());
        }
        return result;
    }

    @Override
    public List<CustomerDueReportResponse> getCustomerDue() {
        return customerDebtRepository.findAllByOrderByIdDesc().stream()
                .filter(d -> d.getStatus() != CustomerDebtStatus.PAID)
                .map(this::toCustomerDue)
                .toList();
    }

    @Override
    public List<SupplierDueReportResponse> getSupplierDue() {
        return supplierDebtRepository.findAllByOrderByIdDesc().stream()
                .filter(d -> d.getStatus() != SupplierDebtStatus.PAID)
                .map(this::toSupplierDue)
                .toList();
    }

    @Override
    public List<ProductExpiryReportResponse> getProductExpiry() {
        List<ProductExpiryReportResponse> result = new ArrayList<>();
        for (Object[] row : currentInventoryRepository.reportProductExpiry()) {
            LocalDate expiry = toLocalDate(row[5]);
            Integer daysUntil = expiry != null ? (int) ChronoUnit.DAYS.between(LocalDate.now(), expiry) : null;
            result.add(ProductExpiryReportResponse.builder()
                    .itemId(toLong(row[0]))
                    .itemCode((String) row[1])
                    .itemName((String) row[2])
                    .lotId(toLong(row[3]))
                    .lotNumber((String) row[4])
                    .expiryDate(expiry)
                    .daysUntilExpiry(daysUntil)
                    .quantity(toBigDecimal(row[6]))
                    .locationName((String) row[7])
                    .build());
        }
        return result;
    }

    @Override
    public List<CashFlowReportResponse> getCashFlow(LocalDate from, LocalDate to) {
        if (from == null) from = LocalDate.now().minusDays(30);
        if (to == null) to = LocalDate.now();
        List<FinanceTransaction> txs = financeTransactionRepository.findFiltered(null, from, to);
        BigDecimal running = BigDecimal.ZERO;
        List<CashFlowReportResponse> result = new ArrayList<>();
        for (FinanceTransaction tx : txs) {
            BigDecimal signed = tx.getType() == FinanceTransactionType.INCOME
                    ? tx.getAmount() : tx.getAmount().negate();
            running = running.add(signed);
            result.add(CashFlowReportResponse.builder()
                    .date(tx.getTransactionDate())
                    .type(tx.getType())
                    .category(tx.getCategory())
                    .amount(tx.getAmount())
                    .runningBalance(running)
                    .build());
        }
        return result;
    }

    @Override
    public List<ProfitLossReportResponse> getProfitLoss(LocalDate from, LocalDate to) {
        if (from == null) from = LocalDate.now().minusDays(30);
        if (to == null) to = LocalDate.now();
        LocalDateTime fromTime = from.atStartOfDay();
        LocalDateTime toTime = to.plusDays(1).atStartOfDay();

        Map<LocalDate, BigDecimal> dailyRevenue = new java.util.HashMap<>();
        Map<LocalDate, BigDecimal> dailyCost = new java.util.HashMap<>();
        for (Object[] row : orderRepository.reportSalesByDay(fromTime, toTime)) {
            LocalDate date = LocalDate.parse((String) row[0]);
            dailyRevenue.put(date, toBigDecimal(row[3]));
            dailyCost.put(date, toBigDecimal(row[4]));
        }

        Map<LocalDate, BigDecimal> dailyExpense = new java.util.HashMap<>();
        for (FinanceTransaction tx : financeTransactionRepository.findFiltered(FinanceTransactionType.EXPENSE, from, to)) {
            dailyExpense.merge(tx.getTransactionDate(), tx.getAmount(), BigDecimal::add);
        }

        List<ProfitLossReportResponse> result = new ArrayList<>();
        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            BigDecimal revenue = dailyRevenue.getOrDefault(d, BigDecimal.ZERO);
            BigDecimal cost = dailyCost.getOrDefault(d, BigDecimal.ZERO);
            BigDecimal expenses = dailyExpense.getOrDefault(d, BigDecimal.ZERO);
            BigDecimal gross = revenue.subtract(cost);
            result.add(ProfitLossReportResponse.builder()
                    .date(d)
                    .revenue(revenue)
                    .costOfGoods(cost)
                    .grossProfit(gross)
                    .expenses(expenses)
                    .netProfit(gross.subtract(expenses))
                    .build());
        }
        return result;
    }

    private CustomerDueReportResponse toCustomerDue(CustomerDebt debt) {
        BigDecimal remaining = debt.getAmount().subtract(debt.getPaidAmount());
        return CustomerDueReportResponse.builder()
                .debtId(debt.getId())
                .customerId(debt.getCustomer().getId())
                .customerName(debt.getCustomer().getFullName())
                .orderId(debt.getOrder().getId())
                .amount(debt.getAmount())
                .paidAmount(debt.getPaidAmount())
                .remainingAmount(remaining)
                .dueDate(debt.getDueDate())
                .status(debt.getStatus())
                .build();
    }

    private SupplierDueReportResponse toSupplierDue(SupplierDebt debt) {
        BigDecimal remaining = debt.getAmount().subtract(debt.getPaidAmount());
        return SupplierDueReportResponse.builder()
                .debtId(debt.getId())
                .supplierId(debt.getSupplier().getId())
                .supplierName(debt.getSupplier().getSupplierName())
                .purchaseOrderId(debt.getPurchaseOrder() != null ? debt.getPurchaseOrder().getId() : null)
                .amount(debt.getAmount())
                .paidAmount(debt.getPaidAmount())
                .remainingAmount(remaining)
                .dueDate(debt.getDueDate())
                .status(debt.getStatus())
                .build();
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
            String companyName = settingService.getValue("store_name", "SMARTMART AI");
            String companyAddress = settingService.getValue("store_address", "TP. Hồ Chí Minh");
            String companyPhone = settingService.getValue("store_phone", "");
            switch (type.toLowerCase()) {
                case "sales":
                    List<ForecastResultResponse> forecasts = loadForecastsSafe();
                    return excelReportService.generateSalesReport(
                            getSalesReport(from, to, groupBy), from, to, companyName, companyAddress, companyPhone, forecasts);
                case "purchase":
                    return excelReportService.generatePurchaseReport(
                            getPurchaseReport(from, to), from, to, companyName, companyAddress, companyPhone);
                case "inventory":
                    List<Map<String, Object>> reorderRecs = loadReorderRecsSafe();
                    return excelReportService.generateInventoryReport(
                            getInventoryReport(from, to), from, to, companyName, companyAddress, companyPhone, reorderRecs);
                case "best-sellers":
                    return excelReportService.generateBestSellersReport(
                            getBestSellers(from, to, 20), from, to, companyName, companyAddress, companyPhone);
                case "best-seller-categories":
                    return excelReportService.generateBestSellerCategoriesReport(
                            getBestSellerCategories(from, to, 20), from, to, companyName, companyAddress, companyPhone);
                case "customer-due":
                    return excelReportService.generateCustomerDueReport(
                            getCustomerDue(), companyName, companyAddress, companyPhone);
                case "supplier-due":
                    return excelReportService.generateSupplierDueReport(
                            getSupplierDue(), companyName, companyAddress, companyPhone);
                case "product-expiry":
                    return excelReportService.generateProductExpiryReport(
                            getProductExpiry(), companyName, companyAddress, companyPhone);
                case "cash-flow":
                    return excelReportService.generateCashFlowReport(
                            getCashFlow(from, to), from, to, companyName, companyAddress, companyPhone);
                case "profit-loss":
                    return excelReportService.generateProfitLossReport(
                            getProfitLoss(from, to), from, to, companyName, companyAddress, companyPhone);
                case "refund":
                    return excelReportService.generateRefundReport(
                            getRefundReport(from, to), from, to, companyName, companyAddress, companyPhone);
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
            String companyName = settingService.getValue("store_name", "SMARTMART AI");
            String companyAddress = settingService.getValue("store_address", "TP. Hồ Chí Minh");
            String companyPhone = settingService.getValue("store_phone", "");
            return excelReportService.generateNxtReport(data, from, to, companyName, companyAddress, companyPhone);
        } catch (Exception e) {
            throw new RuntimeException("Error generating NXT Excel report", e);
        }
    }

    @Override
    public byte[] exportPdf(String type, LocalDate from, LocalDate to, String groupBy) {
        try {
            String storeName = settingService.getValue("store_name", "SMARTMART AI");
            String storeAddress = settingService.getValue("store_address", "TP. Hồ Chí Minh");
            String storePhone = settingService.getValue("store_phone", "");
            switch (type.toLowerCase()) {
                case "sales":
                    return pdfReportService.generateSalesReport(getSalesReport(from, to, groupBy), from, to, storeName, storeAddress, storePhone);
                case "purchase":
                    return pdfReportService.generatePurchaseReport(getPurchaseReport(from, to), from, to, storeName, storeAddress, storePhone);
                case "inventory":
                    return pdfReportService.generateInventoryReport(getInventoryReport(from, to), from, to, storeName, storeAddress, storePhone);
                case "refund":
                    return pdfReportService.generateRefundReport(getRefundReport(from, to), from, to, storeName, storeAddress, storePhone);
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

            String storeName = settingService.getValue("store_name", "SMARTMART AI");
            String storeAddress = settingService.getValue("store_address", "TP. Hồ Chí Minh");
            String storePhone = settingService.getValue("store_phone", "");

            return pdfReportService.generateComprehensiveReport(sales, purchases, inventory, nxt, from, to, storeName, storeAddress, storePhone);
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

            String companyName = settingService.getValue("store_name", "SMARTMART AI");
            String companyAddress = settingService.getValue("store_address", "TP. Hồ Chí Minh");
            String companyPhone = settingService.getValue("store_phone", "");

            List<ForecastResultResponse> forecasts = loadForecastsSafe();
            List<Map<String, Object>> reorderRecs = loadReorderRecsSafe();

            return excelReportService.generateComprehensiveExcel(
                    sales, purchases, inventory, nxt, from, to, companyName, companyAddress, companyPhone, forecasts, reorderRecs);
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

    @Override
    public RefundReportResponse getRefundReport(LocalDate from, LocalDate to) {
        if (from == null) {
            from = LocalDate.now().minusDays(30);
        }
        if (to == null) {
            to = LocalDate.now();
        }

        LocalDateTime fromTime = from.atStartOfDay();
        LocalDateTime toTime = to.plusDays(1).atStartOfDay();

        List<ReturnOrder> returns = returnOrderRepository.findByReturnDateBetweenWithDetails(fromTime, toTime);

        BigDecimal totalRefundAmount = BigDecimal.ZERO;
        BigDecimal damagedRefundAmount = BigDecimal.ZERO;
        BigDecimal expiredRefundAmount = BigDecimal.ZERO;
        BigDecimal otherRefundAmount = BigDecimal.ZERO;

        long totalRefundOrders = 0;
        long damagedRefundOrders = 0;
        long expiredRefundOrders = 0;
        long otherRefundOrders = 0;

        List<ReturnOrderResponse> returnOrderResponses = new ArrayList<>();

        for (ReturnOrder ro : returns) {
            totalRefundOrders++;
            BigDecimal refund = ro.getRefundAmount();
            totalRefundAmount = totalRefundAmount.add(refund);

            // Classification by reason keywords (case-insensitive)
            String reason = ro.getReason() != null ? ro.getReason().toLowerCase() : "";
            boolean isDamaged = false;
            boolean isExpired = false;

            // Damaged keywords
            if (reason.contains("hư hại") || reason.contains("hỏng") || reason.contains("lỗi") ||
                reason.contains("móp") || reason.contains("nứt") || reason.contains("vỡ") ||
                reason.contains("rách") || reason.contains("bể") || reason.contains("defect") ||
                reason.contains("damage")) {
                isDamaged = true;
            }
            // Expired keywords
            else if (reason.contains("hết hạn") || reason.contains("hết date") ||
                     reason.contains("quá hạn") || reason.contains("quá date") ||
                     reason.contains("expired") || reason.contains("outdate")) {
                isExpired = true;
            }

            if (isDamaged) {
                damagedRefundOrders++;
                damagedRefundAmount = damagedRefundAmount.add(refund);
            } else if (isExpired) {
                expiredRefundOrders++;
                expiredRefundAmount = expiredRefundAmount.add(refund);
            } else {
                otherRefundOrders++;
                otherRefundAmount = otherRefundAmount.add(refund);
            }

            returnOrderResponses.add(WmsResponseMapper.toReturnOrderResponse(ro));
        }

        return RefundReportResponse.builder()
                .totalRefundAmount(totalRefundAmount)
                .damagedRefundAmount(damagedRefundAmount)
                .expiredRefundAmount(expiredRefundAmount)
                .otherRefundAmount(otherRefundAmount)
                .totalRefundOrders(totalRefundOrders)
                .damagedRefundOrders(damagedRefundOrders)
                .expiredRefundOrders(expiredRefundOrders)
                .otherRefundOrders(otherRefundOrders)
                .refundOrders(returnOrderResponses)
                .build();
    }
}
