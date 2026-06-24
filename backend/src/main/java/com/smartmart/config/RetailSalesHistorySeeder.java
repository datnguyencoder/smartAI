package com.smartmart.config;

import com.smartmart.entity.*;
import com.smartmart.enums.OrderStatus;
import com.smartmart.enums.PaymentMethod;
import com.smartmart.repository.*;
import com.smartmart.util.ItemImageUrls;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Component
@Profile({"local", "prod"})
@org.springframework.core.annotation.Order(3)
public class RetailSalesHistorySeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(RetailSalesHistorySeeder.class);
    private static final String DEFAULT_CSV = "data/retail/uci_online_retail_daily.csv";
    private static final String ORDER_PREFIX = "RETAIL-";
    private static final LocalDate CSV_DATA_END = LocalDate.of(2011, 12, 10);

    private final OrderRepository orderRepository;
    private final ItemRepository itemRepository;
    private final CategoryRepository categoryRepository;
    private final UomRepository uomRepository;
    private final UserRepository userRepository;

    @Value("${app.seed.retail-sales.enabled:true}")
    private boolean enabled;

    @Value("${app.seed.retail-sales.csv:" + DEFAULT_CSV + "}")
    private String csvClasspath;

    public RetailSalesHistorySeeder(
            OrderRepository orderRepository,
            ItemRepository itemRepository,
            CategoryRepository categoryRepository,
            UomRepository uomRepository,
            UserRepository userRepository
    ) {
        this.orderRepository = orderRepository;
        this.itemRepository = itemRepository;
        this.categoryRepository = categoryRepository;
        this.uomRepository = uomRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!enabled) {
            return;
        }
        if (orderRepository.existsByOrderCodeStartingWith(ORDER_PREFIX)) {
            shiftRetailOrderDatesIfStale();
            return;
        }
        ClassPathResource resource = new ClassPathResource(csvClasspath);
        if (!resource.exists()) {
            log.warn("Retail sales CSV not found on classpath: {}", csvClasspath);
            return;
        }

        Long staffId = userRepository.findByUsername("staff").map(User::getId).orElse(null);
        Optional<Uom> baseUomOpt = uomRepository.findAll().stream().findFirst();
        if (baseUomOpt.isEmpty()) {
            log.warn("Skipping retail sales import — no UOM (DataSeeder not ready)");
            return;
        }
        Uom baseUom = baseUomOpt.get();

        Map<String, Item> itemsByCode = new HashMap<>();
        Map<String, Category> categoriesByName = new HashMap<>();
        Map<LocalDate, Order> ordersByDate = new LinkedHashMap<>();

        int rowCount = 0;
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
            String header = reader.readLine();
            if (header == null) {
                return;
            }
            String line;
            while ((line = reader.readLine()) != null) {
                List<String> cols = parseCsvLine(line);
                if (cols.size() < 6) {
                    continue;
                }
                String externalCode = cols.get(1).trim();
                String productName = cols.get(2).trim();
                String categoryName = cols.get(3).trim();
                LocalDate saleDate = shiftToRecentWindow(LocalDate.parse(cols.get(4).trim()));
                BigDecimal quantity = new BigDecimal(cols.get(5).trim());

                Item item = itemsByCode.computeIfAbsent(externalCode, code ->
                        itemRepository.findByItemCode("RETAIL-" + code)
                                .orElseGet(() -> createRetailItem(code, productName, categoryName, categoriesByName, baseUom)));

                Order salesOrder = ordersByDate.computeIfAbsent(saleDate, date -> {
                    Order o = Order.builder()
                            .orderCode(ORDER_PREFIX + date)
                            .createdBy(staffId)
                            .customerName("Retail dataset import")
                            .orderDate(LocalDateTime.of(date, LocalTime.of(12, 0)))
                            .status(OrderStatus.COMPLETED)
                            .paymentMethod(PaymentMethod.CASH)
                            .note("Imported from " + cols.get(0).trim())
                            .discountAmount(BigDecimal.ZERO)
                            .totalAmount(BigDecimal.ZERO)
                            .build();
                    return orderRepository.save(o);
                });

                BigDecimal unitPrice = item.getSellingPrice();
                BigDecimal subtotal = unitPrice.multiply(quantity).setScale(2, RoundingMode.HALF_UP);
                OrderItem oi = OrderItem.builder()
                        .order(salesOrder)
                        .item(item)
                        .quantity(quantity)
                        .unitPrice(unitPrice)
                        .subtotal(subtotal)
                        .build();
                salesOrder.getItems().add(oi);
                salesOrder.setTotalAmount(salesOrder.getTotalAmount().add(subtotal));
                rowCount++;
            }
        } catch (Exception e) {
            throw new IllegalStateException("Failed to import retail sales CSV: " + csvClasspath, e);
        }

        for (Order salesOrder : ordersByDate.values()) {
            orderRepository.save(salesOrder);
        }
        log.info("Imported {} retail sales lines into {} orders from {}", rowCount, ordersByDate.size(), csvClasspath);
    }

    private Item createRetailItem(
            String externalCode,
            String productName,
            String categoryName,
            Map<String, Category> categoriesByName,
            Uom baseUom
    ) {
        Category category = categoriesByName.computeIfAbsent(categoryName, name ->
                categoryRepository.findByCategoryName(name)
                        .orElseGet(() -> categoryRepository.save(
                                Category.builder()
                                        .categoryName(name)
                                        .active(true)
                                        .imageUrl("/media/categories/retail.svg")
                                        .build())));

        String itemCode = "RETAIL-" + externalCode;
        return itemRepository.save(Item.builder()
                .itemCode(itemCode)
                .itemName(truncate(productName, 200))
                .category(category)
                .baseUom(baseUom)
                .purchaseUom(baseUom)
                .costPrice(new BigDecimal("10000"))
                .sellingPrice(new BigDecimal("15000"))
                .minimumStock(10)
                .hasExpiry(false)
                .active(true)
                .imageUrl(ItemImageUrls.defaultItemPath(itemCode))
                .build());
    }

    /** Map ngày trong CSV (2011) → gần hiện tại để extractSalesHistory(180) có dữ liệu. */
    private static LocalDate shiftToRecentWindow(LocalDate csvDate) {
        LocalDate targetEnd = LocalDate.now().minusDays(1);
        long offsetDays = ChronoUnit.DAYS.between(CSV_DATA_END, targetEnd);
        return csvDate.plusDays(offsetDays);
    }

    /** DB cũ seed ngày 2011 — dịch sang cửa sổ gần hiện tại một lần khi khởi động. */
    private void shiftRetailOrderDatesIfStale() {
        List<Order> retailOrders = orderRepository.findByOrderCodeStartingWith(ORDER_PREFIX);
        if (retailOrders.isEmpty()) {
            return;
        }
        LocalDate maxDate = retailOrders.stream()
                .map(o -> o.getOrderDate().toLocalDate())
                .max(LocalDate::compareTo)
                .orElse(LocalDate.now());
        if (!maxDate.isBefore(LocalDate.now().minusDays(60))) {
            return;
        }
        long offsetDays = ChronoUnit.DAYS.between(maxDate, LocalDate.now().minusDays(1));
        for (Order order : retailOrders) {
            order.setOrderDate(order.getOrderDate().plusDays(offsetDays));
            String datePart = order.getOrderDate().toLocalDate().toString();
            order.setOrderCode(ORDER_PREFIX + datePart);
        }
        orderRepository.saveAll(retailOrders);
        log.info("Shifted {} retail orders forward by {} days for AI forecast window", retailOrders.size(), offsetDays);
    }

    private static String truncate(String value, int max) {
        if (value.length() <= max) {
            return value;
        }
        return value.substring(0, max - 3) + "...";
    }

    static List<String> parseCsvLine(String line) {
        List<String> fields = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (inQuotes) {
                if (c == '"') {
                    if (i + 1 < line.length() && line.charAt(i + 1) == '"') {
                        current.append('"');
                        i++;
                    } else {
                        inQuotes = false;
                    }
                } else {
                    current.append(c);
                }
            } else if (c == '"') {
                inQuotes = true;
            } else if (c == ',') {
                fields.add(current.toString());
                current.setLength(0);
            } else {
                current.append(c);
            }
        }
        fields.add(current.toString());
        return fields;
    }
}
