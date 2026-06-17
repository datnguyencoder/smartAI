package com.smartmart.config;

import com.smartmart.entity.*;
import com.smartmart.enums.Role;
import com.smartmart.enums.UserStatus;
import com.smartmart.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Bổ sung catalog demo (SP Việt Nam + tồn kho) khi thiếu data test.
 * Idempotent: bỏ qua nếu đã có mã {@link #MARKER_ITEM_CODE}.
 */
@Component
@Profile({"local", "prod", "test"})
@Order(2)
public class DemoCatalogSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoCatalogSeeder.class);
    static final String MARKER_ITEM_CODE = "COCA-330";

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final UomRepository uomRepository;
    private final SupplierRepository supplierRepository;
    private final LocationRepository locationRepository;
    private final ItemRepository itemRepository;
    private final ItemLotRepository itemLotRepository;
    private final CurrentInventoryRepository currentInventoryRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.demo-catalog.enabled:true}")
    private boolean enabled;

    public DemoCatalogSeeder(
            UserRepository userRepository,
            CategoryRepository categoryRepository,
            UomRepository uomRepository,
            SupplierRepository supplierRepository,
            LocationRepository locationRepository,
            ItemRepository itemRepository,
            ItemLotRepository itemLotRepository,
            CurrentInventoryRepository currentInventoryRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.uomRepository = uomRepository;
        this.supplierRepository = supplierRepository;
        this.locationRepository = locationRepository;
        this.itemRepository = itemRepository;
        this.itemLotRepository = itemLotRepository;
        this.currentInventoryRepository = currentInventoryRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!enabled) {
            log.debug("Demo catalog seed disabled");
            return;
        }
        if (itemRepository.existsByItemCode(MARKER_ITEM_CODE)) {
            log.debug("Demo catalog already seeded, skipping");
            return;
        }

        seedManagerUser();

        Uom cai = uomRepository.findAll().stream()
                .filter(u -> "Cái".equals(u.getUomName()))
                .findFirst()
                .orElseGet(() -> uomRepository.save(
                        Uom.builder().uomName("Cái").conversionRatio(BigDecimal.ONE).baseUnit(true).build()));
        Uom thung = uomRepository.findAll().stream()
                .filter(u -> "Thùng".equals(u.getUomName()))
                .findFirst()
                .orElseGet(() -> uomRepository.save(
                        Uom.builder().uomName("Thùng").conversionRatio(new BigDecimal("24"))
                                .baseUnit(false).category("Đóng gói").build()));

        Category doUong = findOrCreateCategory("Đồ uống", "/media/categories/do-uong.svg");
        Category thucPham = findOrCreateCategory("Thực phẩm khô", "/media/categories/thuc-pham-kho.svg");
        Category giaVi = findOrCreateCategory("Gia vị", "/media/categories/gia-vi.svg");
        Category snack = findOrCreateCategory("Snack & bánh kẹo", "/media/categories/snack.svg");
        Category chamSoc = findOrCreateCategory("Chăm sóc cá nhân", "/media/categories/cham-soc.svg");

        ensureSupplier("Vinamilk");
        ensureSupplier("Coca-Cola Việt Nam");
        ensureSupplier("Acecook Việt Nam");
        ensureSupplier("Unilever Việt Nam");

        Location khoBan = locationRepository.findAll().stream()
                .filter(l -> "Kho bán".equals(l.getLocationName()))
                .findFirst()
                .orElseGet(() -> locationRepository.save(
                        Location.builder().locationName("Kho bán").locationType("STORE").active(true).build()));

        List<SeedItem> catalog = List.of(
                new SeedItem("COCA-330", "Coca Cola lon 330ml", doUong, cai, thung,
                        bd("8000"), bd("12000"), 48, true, "/media/items/coca-330.svg", bd("200"), "LOT-COCA-001", 6),
                new SeedItem("REDBULL-250", "Red Bull 250ml", doUong, cai, thung,
                        bd("15000"), bd("22000"), 24, true, "/media/items/redbull-250.svg", bd("80"), "LOT-RB-001", 8),
                new SeedItem("TRA-XANH-0", "Trà xanh 0 độ 455ml", doUong, cai, thung,
                        bd("6000"), bd("10000"), 36, true, "/media/items/tra-xanh-0.svg", bd("150"), "LOT-TX-001", 5),
                new SeedItem("COFFEE-G7", "Cà phê G7 3in1 (hộp 18 gói)", doUong, cai, cai,
                        bd("45000"), bd("58000"), 15, true, "/media/items/coffee-g7.svg", bd("60"), "LOT-G7-001", 12),
                new SeedItem("SUA-CHUA-VNM", "Sữa chua Vinamilk 100g", doUong, cai, thung,
                        bd("6000"), bd("9000"), 50, true, "/media/items/sua-chua-vnm.svg", bd("200"), "LOT-SC-001", 14),
                new SeedItem("MI-HAOHAO", "Mì Hảo Hảo chua cay 75g", thucPham, cai, thung,
                        bd("3500"), bd("5500"), 100, true, "/media/items/mi-haohao.svg", bd("300"), "LOT-HH-001", 9),
                new SeedItem("MI-OMACHI", "Mì Omachi sườn hè 80g", thucPham, cai, thung,
                        bd("5500"), bd("8500"), 80, true, "/media/items/mi-omachi.svg", bd("250"), "LOT-OM-001", 9),
                new SeedItem("GAO-ST25-5KG", "Gạo ST25 5kg", thucPham, cai, cai,
                        bd("95000"), bd("120000"), 10, false, "/media/items/gao-st25-5kg.svg", bd("40"), null, 0),
                new SeedItem("NUOC-MAM-NN", "Nước mắm Nam Ngư 500ml", giaVi, cai, cai,
                        bd("18000"), bd("28000"), 20, true, "/media/items/nuoc-mam-nn.svg", bd("90"), "LOT-NM-001", 18),
                new SeedItem("DAU-HOA-1L", "Dầu ăn Simply 1L", giaVi, cai, cai,
                        bd("42000"), bd("55000"), 15, true, "/media/items/dau-hoa-1l.svg", bd("70"), "LOT-DH-001", 10),
                new SeedItem("BANH-OISHI", "Bánh Oishi tôm cay 40g", snack, cai, thung,
                        bd("5000"), bd("8000"), 60, true, "/media/items/banh-oishi.svg", bd("180"), "LOT-OI-001", 7),
                new SeedItem("SNACK-LAYS", "Snack Lay's Classic 56g", snack, cai, thung,
                        bd("12000"), bd("18000"), 40, true, "/media/items/snack-lays.svg", bd("120"), "LOT-LY-001", 6),
                new SeedItem("BOT-GIAT-OMO", "Bột giặt OMO Matic 2kg", chamSoc, cai, cai,
                        bd("95000"), bd("125000"), 8, false, "/media/items/bot-giat-omo.svg", bd("35"), null, 0),
                new SeedItem("KDR-PS-180", "Kem đánh răng P/S 180g", chamSoc, cai, cai,
                        bd("22000"), bd("35000"), 20, true, "/media/items/kdr-ps-180.svg", bd("65"), "LOT-PS-001", 24)
        );

        int created = 0;
        for (SeedItem seed : catalog) {
            if (itemRepository.existsByItemCode(seed.code())) {
                continue;
            }
            Item item = itemRepository.save(Item.builder()
                    .itemCode(seed.code())
                    .itemName(seed.name())
                    .category(seed.category())
                    .baseUom(seed.baseUom())
                    .purchaseUom(seed.purchaseUom())
                    .costPrice(seed.cost())
                    .sellingPrice(seed.sell())
                    .minimumStock(seed.minStock())
                    .hasExpiry(seed.hasExpiry())
                    .active(true)
                    .imageUrl(seed.imageUrl())
                    .build());

            ItemLot lot = null;
            if (seed.lotNumber() != null) {
                lot = itemLotRepository.save(ItemLot.builder()
                        .item(item)
                        .lotNumber(seed.lotNumber())
                        .expiryDate(LocalDate.now().plusMonths(seed.expiryMonths()))
                        .build());
            }

            currentInventoryRepository.save(CurrentInventory.builder()
                    .item(item)
                    .location(khoBan)
                    .lot(lot)
                    .quantity(seed.quantity())
                    .reservedQuantity(BigDecimal.ZERO)
                    .build());
            created++;
        }

        log.info("Demo catalog seeded: {} items with images and stock", created);
    }

    private void seedManagerUser() {
        if (userRepository.findByUsername("manager").isEmpty()) {
            userRepository.save(User.builder()
                    .username("manager")
                    .password(passwordEncoder.encode("manager123"))
                    .email("manager@smartmart.com")
                    .fullName("Quản lý cửa hàng")
                    .role(Role.ROLE_MANAGER)
                    .status(UserStatus.ACTIVE)
                    .build());
            log.info("Seeded demo user manager/manager123");
        }
    }

    private Category findOrCreateCategory(String name, String imageUrl) {
        Optional<Category> existing = categoryRepository.findByCategoryName(name);
        if (existing.isPresent()) {
            Category cat = existing.get();
            if (cat.getImageUrl() == null || cat.getImageUrl().isBlank()) {
                cat.setImageUrl(imageUrl);
                return categoryRepository.save(cat);
            }
            return cat;
        }
        return categoryRepository.save(Category.builder()
                .categoryName(name)
                .active(true)
                .imageUrl(imageUrl)
                .build());
    }

    private void ensureSupplier(String name) {
        boolean exists = supplierRepository.findAll().stream()
                .anyMatch(s -> name.equals(s.getSupplierName()));
        if (!exists) {
            supplierRepository.save(Supplier.builder().supplierName(name).active(true).build());
        }
    }

    private static BigDecimal bd(String value) {
        return new BigDecimal(value);
    }

    private record SeedItem(
            String code,
            String name,
            Category category,
            Uom baseUom,
            Uom purchaseUom,
            BigDecimal cost,
            BigDecimal sell,
            int minStock,
            boolean hasExpiry,
            String imageUrl,
            BigDecimal quantity,
            String lotNumber,
            int expiryMonths
    ) {}
}
