package com.smartmart.config;

import com.smartmart.entity.*;
import com.smartmart.enums.OrderStatus;
import com.smartmart.enums.PaymentMethod;
import com.smartmart.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

/**
 * Lịch sử bán POS 120 ngày cho catalog demo — giúp AI dự báo có dữ liệu trực quan, không phụ thuộc CSV retail.
 */
@Component
@Profile({"local", "prod", "test"})
@org.springframework.core.annotation.Order(5)
public class ForecastDemoSalesSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(ForecastDemoSalesSeeder.class);
    private static final String ORDER_PREFIX = "FORECAST-DEMO-";
    private static final int HISTORY_DAYS = 120;
    private static final long RANDOM_SEED = 20260617L;

    /** Mã SKU demo + trọng số bán (càng cao càng bán nhiều). */
    private static final Map<String, Integer> SALES_WEIGHT = Map.ofEntries(
            Map.entry("COCA-330", 12),
            Map.entry("LAVIE-500", 11),
            Map.entry("TRA-XANH-0", 9),
            Map.entry("MI-HAOHAO", 10),
            Map.entry("MI-OMACHI", 8),
            Map.entry("BANH-OISHI", 9),
            Map.entry("SNACK-LAYS", 8),
            Map.entry("SUA-VNM-1L", 7),
            Map.entry("SUA-CHUA-VNM", 8),
            Map.entry("REDBULL-250", 9),
            Map.entry("COFFEE-G7", 5),
            Map.entry("NUOC-MAM-NN", 4),
            Map.entry("DAU-SIMPLY-1L", 4),
            Map.entry("GAO-ST25-5KG", 3),
            Map.entry("BOT-GIAT-OMO", 2),
            Map.entry("KDR-PS-180", 5)
    );

    private final OrderRepository orderRepository;
    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final LocationRepository locationRepository;

    @Value("${app.seed.forecast-demo-sales.enabled:true}")
    private boolean enabled;

    public ForecastDemoSalesSeeder(
            OrderRepository orderRepository,
            ItemRepository itemRepository,
            UserRepository userRepository,
            LocationRepository locationRepository
    ) {
        this.orderRepository = orderRepository;
        this.itemRepository = itemRepository;
        this.userRepository = userRepository;
        this.locationRepository = locationRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!enabled) {
            log.debug("Forecast demo sales seed disabled");
            return;
        }
        if (orderRepository.existsByOrderCodeStartingWith(ORDER_PREFIX)) {
            return;
        }

        Long staffId = userRepository.findByUsername("staff")
                .or(() -> userRepository.findByUsername("admin"))
                .map(User::getId)
                .orElse(null);
        if (staffId == null) {
            log.warn("Skip forecast demo sales: no staff/admin user");
            return;
        }

        Location khoBan = locationRepository.findByLocationName("Kho bán").orElse(null);
        if (khoBan == null) {
            log.warn("Skip forecast demo sales: Kho bán location missing");
            return;
        }

        List<WeightedItem> catalog = loadDemoItems();
        if (catalog.isEmpty()) {
            log.warn("Skip forecast demo sales: no demo catalog items");
            return;
        }

        Random random = new Random(RANDOM_SEED);
        LocalDate end = LocalDate.now().minusDays(1);
        LocalDate start = end.minusDays(HISTORY_DAYS - 1L);
        int orderCount = 0;
        int lineCount = 0;

        for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
            boolean weekend = date.getDayOfWeek() == DayOfWeek.SATURDAY || date.getDayOfWeek() == DayOfWeek.SUNDAY;
            int ordersToday = weekend ? 5 + random.nextInt(3) : 3 + random.nextInt(2);

            for (int seq = 1; seq <= ordersToday; seq++) {
                Order order = Order.builder()
                        .orderCode(ORDER_PREFIX + date + "-" + String.format("%03d", seq))
                        .createdBy(staffId)
                        .customerName("Khách lẻ demo")
                        .orderDate(LocalDateTime.of(date, LocalTime.of(9 + random.nextInt(11), random.nextInt(60))))
                        .status(OrderStatus.COMPLETED)
                        .paymentMethod(random.nextBoolean() ? PaymentMethod.CASH : PaymentMethod.BANK_TRANSFER)
                        .note("Dữ liệu bán demo cho AI dự báo")
                        .discountAmount(BigDecimal.ZERO)
                        .totalAmount(BigDecimal.ZERO)
                        .build();

                int lines = 1 + random.nextInt(weekend ? 4 : 3);
                Set<Long> usedItems = new HashSet<>();
                for (int line = 0; line < lines; line++) {
                    WeightedItem pick = pickWeighted(catalog, random);
                    if (!usedItems.add(pick.item().getId())) {
                        continue;
                    }
                    BigDecimal qty = dailyQuantity(pick.weight(), weekend, random);
                    BigDecimal unitPrice = pick.item().getSellingPrice();
                    BigDecimal subtotal = unitPrice.multiply(qty).setScale(2, RoundingMode.HALF_UP);

                    OrderItem oi = OrderItem.builder()
                            .order(order)
                            .item(pick.item())
                            .location(khoBan)
                            .quantity(qty)
                            .unitPrice(unitPrice)
                            .subtotal(subtotal)
                            .build();
                    order.getItems().add(oi);
                    order.setTotalAmount(order.getTotalAmount().add(subtotal));
                    lineCount++;
                }

                if (!order.getItems().isEmpty()) {
                    orderRepository.save(order);
                    orderCount++;
                }
            }
        }

        log.info("Seeded {} POS orders ({} lines) over {} days for AI forecast demo", orderCount, lineCount, HISTORY_DAYS);
    }

    private List<WeightedItem> loadDemoItems() {
        List<WeightedItem> items = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : SALES_WEIGHT.entrySet()) {
            itemRepository.findByItemCode(entry.getKey()).ifPresent(item -> {
                if (item.isActive()) {
                    items.add(new WeightedItem(item, entry.getValue()));
                }
            });
        }
        return items;
    }

    private static BigDecimal dailyQuantity(int weight, boolean weekend, Random random) {
        double base = weight * (0.55 + random.nextDouble() * 0.9);
        if (weekend) {
            base *= 1.35;
        }
        int qty = Math.max(1, (int) Math.round(base));
        return BigDecimal.valueOf(qty);
    }

    private static WeightedItem pickWeighted(List<WeightedItem> catalog, Random random) {
        int total = catalog.stream().mapToInt(WeightedItem::weight).sum();
        int roll = random.nextInt(total);
        int acc = 0;
        for (WeightedItem wi : catalog) {
            acc += wi.weight();
            if (roll < acc) {
                return wi;
            }
        }
        return catalog.getLast();
    }

    private record WeightedItem(Item item, int weight) {}
}
