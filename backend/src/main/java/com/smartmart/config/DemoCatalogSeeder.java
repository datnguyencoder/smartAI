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
    private final PromotionRepository promotionRepository;
    private final PromotionRecommendationRepository promotionRecommendationRepository;
    private final ForecastResultRepository forecastResultRepository;
    private final ReorderRecommendationRepository reorderRecommendationRepository;
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
            PromotionRepository promotionRepository,
            PromotionRecommendationRepository promotionRecommendationRepository,
            ForecastResultRepository forecastResultRepository,
            ReorderRecommendationRepository reorderRecommendationRepository,
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
        this.promotionRepository = promotionRepository;
        this.promotionRecommendationRepository = promotionRecommendationRepository;
        this.forecastResultRepository = forecastResultRepository;
        this.reorderRecommendationRepository = reorderRecommendationRepository;
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
                new SeedItem("SUA-VNM-1L-ITDUONG", "Sữa tươi Vinamilk ít đường 1L", suaLanh, hop, thung,
                        bd("28600"), bd("37000"), 36, true, IMG_MILK, bd("84"), bd("120"), "LOT-VNM-ID-2607", 48),
                new SeedItem("SUA-VNM-1L-KDUONG", "Sữa tươi Vinamilk không đường 1L", suaLanh, hop, thung,
                        bd("28600"), bd("37000"), 36, true, IMG_MILK, bd("72"), bd("120"), "LOT-VNM-KD-2607", 48),
                new SeedItem("SUA-TH-1L-ITDUONG", "Sữa tươi TH true Milk ít đường 1L", suaLanh, hop, thung,
                        bd("30200"), bd("39000"), 30, true, IMG_MILK, bd("66"), bd("96"), "LOT-TH-ID-2607", 42),
                new SeedItem("SUA-DALAT-1L", "Sữa tươi Dalat Milk thanh trùng 1L", suaLanh, hop, thung,
                        bd("33500"), bd("45000"), 24, true, IMG_MILK, bd("38"), bd("72"), "LOT-DLM-2607", 21),
                new SeedItem("SUA-CHUA-VNM", "Sữa chua Vinamilk 100g", suaLanh, hop, thung,
                        bd("5200"), bd("8000"), 50, true, IMG_YOGURT, bd("34"), bd("168"), "LOT-SC-2606", 12),
                new SeedItem("SUA-CHUA-VNM-NHA-DAM", "Sữa chua Vinamilk nha đam 100g", suaLanh, hop, thung,
                        bd("5500"), bd("8500"), 48, true, IMG_YOGURT, bd("92"), bd("144"), "LOT-SC-ND-2606", 15),
                new SeedItem("SUA-CHUA-TH-LOC4", "Sữa chua TH true Yogurt lốc 4 hộp", suaLanh, hop, thung,
                        bd("21000"), bd("32000"), 24, true, IMG_YOGURT, bd("86"), bd("96"), "LOT-THY-2606", 8),
                new SeedItem("PROBI-65ML-LOC5", "Sữa uống men sống Probi lốc 5 chai", suaLanh, hop, thung,
                        bd("20500"), bd("31000"), 24, true, IMG_YOGURT, bd("74"), bd("96"), "LOT-PROBI-2606", 14),
                new SeedItem("PHO-MAI-BELCUBE", "Phô mai Belcube vị sữa 125g", suaLanh, hop, thung,
                        bd("45500"), bd("65000"), 12, true, IMG_MILK, bd("44"), bd("48"), "LOT-BEL-2606", 18),
                new SeedItem("BANH-FLAN-4H", "Bánh flan caramel hộp 4 ly", suaLanh, hop, thung,
                        bd("26000"), bd("39000"), 16, true, IMG_YOGURT, bd("58"), bd("72"), "LOT-FLAN-2606", 6),
                new SeedItem("COCA-330", "Coca-Cola lon 330ml", doUong, cai, thung,
                        bd("7600"), bd("12000"), 48, true, IMG_DRINKS, bd("360"), bd("480"), "LOT-COCA-2609", 180),
                new SeedItem("COCA-ZERO-330", "Coca-Cola Zero lon 330ml", doUong, cai, thung,
                        bd("7800"), bd("12000"), 36, true, IMG_DRINKS, bd("168"), bd("240"), "LOT-CZ-2609", 180),
                new SeedItem("COCA-LIGHT-330", "Coca-Cola Light lon 330ml", doUong, cai, thung,
                        bd("7900"), bd("12500"), 24, true, IMG_DRINKS, bd("84"), bd("144"), "LOT-CL-2609", 180),
                new SeedItem("PEPSI-330", "Pepsi lon 330ml", doUong, cai, thung,
                        bd("7400"), bd("11500"), 48, true, IMG_DRINKS, bd("288"), bd("360"), "LOT-PEP-2609", 180),
                new SeedItem("REDBULL-250", "Red Bull 250ml", doUong, cai, thung,
                        bd("14700"), bd("22000"), 36, true, IMG_DRINKS, bd("14"), bd("96"), "LOT-RB-2608", 75),
                new SeedItem("STING-DAU-330", "Sting dâu lon 330ml", doUong, cai, thung,
                        bd("7800"), bd("12000"), 48, true, IMG_DRINKS, bd("192"), bd("240"), "LOT-STING-2608", 120),
                new SeedItem("TRA-XANH-0", "Trà xanh Không Độ 455ml", doUong, cai, thung,
                        bd("6400"), bd("10000"), 36, true, IMG_DRINKS, bd("156"), bd("216"), "LOT-TX-2609", 120),
                new SeedItem("TEA-PLUS-450", "Trà Ô Long Tea Plus 450ml", doUong, cai, thung,
                        bd("6900"), bd("11000"), 36, true, IMG_DRINKS, bd("132"), bd("180"), "LOT-TEAPLUS-2609", 135),
                new SeedItem("LAVIE-500", "Nước khoáng Lavie 500ml", doUong, cai, thung,
                        bd("3600"), bd("6000"), 72, true, IMG_DRINKS, bd("240"), bd("360"), "LOT-LAVIE-2610", 210),
                new SeedItem("LAVIE-1500", "Nước khoáng Lavie 1.5L", doUong, cai, thung,
                        bd("6400"), bd("10000"), 48, true, IMG_DRINKS, bd("156"), bd("240"), "LOT-LAVIE15-2610", 210),
                new SeedItem("AQUAFINA-500", "Nước tinh khiết Aquafina 500ml", doUong, cai, thung,
                        bd("3500"), bd("6000"), 72, true, IMG_DRINKS, bd("216"), bd("300"), "LOT-AQUA-2610", 210),
                new SeedItem("COFFEE-G7", "Cà phê G7 3in1 hộp 18 gói", doUong, hop, hop,
                        bd("45500"), bd("59000"), 18, true, IMG_COFFEE, bd("44"), bd("96"), "LOT-G7-2611", 240),
                new SeedItem("COFFEE-G7-DEN", "Cà phê G7 đen đá hộp 15 gói", doUong, hop, hop,
                        bd("41500"), bd("55000"), 18, true, IMG_COFFEE, bd("36"), bd("72"), "LOT-G7-DEN-2611", 240),
                new SeedItem("NESCAFE-3IN1", "Nescafé 3in1 đậm vị Việt hộp 20 gói", doUong, hop, hop,
                        bd("52000"), bd("69000"), 18, true, IMG_COFFEE, bd("42"), bd("84"), "LOT-NES-2611", 240),
                new SeedItem("MI-HAOHAO", "Mì Hảo Hảo tôm chua cay 75g", thucPham, goi, thung,
                        bd("3450"), bd("5500"), 120, true, IMG_NOODLES, bd("420"), bd("600"), "LOT-HH-2609", 150),
                new SeedItem("MI-HAOHAO-TOM", "Mì Hảo Hảo vị tôm 75g", thucPham, goi, thung,
                        bd("3450"), bd("5500"), 90, true, IMG_NOODLES, bd("288"), bd("480"), "LOT-HH-TOM-2609", 150),
                new SeedItem("MI-HAOHAO-SA-TE", "Mì Hảo Hảo sa tế hành 75g", thucPham, goi, thung,
                        bd("3500"), bd("5600"), 90, true, IMG_NOODLES, bd("240"), bd("420"), "LOT-HH-ST-2609", 150),
                new SeedItem("MI-HAOHAO-GA-VANG", "Mì Hảo Hảo gà vàng 75g", thucPham, goi, thung,
                        bd("3500"), bd("5600"), 72, true, IMG_NOODLES, bd("168"), bd("360"), "LOT-HH-GV-2609", 150),
                new SeedItem("MI-HAOHAO-XAO-TOM-HANH", "Mì Hảo Hảo xào tôm hành 75g", thucPham, goi, thung,
                        bd("3600"), bd("5900"), 72, true, IMG_NOODLES, bd("144"), bd("300"), "LOT-HH-XTH-2609", 150),
                new SeedItem("MI-OMACHI", "Mì Omachi sườn hầm ngũ quả 80g", thucPham, goi, thung,
                        bd("5600"), bd("8500"), 90, true, IMG_NOODLES, bd("210"), bd("360"), "LOT-OM-2609", 150),
                new SeedItem("MI-OMACHI-BO-HAM", "Mì Omachi bò hầm 80g", thucPham, goi, thung,
                        bd("5700"), bd("8900"), 72, true, IMG_NOODLES, bd("180"), bd("300"), "LOT-OM-BH-2609", 150),
                new SeedItem("MI-KOKOMI-90", "Mì Kokomi tôm chua cay 90g", thucPham, goi, thung,
                        bd("3100"), bd("5000"), 120, true, IMG_NOODLES, bd("360"), bd("540"), "LOT-KOK-2609", 150),
                new SeedItem("GAO-ST25-5KG", "Gạo ST25 túi 5kg", thucPham, cai, cai,
                        bd("98000"), bd("125000"), 18, false, IMG_RICE, bd("52"), bd("84"), null, 0),
                new SeedItem("GAO-JASMINE-5KG", "Gạo thơm Jasmine túi 5kg", thucPham, cai, cai,
                        bd("79000"), bd("105000"), 20, false, IMG_RICE, bd("64"), bd("96"), null, 0),
                new SeedItem("GAO-NANG-HOA-5KG", "Gạo Nàng Hoa túi 5kg", thucPham, cai, cai,
                        bd("86000"), bd("112000"), 18, false, IMG_RICE, bd("42"), bd("72"), null, 0),
                new SeedItem("NUOC-MAM-NN", "Nước mắm Nam Ngư 500ml", giaVi, cai, thung,
                        bd("18500"), bd("28500"), 24, true, IMG_COOKING, bd("88"), bd("144"), "LOT-NM-2701", 365),
                new SeedItem("NUOC-MAM-NN-750", "Nước mắm Nam Ngư 750ml", giaVi, cai, thung,
                        bd("26500"), bd("39000"), 18, true, IMG_COOKING, bd("54"), bd("96"), "LOT-NM750-2701", 365),
                new SeedItem("NUOC-TUONG-CHINSU", "Nước tương Chinsu 500ml", giaVi, cai, thung,
                        bd("12500"), bd("21000"), 24, true, IMG_COOKING, bd("72"), bd("120"), "LOT-NTCS-2701", 365),
                new SeedItem("TUONG-OT-CHINSU", "Tương ớt Chinsu 250g", giaVi, cai, thung,
                        bd("8200"), bd("14500"), 36, true, IMG_COOKING, bd("96"), bd("144"), "LOT-TOCS-2701", 365),
                new SeedItem("HAT-NEM-KNORR-400", "Hạt nêm Knorr thịt thăn 400g", giaVi, goi, thung,
                        bd("29000"), bd("42000"), 18, true, IMG_COOKING, bd("48"), bd("84"), "LOT-KNORR-2701", 365),
                new SeedItem("DAU-SIMPLY-1L", "Dầu ăn Simply 1L", giaVi, cai, thung,
                        bd("42000"), bd("56000"), 20, true, IMG_COOKING, bd("72"), bd("120"), "LOT-DAU-2702", 365),
                new SeedItem("DAU-TUONG-SIMPLY-1L", "Dầu đậu nành Simply 1L", giaVi, cai, thung,
                        bd("44000"), bd("59000"), 18, true, IMG_COOKING, bd("64"), bd("108"), "LOT-DAU-SOY-2702", 365),
                new SeedItem("DAU-CAI-TUONG-AN-1L", "Dầu cải Tường An 1L", giaVi, cai, thung,
                        bd("39000"), bd("54000"), 18, true, IMG_COOKING, bd("58"), bd("96"), "LOT-DAU-TA-2702", 365),
                new SeedItem("BANH-OISHI", "Bánh Oishi tôm cay 40g", snack, goi, thung,
                        bd("4900"), bd("8000"), 72, true, IMG_SNACKS, bd("180"), bd("240"), "LOT-OI-2609", 120),
                new SeedItem("BANH-OISHI-BAP-NGOT", "Bánh Oishi bắp ngọt 40g", snack, goi, thung,
                        bd("4900"), bd("8000"), 72, true, IMG_SNACKS, bd("156"), bd("216"), "LOT-OI-BAP-2609", 120),
                new SeedItem("BANH-CHOCOPIE-12P", "Bánh ChocoPie Orion hộp 12 cái", snack, hop, thung,
                        bd("48200"), bd("69000"), 20, true, IMG_SNACKS, bd("76"), bd("96"), "LOT-CP-2607", 24),
                new SeedItem("BANH-CUSTAS-12P", "Bánh Custas Orion hộp 12 cái", snack, hop, thung,
                        bd("51500"), bd("72000"), 20, true, IMG_SNACKS, bd("64"), bd("90"), "LOT-CUSTAS-2608", 60),
                new SeedItem("KEO-ALPENLIEBE", "Kẹo Alpenliebe caramel túi 96g", snack, goi, thung,
                        bd("11800"), bd("18000"), 24, true, IMG_SNACKS, bd("104"), bd("144"), "LOT-ALP-2607", 28),
                new SeedItem("KEO-ALPENLIEBE-DAU", "Kẹo Alpenliebe dâu kem túi 96g", snack, goi, thung,
                        bd("11800"), bd("18000"), 24, true, IMG_SNACKS, bd("78"), bd("120"), "LOT-ALP-DAU-2607", 28),
                new SeedItem("SNACK-LAYS", "Snack Lay's Classic 56g", snack, goi, thung,
                        bd("11800"), bd("18000"), 48, true, IMG_SNACKS, bd("132"), bd("180"), "LOT-LY-2609", 120),
                new SeedItem("SNACK-LAYS-BBQ", "Snack Lay's vị BBQ 56g", snack, goi, thung,
                        bd("11900"), bd("18500"), 42, true, IMG_SNACKS, bd("108"), bd("168"), "LOT-LY-BBQ-2609", 120),
                new SeedItem("SNACK-POCA-MUC", "Snack Poca mực nướng 54g", snack, goi, thung,
                        bd("11200"), bd("17500"), 42, true, IMG_SNACKS, bd("96"), bd("144"), "LOT-POCA-MUC-2609", 120),
                new SeedItem("BOT-GIAT-OMO", "Bột giặt OMO Matic 2kg", veSinh, cai, cai,
                        bd("95500"), bd("129000"), 10, false, IMG_CLEANING, bd("28"), bd("48"), null, 0),
                new SeedItem("BOT-GIAT-OMO-FRONT-2KG", "Bột giặt OMO cửa trước 2kg", veSinh, cai, cai,
                        bd("98500"), bd("135000"), 10, false, IMG_CLEANING, bd("22"), bd("42"), null, 0),
                new SeedItem("SUNLIGHT-CHANH-750", "Nước rửa chén Sunlight chanh 750g", veSinh, cai, thung,
                        bd("24500"), bd("36000"), 18, false, IMG_CLEANING, bd("54"), bd("84"), null, 0),
                new SeedItem("COMFORT-800", "Nước xả Comfort hương ban mai 800ml", veSinh, cai, thung,
                        bd("38500"), bd("56000"), 16, false, IMG_CLEANING, bd("44"), bd("72"), null, 0),
                new SeedItem("LIFEBUOY-HANDWASH-450", "Nước rửa tay Lifebuoy 450g", veSinh, cai, thung,
                        bd("33500"), bd("49000"), 18, false, IMG_CLEANING, bd("38"), bd("60"), null, 0),
                new SeedItem("KDR-PS-180", "Kem đánh răng P/S 180g", chamSoc, cai, thung,
                        bd("22500"), bd("36000"), 24, true, IMG_PERSONAL_CARE, bd("68"), bd("120"), "LOT-PS-2703", 420),
                new SeedItem("KDR-PS-MUOI-180", "Kem đánh răng P/S muối hồng 180g", chamSoc, cai, thung,
                        bd("23500"), bd("38000"), 20, true, IMG_PERSONAL_CARE, bd("52"), bd("96"), "LOT-PS-MUOI-2703", 420),
                new SeedItem("KDR-COLGATE-180", "Kem đánh răng Colgate Total 180g", chamSoc, cai, thung,
                        bd("25500"), bd("42000"), 20, true, IMG_PERSONAL_CARE, bd("46"), bd("84"), "LOT-COL-2703", 420),
                new SeedItem("DAU-GOI-CLEAR-630", "Dầu gội Clear bạc hà 630g", chamSoc, cai, thung,
                        bd("118000"), bd("165000"), 8, false, IMG_PERSONAL_CARE, bd("18"), bd("36"), null, 0),
                new SeedItem("SUA-TAM-LIFEBUOY-850", "Sữa tắm Lifebuoy bảo vệ 850g", chamSoc, cai, thung,
                        bd("92000"), bd("135000"), 8, false, IMG_PERSONAL_CARE, bd("20"), bd("36"), null, 0)
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
        seedPromotionDemoData();

        log.info("Demo catalog ready: {} Vietnamese retail SKUs with real-photo URLs, stock, customers, alerts and AI promo scenarios", upserted);
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
        seedAlert("SUA-CHUA-TH-LOC4", "NEAR_EXPIRY", "WARNING",
                "Sữa chua TH còn 8 ngày hết hạn nhưng tồn quầy cao, nên chạy combo giờ vàng.");
        seedAlert("BANH-FLAN-4H", "NEAR_EXPIRY", "CRITICAL",
                "Bánh flan còn 6 ngày hết hạn, cần ưu tiên xả hàng trong tuần này.");
        seedAlert("BANH-CHOCOPIE-12P", "NEAR_EXPIRY", "WARNING",
                "ChocoPie còn 24 ngày hết hạn, tồn quầy cao hơn tốc độ bán trung bình.");
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

    private void seedPromotionDemoData() {
        Promotion weekendDairy = upsertPromotion(
                "Xả hàng sữa chua cận date",
                "DAIRYFLASH20",
                "PERCENTAGE",
                bd("20"),
                BigDecimal.ZERO,
                LocalDate.now().minusDays(2),
                LocalDate.now().plusDays(12),
                true
        );
        upsertPromotion(
                "Combo đồ uống hè",
                "DRINKCOMBO15",
                "PERCENTAGE",
                bd("15"),
                bd("50000"),
                LocalDate.now().minusDays(7),
                LocalDate.now().plusDays(30),
                true
        );
        upsertPromotion(
                "Giảm 30k đơn hàng gia đình",
                "FAMILY30K",
                "FIXED_AMOUNT",
                bd("30000"),
                bd("300000"),
                LocalDate.now().minusDays(7),
                LocalDate.now().plusDays(45),
                true
        );

        seedPromotionRecommendation("SUA-CHUA-TH-LOC4", bd("20"),
                "Cận hạn 8 ngày, tồn quầy 86 lốc; đề xuất giảm 20% trong 7 ngày, đặt tại tủ mát đầu quầy.",
                "APPROVED", weekendDairy);
        seedPromotionRecommendation("BANH-FLAN-4H", bd("25"),
                "Còn 6 ngày hết hạn, biên lợi nhuận vẫn đủ; đề xuất giảm 25% và bán kèm sữa tươi buổi chiều.",
                "PENDING", null);
        seedPromotionRecommendation("PHO-MAI-BELCUBE", bd("18"),
                "Tồn 44 hộp, hạn còn 18 ngày; đề xuất giảm 18% cho khách mua kèm bánh mì/sữa.",
                "PENDING", null);
        seedPromotionRecommendation("BANH-CHOCOPIE-12P", bd("12"),
                "Hàng bánh hộp còn 24 ngày, tốc độ bán chậm hơn tồn kho; đề xuất giảm 12% cuối tuần.",
                "PENDING", null);
        seedPromotionRecommendation("COCA-330", bd("10"),
                "Tồn đồ uống cao, không cận hạn; đề xuất giảm 10% theo combo 6 lon để tăng vòng quay tồn kho.",
                "PENDING", null);

        seedForecast("SUA-CHUA-TH-LOC4", bd("38"), bd("72"), bd("116"), "XGBOOST_DEMO", bd("0.86"));
        seedForecast("BANH-FLAN-4H", bd("21"), bd("39"), bd("65"), "XGBOOST_DEMO", bd("0.82"));
        seedForecast("PHO-MAI-BELCUBE", bd("18"), bd("32"), bd("54"), "XGBOOST_DEMO", bd("0.80"));
        seedForecast("BANH-CHOCOPIE-12P", bd("28"), bd("56"), bd("94"), "MOVING_AVERAGE_DEMO", bd("0.78"));
        seedForecast("COCA-330", bd("96"), bd("188"), bd("420"), "XGBOOST_DEMO", bd("0.88"));

        seedReorderRecommendation("REDBULL-250", bd("96"), bd("14"), bd("58"), bd("120"), "HIGH",
                "SKU bán nhanh nhưng tồn quầy thấp; nên nhập thêm trước cuối tuần.");
        seedReorderRecommendation("GAO-ST25-5KG", bd("40"), bd("52"), bd("36"), bd("70"), "MEDIUM",
                "Gạo ST25 có nhu cầu ổn định, đề xuất bù kho vừa phải để tránh thiếu hàng.");
    }

    private Promotion upsertPromotion(
            String name,
            String code,
            String type,
            BigDecimal value,
            BigDecimal minOrder,
            LocalDate startDate,
            LocalDate endDate,
            boolean active
    ) {
        Promotion promotion = promotionRepository.findByCodeIgnoreCase(code)
                .orElseGet(() -> Promotion.builder().code(code).build());
        promotion.setName(name);
        promotion.setType(type);
        promotion.setValue(value);
        promotion.setMinOrder(minOrder);
        promotion.setStartDate(startDate);
        promotion.setEndDate(endDate);
        promotion.setActive(active);
        return promotionRepository.save(promotion);
    }

    private void seedPromotionRecommendation(
            String itemCode,
            BigDecimal discountPercent,
            String reason,
            String status,
            Promotion promotion
    ) {
        itemRepository.findByItemCode(itemCode).ifPresent(item -> {
            boolean exists = promotionRecommendationRepository.findAll().stream()
                    .anyMatch(rec -> rec.getItem().getId().equals(item.getId())
                            && discountPercent.compareTo(rec.getDiscountPercent()) == 0
                            && status.equals(rec.getStatus()));
            if (exists) {
                return;
            }
            PromotionRecommendation recommendation = PromotionRecommendation.builder()
                    .item(item)
                    .discountPercent(discountPercent)
                    .reason(reason)
                    .status(status)
                    .promotionId(promotion != null ? promotion.getId() : null)
                    .promotionCode(promotion != null ? promotion.getCode() : null)
                    .build();
            promotionRecommendationRepository.save(recommendation);
        });
    }

    private void seedForecast(
            String itemCode,
            BigDecimal predicted7d,
            BigDecimal predicted14d,
            BigDecimal predicted30d,
            String modelType,
            BigDecimal confidence
    ) {
        itemRepository.findByItemCode(itemCode).ifPresent(item -> {
            if (!forecastResultRepository.findByItemIdOrderByForecastDateDesc(item.getId()).isEmpty()) {
                return;
            }
            forecastResultRepository.save(ForecastResult.builder()
                    .item(item)
                    .forecastDate(LocalDateTime.now())
                    .predictedQuantity(predicted30d)
                    .horizonDays(30)
                    .predictedQty7d(predicted7d)
                    .predictedQty14d(predicted14d)
                    .predictedQty30d(predicted30d)
                    .confidenceLevel(confidence)
                    .confidenceLow(predicted30d.multiply(bd("0.85")))
                    .confidenceHigh(predicted30d.multiply(bd("1.15")))
                    .modelType(modelType)
                    .createdAt(LocalDateTime.now())
                    .build());
        });
    }

    private void seedReorderRecommendation(
            String itemCode,
            BigDecimal suggestedQty,
            BigDecimal currentAvailable,
            BigDecimal predicted7d,
            BigDecimal predicted14d,
            String riskLevel,
            String reason
    ) {
        itemRepository.findByItemCode(itemCode).ifPresent(item -> {
            boolean exists = reorderRecommendationRepository.findAll().stream()
                    .anyMatch(rec -> rec.getItem().getId().equals(item.getId()) && "ACTIVE".equals(rec.getStatus()));
            if (exists) {
                return;
            }
            reorderRecommendationRepository.save(ReorderRecommendation.builder()
                    .item(item)
                    .suggestedQty(suggestedQty)
                    .currentAvailable(currentAvailable)
                    .predictedDemand7d(predicted7d)
                    .predictedDemand14d(predicted14d)
                    .riskLevel(riskLevel)
                    .reason(reason)
                    .source("DEMO_REALISTIC")
                    .status("ACTIVE")
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
