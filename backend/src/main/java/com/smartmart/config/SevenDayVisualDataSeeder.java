package com.smartmart.config;

import com.smartmart.entity.Customer;
import com.smartmart.entity.Item;
import com.smartmart.entity.Location;
import com.smartmart.entity.Order;
import com.smartmart.entity.OrderItem;
import com.smartmart.entity.OrderPayment;
import com.smartmart.entity.Promotion;
import com.smartmart.entity.User;
import com.smartmart.enums.OrderStatus;
import com.smartmart.enums.PaymentMethod;
import com.smartmart.repository.CustomerRepository;
import com.smartmart.repository.ItemRepository;
import com.smartmart.repository.LocationRepository;
import com.smartmart.repository.OrderRepository;
import com.smartmart.repository.PromotionRepository;
import com.smartmart.repository.UserRepository;
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
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.Set;

@Component
@Profile({"local", "prod"})
@org.springframework.core.annotation.Order(8)
public class SevenDayVisualDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(SevenDayVisualDataSeeder.class);
    private static final String ORDER_PREFIX = "7D-VISUAL-";
    private static final long RANDOM_SEED = 20260701L;

    private static final List<String> HERO_SKUS = List.of(
            "COCA-330", "LAVIE-500", "TRA-XANH-0", "REDBULL-250", "PEPSI-330",
            "MI-HAOHAO", "MI-OMACHI", "BANH-OISHI", "SNACK-LAYS", "SUA-VNM-1L",
            "SUA-CHUA-VNM", "COFFEE-G7", "GAO-ST25-5KG", "NUOC-MAM-NN",
            "DAU-SIMPLY-1L", "BOT-GIAT-OMO", "KDR-PS-180", "XUC-XICH-CP-500",
            "TRUNG-GA-HOP10", "PIN-AA-PANASONIC-4V", "BUT-BI-TL-027"
    );

    private static final Map<String, Integer> SKU_WEIGHT = Map.ofEntries(
            Map.entry("COCA-330", 17),
            Map.entry("LAVIE-500", 16),
            Map.entry("TRA-XANH-0", 14),
            Map.entry("REDBULL-250", 13),
            Map.entry("PEPSI-330", 12),
            Map.entry("MI-HAOHAO", 15),
            Map.entry("MI-OMACHI", 11),
            Map.entry("BANH-OISHI", 12),
            Map.entry("SNACK-LAYS", 10),
            Map.entry("SUA-VNM-1L", 10),
            Map.entry("SUA-CHUA-VNM", 9),
            Map.entry("COFFEE-G7", 7),
            Map.entry("GAO-ST25-5KG", 4),
            Map.entry("NUOC-MAM-NN", 5),
            Map.entry("DAU-SIMPLY-1L", 4),
            Map.entry("BOT-GIAT-OMO", 3),
            Map.entry("KDR-PS-180", 5),
            Map.entry("XUC-XICH-CP-500", 6),
            Map.entry("TRUNG-GA-HOP10", 7),
            Map.entry("PIN-AA-PANASONIC-4V", 3),
            Map.entry("BUT-BI-TL-027", 5)
    );

    private final OrderRepository orderRepository;
    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final LocationRepository locationRepository;
    private final CustomerRepository customerRepository;
    private final PromotionRepository promotionRepository;

    @Value("${app.seed.seven-day-visual.enabled:true}")
    private boolean enabled;

    public SevenDayVisualDataSeeder(
            OrderRepository orderRepository,
            ItemRepository itemRepository,
            UserRepository userRepository,
            LocationRepository locationRepository,
            CustomerRepository customerRepository,
            PromotionRepository promotionRepository
    ) {
        this.orderRepository = orderRepository;
        this.itemRepository = itemRepository;
        this.userRepository = userRepository;
        this.locationRepository = locationRepository;
        this.customerRepository = customerRepository;
        this.promotionRepository = promotionRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!enabled) {
            log.debug("Seven-day visual data seed disabled");
            return;
        }
        if (orderRepository.existsByOrderCodeStartingWith(ORDER_PREFIX)) {
            log.debug("Seven-day visual data already exists, skipping");
            return;
        }

        Long staffId = userRepository.findByUsername("staff").or(() -> userRepository.findByUsername("admin"))
                .map(User::getId).orElse(null);
        Long managerId = userRepository.findByUsername("manager").or(() -> userRepository.findByUsername("admin"))
                .map(User::getId).orElse(staffId);
        Location storeLocation = locationRepository.findByLocationName("Kho bán").orElse(null);
        if (staffId == null || storeLocation == null) {
            log.warn("Skip seven-day visual data: missing staff user or Kho bán location");
            return;
        }

        List<Customer> customers = seedCustomers();
        List<Promotion> promotions = seedPromotions();
        List<WeightedItem> catalog = loadWeightedItems();
        if (catalog.isEmpty()) {
            log.warn("Skip seven-day visual data: no weighted SKUs found");
            return;
        }

        Random random = new Random(RANDOM_SEED);
        LocalDate today = LocalDate.now();
        int orderCount = 0;
        int cancelledCount = 0;
        int lineCount = 0;

        for (int dayOffset = 6; dayOffset >= 0; dayOffset--) {
            LocalDate date = today.minusDays(dayOffset);
            boolean weekend = isWeekend(date);
            int dayIndex = 6 - dayOffset;
            int completedToday = (weekend ? 46 : 32) + dayIndex * 3 + random.nextInt(5);
            int cancelledToday = weekend ? 3 : 2;

            for (int seq = 1; seq <= completedToday; seq++) {
                Order order = buildCompletedOrder(
                        date,
                        seq,
                        dayIndex,
                        weekend,
                        staffId,
                        managerId,
                        storeLocation,
                        customers,
                        promotions,
                        catalog,
                        random
                );
                lineCount += order.getItems().size();
                orderRepository.save(order);
                orderCount++;
            }

            for (int seq = 1; seq <= cancelledToday; seq++) {
                orderRepository.save(buildCancelledOrder(date, seq, staffId, customers, random));
                cancelledCount++;
            }
        }

        log.info("Seven-day visual data seeded: {} completed orders, {} cancelled orders, {} order lines", orderCount, cancelledCount, lineCount);
    }

    private Order buildCompletedOrder(
            LocalDate date,
            int seq,
            int dayIndex,
            boolean weekend,
            Long staffId,
            Long managerId,
            Location storeLocation,
            List<Customer> customers,
            List<Promotion> promotions,
            List<WeightedItem> catalog,
            Random random
    ) {
        LocalDateTime orderDate = LocalDateTime.of(date, pickSaleTime(seq, weekend, random));
        Customer customer = pickCustomer(customers, random).orElse(null);
        String customerName = customer != null ? customer.getFullName() : "Khách lẻ";
        String customerPhone = customer != null ? customer.getPhone() : null;
        Long createdBy = seq % 9 == 0 && managerId != null ? managerId : staffId;

        Order order = Order.builder()
                .orderCode(ORDER_PREFIX + date + "-" + String.format("%03d", seq))
                .createdBy(createdBy)
                .customer(customer)
                .customerName(customerName)
                .customerPhone(customerPhone)
                .orderDate(orderDate)
                .status(OrderStatus.COMPLETED)
                .paymentMethod(pickPaymentMethod(seq, random))
                .discountAmount(BigDecimal.ZERO)
                .totalAmount(BigDecimal.ZERO)
                .loyaltyPointsRedeemed(customer != null && seq % 17 == 0 ? 20 : 0)
                .note(weekend ? "Dataset 7 ngày: cuối tuần, lượt mua cao" : "Dataset 7 ngày: ca bán demo")
                .build();

        int lineTarget = 2 + random.nextInt(weekend ? 5 : 4);
        Set<Long> used = new HashSet<>();
        for (int line = 0; line < lineTarget; line++) {
            WeightedItem picked = pickWeighted(catalog, random);
            if (!used.add(picked.item().getId())) {
                continue;
            }
            BigDecimal quantity = quantityFor(picked, weekend, dayIndex, orderDate.toLocalTime(), random);
            BigDecimal unitPrice = picked.item().getSellingPrice();
            BigDecimal subtotal = unitPrice.multiply(quantity).setScale(2, RoundingMode.HALF_UP);

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .item(picked.item())
                    .location(storeLocation)
                    .quantity(quantity)
                    .unitPrice(unitPrice)
                    .subtotal(subtotal)
                    .build();
            order.getItems().add(orderItem);
            order.setTotalAmount(order.getTotalAmount().add(subtotal));
        }

        applyPromotion(order, promotions, random);
        order.getPayments().add(OrderPayment.builder()
                .order(order)
                .paymentMethod(order.getPaymentMethod())
                .amount(order.getTotalAmount())
                .createdAt(orderDate)
                .build());
        return order;
    }

    private Order buildCancelledOrder(LocalDate date, int seq, Long staffId, List<Customer> customers, Random random) {
        Customer customer = pickCustomer(customers, random).orElse(null);
        return Order.builder()
                .orderCode(ORDER_PREFIX + date + "-C" + String.format("%02d", seq))
                .createdBy(staffId)
                .customer(customer)
                .customerName(customer != null ? customer.getFullName() : "Khách lẻ")
                .customerPhone(customer != null ? customer.getPhone() : null)
                .orderDate(LocalDateTime.of(date, LocalTime.of(20, 15 + seq)))
                .status(OrderStatus.CANCELLED)
                .paymentMethod(PaymentMethod.CASH)
                .discountAmount(BigDecimal.ZERO)
                .totalAmount(BigDecimal.ZERO)
                .loyaltyPointsRedeemed(0)
                .note("Dataset 7 ngày: khách đổi ý / hủy đơn")
                .build();
    }

    private List<WeightedItem> loadWeightedItems() {
        List<WeightedItem> items = new ArrayList<>();
        for (String sku : HERO_SKUS) {
            itemRepository.findByItemCode(sku).ifPresent(item -> {
                if (item.isActive()) {
                    items.add(new WeightedItem(item, SKU_WEIGHT.getOrDefault(sku, 5)));
                }
            });
        }
        return items;
    }

    private List<Customer> seedCustomers() {
        List<Customer> customers = new ArrayList<>();
        customers.add(upsertCustomer("Nguyễn An Khang", "0927001001", "ankhang@smartmart.demo", 2680, "VIP"));
        customers.add(upsertCustomer("Trần Minh Châu", "0927001002", "minhchau@smartmart.demo", 1460, "GOLD"));
        customers.add(upsertCustomer("Lê Hoàng Nam", "0927001003", "hoangnam@smartmart.demo", 820, "GOLD"));
        customers.add(upsertCustomer("Phạm Thu Ngân", "0927001004", "thungan@smartmart.demo", 510, "SILVER"));
        customers.add(upsertCustomer("Đỗ Gia Bảo", "0927001005", "giabao@smartmart.demo", 320, "SILVER"));
        customers.add(upsertCustomer("Vũ Hải Linh", "0927001006", "hailinh@smartmart.demo", 160, "REGULAR"));
        customers.add(upsertCustomer("Cao Nhật Minh", "0927001007", "nhatminh@smartmart.demo", 90, "REGULAR"));
        customers.add(upsertCustomer("Bùi Khánh Vy", "0927001008", "khanhvy@smartmart.demo", 1880, "VIP"));
        return customers;
    }

    private Customer upsertCustomer(String fullName, String phone, String email, int points, String tier) {
        Customer customer = customerRepository.findByPhone(phone)
                .orElseGet(() -> Customer.builder().phone(phone).build());
        customer.setFullName(fullName);
        customer.setEmail(email);
        customer.setLoyaltyPoints(points);
        customer.setTier(tier);
        return customerRepository.save(customer);
    }

    private List<Promotion> seedPromotions() {
        return List.of(
                upsertPromotion("7DAY-FRESH20", "7 ngày vàng đồ tươi mát", "PERCENTAGE",
                        bd("20"), bd("80000"), LocalDate.now().minusDays(7), LocalDate.now().plusDays(7)),
                upsertPromotion("7DAY-COMBO30K", "Combo gia đình giảm 30k", "FIXED_AMOUNT",
                        bd("30000"), bd("180000"), LocalDate.now().minusDays(7), LocalDate.now().plusDays(10)),
                upsertPromotion("7DAY-VIP50K", "VIP cuối tuần giảm 50k", "FIXED_AMOUNT",
                        bd("50000"), bd("300000"), LocalDate.now().minusDays(7), LocalDate.now().plusDays(14))
        );
    }

    private Promotion upsertPromotion(String code, String name, String type, BigDecimal value,
                                      BigDecimal minOrder, LocalDate startDate, LocalDate endDate) {
        Promotion promotion = promotionRepository.findByCodeIgnoreCase(code)
                .orElseGet(() -> Promotion.builder().code(code).build());
        promotion.setName(name);
        promotion.setType(type);
        promotion.setValue(value);
        promotion.setMinOrder(minOrder);
        promotion.setStartDate(startDate);
        promotion.setEndDate(endDate);
        promotion.setActive(true);
        return promotionRepository.save(promotion);
    }

    private void applyPromotion(Order order, List<Promotion> promotions, Random random) {
        if (promotions.isEmpty() || random.nextInt(100) >= 34) {
            return;
        }
        List<Promotion> shuffled = new ArrayList<>(promotions);
        Collections.shuffle(shuffled, random);
        for (Promotion promotion : shuffled) {
            if (order.getTotalAmount().compareTo(promotion.getMinOrder()) < 0) {
                continue;
            }
            BigDecimal discount;
            if ("FIXED_AMOUNT".equalsIgnoreCase(promotion.getType())) {
                discount = promotion.getValue().min(order.getTotalAmount());
            } else {
                discount = order.getTotalAmount()
                        .multiply(promotion.getValue().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP))
                        .setScale(2, RoundingMode.HALF_UP);
            }
            order.setPromotion(promotion);
            order.setDiscountAmount(discount);
            order.setTotalAmount(order.getTotalAmount().subtract(discount).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP));
            return;
        }
    }

    private static Optional<Customer> pickCustomer(List<Customer> customers, Random random) {
        if (customers.isEmpty() || random.nextInt(100) < 22) {
            return Optional.empty();
        }
        return Optional.of(customers.get(random.nextInt(customers.size())));
    }

    private static LocalTime pickSaleTime(int seq, boolean weekend, Random random) {
        int roll = random.nextInt(100);
        int hour;
        if (roll < 28) {
            hour = 7 + random.nextInt(4);
        } else if (roll < 58) {
            hour = 11 + random.nextInt(4);
        } else {
            hour = 16 + random.nextInt(weekend ? 6 : 5);
        }
        return LocalTime.of(Math.min(hour, 22), (seq * 7 + random.nextInt(12)) % 60);
    }

    private static PaymentMethod pickPaymentMethod(int seq, Random random) {
        int roll = (seq * 11 + random.nextInt(100)) % 100;
        if (roll < 42) return PaymentMethod.CASH;
        if (roll < 69) return PaymentMethod.CARD;
        if (roll < 88) return PaymentMethod.BANK_TRANSFER;
        return PaymentMethod.WALLET;
    }

    private static WeightedItem pickWeighted(List<WeightedItem> catalog, Random random) {
        int total = catalog.stream().mapToInt(WeightedItem::weight).sum();
        int roll = random.nextInt(total);
        int cursor = 0;
        for (WeightedItem item : catalog) {
            cursor += item.weight();
            if (roll < cursor) {
                return item;
            }
        }
        return catalog.get(catalog.size() - 1);
    }

    private static BigDecimal quantityFor(WeightedItem picked, boolean weekend, int dayIndex, LocalTime saleTime, Random random) {
        double base = 1 + (picked.weight() / 5.0);
        if (weekend) base *= 1.25;
        if (saleTime.getHour() >= 17) base *= 1.18;
        base *= 0.85 + (dayIndex * 0.035);
        int quantity = Math.max(1, (int) Math.round(base + random.nextDouble() * 2.2));
        return BigDecimal.valueOf(quantity);
    }

    private static boolean isWeekend(LocalDate date) {
        return date.getDayOfWeek() == DayOfWeek.SATURDAY || date.getDayOfWeek() == DayOfWeek.SUNDAY;
    }

    private static BigDecimal bd(String value) {
        return new BigDecimal(value);
    }

    private record WeightedItem(Item item, int weight) {}
}
