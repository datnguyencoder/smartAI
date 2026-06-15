package com.smartmart.service.impl;

import com.smartmart.service.ai.ForecastOrchestrationService;
import com.smartmart.enums.OrderStatus;
import com.smartmart.repository.CurrentInventoryRepository;
import com.smartmart.repository.OrderRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class DashboardServiceImpl implements com.smartmart.service.DashboardService {

    private final OrderRepository orderRepository;
    private final CurrentInventoryRepository currentInventoryRepository;
    private final ForecastOrchestrationService forecastOrchestrationService;

    public DashboardServiceImpl(
            OrderRepository orderRepository,
            CurrentInventoryRepository currentInventoryRepository,
            ForecastOrchestrationService forecastOrchestrationService
    ) {
        this.orderRepository = orderRepository;
        this.currentInventoryRepository = currentInventoryRepository;
        this.forecastOrchestrationService = forecastOrchestrationService;
    }

    @Override
    @Cacheable("dashboardSummary")
    public Map<String, Object> summary() {
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        List<com.smartmart.entity.Order> todayOrders = orderRepository.findCompletedSince(
                OrderStatus.COMPLETED, todayStart);
        BigDecimal revenue = todayOrders.stream()
                .map(com.smartmart.entity.Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long lowStock = currentInventoryRepository.findLowStock().size();
        long nearExpiry = currentInventoryRepository.findNearExpiry(LocalDate.now().plusDays(30)).size();
        long totalInventoryRows = currentInventoryRepository.findAll().size();

        BigDecimal grossProfit = BigDecimal.ZERO;
        for (com.smartmart.entity.Order o : todayOrders) {
            for (com.smartmart.entity.OrderItem oi : o.getItems()) {
                BigDecimal cost = oi.getItem().getCostPrice() != null ? oi.getItem().getCostPrice() : BigDecimal.ZERO;
                grossProfit = grossProfit.add(oi.getSubtotal().subtract(cost.multiply(oi.getQuantity())));
            }
        }

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("todayRevenue", revenue);
        m.put("todayOrders", todayOrders.size());
        m.put("todayGrossProfit", grossProfit);
        m.put("lowStockCount", lowStock);
        m.put("nearExpiryCount", nearExpiry);
        m.put("expiryRiskRatio", totalInventoryRows > 0 ? (double) nearExpiry / totalInventoryRows : 0.0);
        return m;
    }

    @Override
    @Cacheable("dashboardRevenue")
    public List<Map<String, Object>> revenue7d() {
        LocalDateTime since = LocalDateTime.now().minusDays(7);
        List<com.smartmart.entity.Order> orders = orderRepository.findCompletedSince(OrderStatus.COMPLETED, since);
        Map<String, BigDecimal> byDay = new LinkedHashMap<>();
        for (int i = 6; i >= 0; i--) {
            byDay.put(LocalDate.now().minusDays(i).toString(), BigDecimal.ZERO);
        }
        for (com.smartmart.entity.Order o : orders) {
            String day = o.getOrderDate().toLocalDate().toString();
            byDay.merge(day, o.getTotalAmount(), BigDecimal::add);
        }
        return byDay.entrySet().stream()
                .map(e -> Map.<String, Object>of("day", e.getKey(), "revenue", e.getValue()))
                .toList();
    }

    @Override
    public Map<String, Object> forecastSummary() {
        List<Map<String, Object>> results = forecastOrchestrationService.listResults();
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("itemsWithForecast", results.size());
        m.put("highRiskCount", results.stream()
                .filter(r -> {
                    Object p7 = r.get("pred7d");
                    return p7 instanceof BigDecimal b && b.compareTo(BigDecimal.valueOf(50)) > 0;
                })
                .count());
        return m;
    }
}
