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
 * Seed dữ liệu POS thực tế 30 ngày gần nhất: 60 hóa đơn có khách hàng thật,
 * phương thức thanh toán đa dạng, áp dụng khuyến mãi, trả hàng.
 * Chạy sau DemoCatalogSeeder (Order 2) và ReportDataSeeder (Order 4).
 */
@Component
@Profile({"local", "prod", "test"})
@org.springframework.core.annotation.Order(6)
public class DemoPosOrderSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoPosOrderSeeder.class);
    private static final String ORDER_PREFIX = "POS-DEMO-";

    private final OrderRepository orderRepository;
    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final LocationRepository locationRepository;
    private final CustomerRepository customerRepository;
    private final PromotionRepository promotionRepository;

    @Value("${app.seed.pos-demo.enabled:true}")
    private boolean enabled;

    public DemoPosOrderSeeder(
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
        if (!enabled) return;
        if (orderRepository.existsByOrderCodeStartingWith(ORDER_PREFIX)) return;

        Long staffId = userRepository.findByUsername("staff").or(() -> userRepository.findByUsername("admin"))
                .map(User::getId).orElse(null);
        Long managerId = userRepository.findByUsername("manager").or(() -> userRepository.findByUsername("admin"))
                .map(User::getId).orElse(null);
        if (staffId == null) {
            log.warn("Skip POS demo seed: no staff user");
            return;
        }

        Location khoBan = locationRepository.findByLocationName("Kho bán").orElse(null);
        if (khoBan == null) {
            log.warn("Skip POS demo seed: Kho bán missing");
            return;
        }

        // ── 1. Seed thêm customers ────────────────────────────────────────
        seedExtraCustomers();

        // ── 2. Seed promotions ────────────────────────────────────────────
        seedPromotions();

        // ── 3. Load resources ─────────────────────────────────────────────
        List<Item> items = itemRepository.findAll().stream().filter(Item::isActive).toList();
        if (items.isEmpty()) {
            log.warn("Skip POS demo seed: no active items");
            return;
        }

        List<Customer> customers = customerRepository.findAll();
        List<Promotion> promotions = promotionRepository.findAll().stream().filter(Promotion::isActive).toList();

        // ── 4. Seed 60 POS orders (last 30 days) ─────────────────────────
        Random rng = new Random(20260619L);
        LocalDate today = LocalDate.now();
        int orderCount = 0;

        for (int i = 0; i < 60; i++) {
            int daysAgo = rng.nextInt(30);
            LocalDate date = today.minusDays(daysAgo);
            boolean weekend = date.getDayOfWeek() == DayOfWeek.SATURDAY || date.getDayOfWeek() == DayOfWeek.SUNDAY;
            LocalDateTime orderDate = LocalDateTime.of(date, LocalTime.of(8 + rng.nextInt(12), rng.nextInt(60)));

            String orderCode = ORDER_PREFIX + date + "-" + String.format("%03d", i + 1);

            // Pick customer (70% known customer, 30% khách lẻ)
            Customer customer = null;
            String customerName = "Khách lẻ";
            String customerPhone = null;
            if (!customers.isEmpty() && rng.nextInt(10) < 7) {
                customer = customers.get(rng.nextInt(customers.size()));
                customerName = customer.getFullName();
                customerPhone = customer.getPhone();
            }

                // Payment method distribution: 55% cash, 30% card, 15% transfer
            PaymentMethod pm;
            int pmRoll = rng.nextInt(100);
            if (pmRoll < 55) pm = PaymentMethod.CASH;
            else if (pmRoll < 85) pm = PaymentMethod.CARD;
            else pm = PaymentMethod.BANK_TRANSFER;

            // Promotion: 20% chance
            Promotion promo = null;
            if (!promotions.isEmpty() && rng.nextInt(10) < 2) {
                promo = promotions.get(rng.nextInt(promotions.size()));
            }

            // Pick 1–4 items
            int lineCount = 1 + rng.nextInt(weekend ? 4 : 3);
            List<Item> shuffled = new ArrayList<>(items);
            Collections.shuffle(shuffled, rng);

            BigDecimal subtotal = BigDecimal.ZERO;
            List<OrderItem> lines = new ArrayList<>();
            Long creatorId = (rng.nextBoolean() && managerId != null) ? managerId : staffId;

            for (int l = 0; l < Math.min(lineCount, shuffled.size()); l++) {
                Item item = shuffled.get(l);
                int qty = 1 + rng.nextInt(weekend ? 5 : 3);
                BigDecimal quantity = BigDecimal.valueOf(qty);
                BigDecimal unitPrice = item.getSellingPrice();
                BigDecimal lineTotal = unitPrice.multiply(quantity).setScale(2, RoundingMode.HALF_UP);
                subtotal = subtotal.add(lineTotal);

                lines.add(OrderItem.builder()
                        .item(item)
                        .location(khoBan)
                        .quantity(quantity)
                        .unitPrice(unitPrice)
                        .subtotal(lineTotal)
                        .build());
            }

            // Apply promotion discount
            BigDecimal discount = BigDecimal.ZERO;
            if (promo != null && subtotal.compareTo(promo.getMinOrder()) >= 0) {
                if ("FIXED_AMOUNT".equalsIgnoreCase(promo.getType())) {
                    discount = promo.getValue().min(subtotal);
                } else {
                    discount = subtotal.multiply(promo.getValue().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP))
                            .setScale(2, RoundingMode.HALF_UP);
                }
            } else {
                promo = null; // Don't link if not applicable
            }

            BigDecimal total = subtotal.subtract(discount).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);

            Order order = Order.builder()
                    .orderCode(orderCode)
                    .createdBy(creatorId)
                    .customerName(customerName)
                    .customer(customer)
                    .customerPhone(customerPhone)
                    .orderDate(orderDate)
                    .status(OrderStatus.COMPLETED)
                    .paymentMethod(pm)
                    .promotion(promo)
                    .discountAmount(discount)
                    .totalAmount(total)
                    .loyaltyPointsRedeemed(0)
                    .note(weekend ? "Cuối tuần, đông khách" : null)
                    .build();

            for (OrderItem oi : lines) {
                oi.setOrder(order);
                order.getItems().add(oi);
            }

            // Single payment
            order.getPayments().add(OrderPayment.builder()
                    .order(order)
                    .paymentMethod(pm)
                    .amount(total)
                    .createdAt(orderDate)
                    .build());

            orderRepository.save(order);
            orderCount++;
        }

        log.info("DemoPosOrderSeeder: seeded {} POS orders with real customers, promotions, varied payments", orderCount);
    }

    private void seedExtraCustomers() {
        upsertCustomer("Võ Thị Kim Yến",  "0905101010", "kimyen@demo.vn",   3850, "VIP");
        upsertCustomer("Bùi Văn Hải",     "0906202020", "vanbhai@demo.vn",  920,  "GOLD");
        upsertCustomer("Nguyễn Thị Lan",  "0907303030", "thiland@demo.vn",  460,  "SILVER");
        upsertCustomer("Đặng Quốc Tuấn",  "0908404040", "quoctuan@demo.vn", 220,  "REGULAR");
        upsertCustomer("Phan Thị Hồng",   "0909505050", "thihong@demo.vn",  1540, "GOLD");
        upsertCustomer("Lý Minh Đức",     "0910606060", "minhduc@demo.vn",  75,   "REGULAR");
    }

    private void upsertCustomer(String fullName, String phone, String email, int points, String tier) {
        Customer c = customerRepository.findByPhone(phone)
                .orElseGet(() -> Customer.builder().phone(phone).build());
        c.setFullName(fullName);
        c.setEmail(email);
        c.setLoyaltyPoints(points);
        c.setTier(tier);
        customerRepository.save(c);
    }

    private void seedPromotions() {
        upsertPromotion("KM-SUMMER25", "Giảm 25% Hè 2026", "PERCENTAGE",
                new BigDecimal("25"), new BigDecimal("100000"),
                LocalDate.now().minusDays(30), LocalDate.now().plusDays(30));

        upsertPromotion("KM-LOYAL50K", "Giảm 50,000đ cho khách thân thiết", "FIXED_AMOUNT",
                new BigDecimal("50000"), new BigDecimal("200000"),
                LocalDate.now().minusDays(60), LocalDate.now().plusDays(60));

        upsertPromotion("KM-STUDENT10", "Giảm 10% học sinh sinh viên", "PERCENTAGE",
                new BigDecimal("10"), new BigDecimal("50000"),
                LocalDate.now().minusDays(15), LocalDate.now().plusDays(90));

        upsertPromotion("KM-WEEKEND30K", "Cuối tuần giảm 30,000đ", "FIXED_AMOUNT",
                new BigDecimal("30000"), new BigDecimal("150000"),
                LocalDate.now().minusDays(7), LocalDate.now().plusDays(14));
    }

    private void upsertPromotion(String code, String name, String type, BigDecimal value,
                                  BigDecimal minOrder, LocalDate startDate, LocalDate endDate) {
        promotionRepository.findByCodeIgnoreCase(code).ifPresentOrElse(
                p -> { /* already exists, skip */ },
                () -> promotionRepository.save(Promotion.builder()
                        .code(code)
                        .name(name)
                        .type(type)
                        .value(value)
                        .minOrder(minOrder)
                        .startDate(startDate)
                        .endDate(endDate)
                        .active(true)
                        .build())
        );
    }
}
