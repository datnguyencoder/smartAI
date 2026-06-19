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
import java.time.LocalDateTime;
import java.util.List;

/**
 * Seed bộ catalog demo thực tế cho POS/WMS.
 * Idempotent: tạo mới khi thiếu và cập nhật thông tin demo quan trọng khi đã tồn tại.
 */
@Component
@Profile({"local", "prod", "test"})
@Order(2)
public class DemoCatalogSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoCatalogSeeder.class);

    private static final String IMG_DRINKS = "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=640&q=80";
    private static final String IMG_MILK = "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=640&q=80";
    private static final String IMG_YOGURT = "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=640&q=80";
    private static final String IMG_NOODLES = "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=640&q=80";
    private static final String IMG_RICE = "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=640&q=80";
    private static final String IMG_COOKING = "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=640&q=80";
    private static final String IMG_SNACKS = "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=640&q=80";
    private static final String IMG_COFFEE = "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=640&q=80";
    private static final String IMG_CLEANING = "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=640&q=80";
    private static final String IMG_PERSONAL_CARE = "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=640&q=80";

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final UomRepository uomRepository;
    private final SupplierRepository supplierRepository;
    private final LocationRepository locationRepository;
    private final ItemRepository itemRepository;
    private final ItemLotRepository itemLotRepository;
    private final CurrentInventoryRepository currentInventoryRepository;
    private final InventoryAlertRepository inventoryAlertRepository;
    private final CustomerRepository customerRepository;
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
            InventoryAlertRepository inventoryAlertRepository,
            CustomerRepository customerRepository,
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
        this.inventoryAlertRepository = inventoryAlertRepository;
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!enabled) {
            log.debug("Demo catalog seed disabled");
            return;
        }

        seedManagerUser();

        Uom cai = findOrCreateUom("Cái", BigDecimal.ONE, true, "Bán lẻ");
        Uom thung = findOrCreateUom("Thùng", bd("24"), false, "Đóng gói");
        Uom hop = findOrCreateUom("Hộp", BigDecimal.ONE, true, "Bán lẻ");
        Uom goi = findOrCreateUom("Gói", BigDecimal.ONE, true, "Bán lẻ");

        Category doUong = findOrCreateCategory("Đồ uống", IMG_DRINKS);
        Category suaLanh = findOrCreateCategory("Sữa & trứng lạnh", IMG_MILK);
        Category thucPham = findOrCreateCategory("Mì & thực phẩm khô", IMG_NOODLES);
        Category giaVi = findOrCreateCategory("Gia vị & dầu ăn", IMG_COOKING);
        Category snack = findOrCreateCategory("Snack & bánh kẹo", IMG_SNACKS);
        Category chamSoc = findOrCreateCategory("Chăm sóc cá nhân", IMG_PERSONAL_CARE);
        Category veSinh = findOrCreateCategory("Vệ sinh nhà cửa", IMG_CLEANING);

        upsertSupplier("Công ty Cổ phần Sữa Việt Nam (Vinamilk)", "Chị Lan",
                "0901888100", "sales@vinamilk.demo", "10 Tân Trào, Quận 7, TP.HCM");
        upsertSupplier("Coca-Cola Việt Nam", "Anh Minh",
                "0902333444", "orders@cocacola.demo", "Xa lộ Hà Nội, TP.Thủ Đức, TP.HCM");
        upsertSupplier("Acecook Việt Nam", "Chị Hạnh",
                "0903555666", "npp@acecook.demo", "Lô II-3, KCN Tân Bình, TP.HCM");
        upsertSupplier("Masan Consumer", "Anh Phúc",
                "0904777888", "trade@masan.demo", "Tầng 12, MPlaza, Quận 1, TP.HCM");
        upsertSupplier("Unilever Việt Nam", "Chị Trang",
                "0905999000", "gt@unilever.demo", "156 Nguyễn Lương Bằng, Quận 7, TP.HCM");
        upsertSupplier("Orion Food Vina", "Anh Tuấn",
                "0906111222", "sales@orion.demo", "KCN Mỹ Phước 2, Bình Dương");

        Location khoBan = upsertLocation("Kho bán", "STORE", null);
        Location khoTong = upsertLocation("Kho tổng", "WAREHOUSE", null);
        upsertLocation("Tủ mát quầy A", "COOLER", khoBan);

        List<SeedItem> catalog = List.of(
                new SeedItem("SUA-VNM-1L", "Sữa tươi Vinamilk 100% 1L", suaLanh, hop, thung,
                        bd("28500"), bd("36500"), 40, true, IMG_MILK, bd("96"), bd("144"), "LOT-VNM-1L-2607", 45),
                new SeedItem("SUA-CHUA-VNM", "Sữa chua Vinamilk 100g", suaLanh, hop, thung,
                        bd("5200"), bd("8000"), 50, true, IMG_YOGURT, bd("34"), bd("168"), "LOT-SC-2606", 12),
                new SeedItem("COCA-330", "Coca-Cola lon 330ml", doUong, cai, thung,
                        bd("7600"), bd("12000"), 48, true, IMG_DRINKS, bd("360"), bd("480"), "LOT-COCA-2609", 180),
                new SeedItem("REDBULL-250", "Red Bull 250ml", doUong, cai, thung,
                        bd("14700"), bd("22000"), 36, true, IMG_DRINKS, bd("14"), bd("96"), "LOT-RB-2608", 75),
                new SeedItem("TRA-XANH-0", "Trà xanh Không Độ 455ml", doUong, cai, thung,
                        bd("6400"), bd("10000"), 36, true, IMG_DRINKS, bd("156"), bd("216"), "LOT-TX-2609", 120),
                new SeedItem("LAVIE-500", "Nước khoáng Lavie 500ml", doUong, cai, thung,
                        bd("3600"), bd("6000"), 72, true, IMG_DRINKS, bd("240"), bd("360"), "LOT-LAVIE-2610", 210),
                new SeedItem("COFFEE-G7", "Cà phê G7 3in1 hộp 18 gói", doUong, hop, hop,
                        bd("45500"), bd("59000"), 18, true, IMG_COFFEE, bd("44"), bd("96"), "LOT-G7-2611", 240),
                new SeedItem("MI-HAOHAO", "Mì Hảo Hảo tôm chua cay 75g", thucPham, goi, thung,
                        bd("3450"), bd("5500"), 120, true, IMG_NOODLES, bd("420"), bd("600"), "LOT-HH-2609", 150),
                new SeedItem("MI-OMACHI", "Mì Omachi sườn hầm ngũ quả 80g", thucPham, goi, thung,
                        bd("5600"), bd("8500"), 90, true, IMG_NOODLES, bd("210"), bd("360"), "LOT-OM-2609", 150),
                new SeedItem("GAO-ST25-5KG", "Gạo ST25 túi 5kg", thucPham, cai, cai,
                        bd("98000"), bd("125000"), 18, false, IMG_RICE, bd("52"), bd("84"), null, 0),
                new SeedItem("NUOC-MAM-NN", "Nước mắm Nam Ngư 500ml", giaVi, cai, thung,
                        bd("18500"), bd("28500"), 24, true, IMG_COOKING, bd("88"), bd("144"), "LOT-NM-2701", 365),
                new SeedItem("DAU-SIMPLY-1L", "Dầu ăn Simply 1L", giaVi, cai, thung,
                        bd("42000"), bd("56000"), 20, true, IMG_COOKING, bd("72"), bd("120"), "LOT-DAU-2702", 365),
                new SeedItem("BANH-OISHI", "Bánh Oishi tôm cay 40g", snack, goi, thung,
                        bd("4900"), bd("8000"), 72, true, IMG_SNACKS, bd("180"), bd("240"), "LOT-OI-2609", 120),
                new SeedItem("SNACK-LAYS", "Snack Lay's Classic 56g", snack, goi, thung,
                        bd("11800"), bd("18000"), 48, true, IMG_SNACKS, bd("132"), bd("180"), "LOT-LY-2609", 120),
                new SeedItem("BOT-GIAT-OMO", "Bột giặt OMO Matic 2kg", veSinh, cai, cai,
                        bd("95500"), bd("129000"), 10, false, IMG_CLEANING, bd("28"), bd("48"), null, 0),
                new SeedItem("KDR-PS-180", "Kem đánh răng P/S 180g", chamSoc, cai, thung,
                        bd("22500"), bd("36000"), 24, true, IMG_PERSONAL_CARE, bd("68"), bd("120"), "LOT-PS-2703", 420)
        );

        int upserted = 0;
        for (SeedItem seed : catalog) {
            Item item = upsertItem(seed);
            ItemLot lot = upsertLot(item, seed.lotNumber(), seed.expiryDays());
            upsertInventory(item, khoBan, lot, seed.storeQuantity());
            upsertInventory(item, khoTong, lot, seed.warehouseQuantity());
            upserted++;
        }

        seedCustomers();
        seedDemoAlerts();

        log.info("Demo catalog ready: {} Vietnamese retail SKUs with real-photo URLs, stock, customers and alerts", upserted);
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
        if (userRepository.findByUsername("analyst").isEmpty()) {
            userRepository.save(User.builder()
                    .username("analyst")
                    .password(passwordEncoder.encode("analyst123"))
                    .email("analyst@smartmart.com")
                    .fullName("Phân tích kinh doanh")
                    .role(Role.ROLE_ANALYST)
                    .status(UserStatus.ACTIVE)
                    .build());
            log.info("Seeded demo user analyst/analyst123");
        }
    }

    private Category findOrCreateCategory(String name, String imageUrl) {
        Category category = categoryRepository.findByCategoryName(name)
                .orElseGet(() -> Category.builder()
                .categoryName(name)
                .active(true)
                .imageUrl(imageUrl)
                .build());
        category.setActive(true);
        category.setImageUrl(imageUrl);
        return categoryRepository.save(category);
    }

    private Uom findOrCreateUom(String name, BigDecimal ratio, boolean baseUnit, String category) {
        return uomRepository.findAll().stream()
                .filter(u -> name.equals(u.getUomName()))
                .findFirst()
                .orElseGet(() -> uomRepository.save(Uom.builder()
                        .uomName(name)
                        .conversionRatio(ratio)
                        .baseUnit(baseUnit)
                        .category(category)
                        .build()));
    }

    private Supplier upsertSupplier(String name, String contact, String phone, String email, String address) {
        Supplier supplier = supplierRepository.findBySupplierName(name)
                .orElseGet(() -> Supplier.builder().supplierName(name).build());
        supplier.setContactPerson(contact);
        supplier.setPhone(phone);
        supplier.setEmail(email);
        supplier.setAddress(address);
        supplier.setActive(true);
        return supplierRepository.save(supplier);
    }

    private Location upsertLocation(String name, String type, Location parent) {
        Location location = locationRepository.findByLocationName(name)
                .orElseGet(() -> Location.builder().locationName(name).build());
        location.setLocationType(type);
        location.setParent(parent);
        location.setActive(true);
        return locationRepository.save(location);
    }

    private Item upsertItem(SeedItem seed) {
        Item item = itemRepository.findByItemCode(seed.code())
                .orElseGet(() -> Item.builder().itemCode(seed.code()).build());
        item.setItemName(seed.name());
        item.setItemType("MERCHANDISE");
        item.setCategory(seed.category());
        item.setBaseUom(seed.baseUom());
        item.setPurchaseUom(seed.purchaseUom());
        item.setCostPrice(seed.cost());
        item.setSellingPrice(seed.sell());
        item.setMinimumStock(seed.minStock());
        item.setHasExpiry(seed.hasExpiry());
        item.setActive(true);
        item.setImageUrl(seed.imageUrl());
        return itemRepository.save(item);
    }

    private ItemLot upsertLot(Item item, String lotNumber, int expiryDays) {
        if (lotNumber == null) {
            return null;
        }
        ItemLot lot = itemLotRepository.findByItemIdAndLotNumber(item.getId(), lotNumber)
                .orElseGet(() -> ItemLot.builder()
                        .item(item)
                        .lotNumber(lotNumber)
                        .build());
        lot.setExpiryDate(LocalDate.now().plusDays(expiryDays));
        return itemLotRepository.save(lot);
    }

    private void upsertInventory(Item item, Location location, ItemLot lot, BigDecimal quantity) {
        CurrentInventory inventory = currentInventoryRepository
                .findByItemLocationLot(item.getId(), location.getId(), lot == null ? null : lot.getId())
                .orElseGet(() -> CurrentInventory.builder()
                        .item(item)
                        .location(location)
                        .lot(lot)
                        .reservedQuantity(BigDecimal.ZERO)
                        .build());
        inventory.setQuantity(quantity);
        if (inventory.getReservedQuantity() == null) {
            inventory.setReservedQuantity(BigDecimal.ZERO);
        }
        currentInventoryRepository.save(inventory);
    }

    private void seedCustomers() {
        // Khách VIP — điểm tích lũy cao
        upsertCustomer("Phạm Thu Thảo",    "0904004004", "thuthao@smartmart.vn",    2140, "VIP");
        upsertCustomer("Nguyễn Minh Anh",  "0901001001", "minhanh@smartmart.vn",    1280, "GOLD");
        // Khách GOLD
        upsertCustomer("Trần Gia Huy",     "0902002002", "giahuy@smartmart.vn",      640, "GOLD");
        upsertCustomer("Hoàng Thị Bích",   "0911011011", "thibich@smartmart.vn",     580, "GOLD");
        // Khách SILVER
        upsertCustomer("Lê Hoàng Phúc",    "0903003003", "hoangphuc@smartmart.vn",   180, "SILVER");
        upsertCustomer("Đinh Thị Mai",     "0912012012", "thimai@smartmart.vn",       350, "SILVER");
        // Khách REGULAR
        upsertCustomer("Vũ Đức Mạnh",      "0913013013", "ducmanh@smartmart.vn",      90, "REGULAR");
        upsertCustomer("Cao Thị Hương",    "0914014014", "thihuong@smartmart.vn",      40, "REGULAR");
    }

    private void upsertCustomer(String fullName, String phone, String email, int points, String tier) {
        Customer customer = customerRepository.findByPhone(phone)
                .orElseGet(() -> Customer.builder().phone(phone).build());
        customer.setFullName(fullName);
        customer.setEmail(email);
        customer.setLoyaltyPoints(points);
        customer.setTier(tier);
        customerRepository.save(customer);
    }

    private void seedDemoAlerts() {
        seedAlert("REDBULL-250", "LOW_STOCK", "WARNING",
                "Red Bull chỉ còn 14 lon tại Kho bán, thấp hơn tồn tối thiểu 36.");
        seedAlert("SUA-CHUA-VNM", "NEAR_EXPIRY", "WARNING",
                "Lô sữa chua Vinamilk còn 12 ngày hết hạn, ưu tiên bán trước hoặc chạy khuyến mãi.");
        seedAlert("COCA-330", "OVERSTOCK", "INFO",
                "Coca-Cola đang tồn cao, phù hợp để demo đề xuất trưng bày/combo.");
    }

    private void seedAlert(String itemCode, String alertType, String severity, String message) {
        itemRepository.findByItemCode(itemCode).ifPresent(item -> {
            if (inventoryAlertRepository.findFirstByItemIdAndAlertTypeAndResolvedFalse(item.getId(), alertType).isPresent()) {
                return;
            }
            inventoryAlertRepository.save(InventoryAlert.builder()
                    .item(item)
                    .alertType(alertType)
                    .severity(severity)
                    .message(message)
                    .resolved(false)
                    .createdAt(LocalDateTime.now())
                    .build());
        });
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
            BigDecimal storeQuantity,
            BigDecimal warehouseQuantity,
            String lotNumber,
            int expiryDays
    ) {}
}
