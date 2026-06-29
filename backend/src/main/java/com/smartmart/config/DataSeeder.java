package com.smartmart.config;

import com.smartmart.entity.*;
import com.smartmart.enums.Role;
import com.smartmart.enums.UserStatus;
import com.smartmart.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Component
@Profile({"local", "prod", "test"})
@Order(1)
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final UomRepository uomRepository;
    private final SupplierRepository supplierRepository;
    private final LocationRepository locationRepository;
    private final ItemRepository itemRepository;
    private final ItemLotRepository itemLotRepository;
    private final CurrentInventoryRepository currentInventoryRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(
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
        if (userRepository.count() == 0) {
            seedUsers();
        }

        if (uomRepository.count() == 0) {
            seedMasterAndInventory();
        }

        normalizeUomCategories();
    }

    private void seedUsers() {
        userRepository.saveAll(List.of(
                User.builder()
                        .username("admin")
                        .password(passwordEncoder.encode("admin123"))
                        .email("admin@smartmart.com")
                        .fullName("Quản trị viên")
                        .role(Role.ROLE_ADMIN)
                        .status(UserStatus.ACTIVE)
                        .build(),

                User.builder()
                        .username("staff")
                        .password(passwordEncoder.encode("staff123"))
                        .email("staff@smartmart.com")
                        .fullName("Thu ngân")
                        .role(Role.ROLE_STAFF)
                        .status(UserStatus.ACTIVE)
                        .build(),

                User.builder()
                        .username("warehouse")
                        .password(passwordEncoder.encode("warehouse123"))
                        .email("warehouse@smartmart.com")
                        .fullName("Nhân viên kho")
                        .role(Role.ROLE_WAREHOUSE)
                        .status(UserStatus.ACTIVE)
                        .build()
        ));
    }

    private void seedMasterAndInventory() {
        Uom cai = createSelfConversionUom("Cái", "Bán lẻ");
        Uom thung24Cai = createConversionUom("Thùng 24 cái", "Đóng gói", new BigDecimal("24"), cai);

        Category doUong = categoryRepository.save(Category.builder()
                .categoryName("Đồ uống")
                .active(true)
                .imageUrl("/media/categories/do-uong.svg")
                .build());

        Supplier vinamilk = supplierRepository.save(Supplier.builder()
                .supplierName("Vinamilk")
                .phone("1900")
                .active(true)
                .build());

        Location khoBan = locationRepository.save(Location.builder()
                .locationName("Kho bán")
                .locationType("STORE")
                .active(true)
                .build());

        Item sua = itemRepository.save(Item.builder()
                .itemCode("MILK-VNM-1L")
                .itemName("Sữa Vinamilk 1L")
                .category(doUong)
                .baseUom(cai)
                .purchaseUom(thung24Cai)
                .purchaseConversionRatio(thung24Cai.getConversionRatio())
                .costPrice(new BigDecimal("25000"))
                .sellingPrice(new BigDecimal("32000"))
                .minimumStock(20)
                .hasExpiry(true)
                .active(true)
                .imageUrl("/media/items/milk-vnm-1l.svg")
                .build());

        Item nuoc = itemRepository.save(Item.builder()
                .itemCode("LAVIE-500")
                .itemName("Nước Lavie 500ml")
                .category(doUong)
                .baseUom(cai)
                .purchaseUom(cai)
                .purchaseConversionRatio(cai.getConversionRatio())
                .costPrice(new BigDecimal("5000"))
                .sellingPrice(new BigDecimal("7000"))
                .minimumStock(50)
                .hasExpiry(false)
                .active(true)
                .imageUrl("/media/items/lavie-500.svg")
                .build());

        ItemLot lotSua = itemLotRepository.save(ItemLot.builder()
                .item(sua)
                .lotNumber("LOT-MILK-001")
                .expiryDate(LocalDate.now().plusMonths(3))
                .build());

        currentInventoryRepository.save(CurrentInventory.builder()
                .item(sua)
                .location(khoBan)
                .lot(lotSua)
                .quantity(new BigDecimal("120"))
                .reservedQuantity(BigDecimal.ZERO)
                .build());

        currentInventoryRepository.save(CurrentInventory.builder()
                .item(nuoc)
                .location(khoBan)
                .lot(null)
                .quantity(new BigDecimal("500"))
                .reservedQuantity(BigDecimal.ZERO)
                .build());
    }

    private Uom createSelfConversionUom(String name, String category) {
        Uom saved = uomRepository.save(Uom.builder()
                .uomName(name)
                .category(category)
                .conversionRatio(BigDecimal.ONE)
                .active(true)
                .build());

        saved.setConversionUom(saved);
        return uomRepository.save(saved);
    }

    private Uom createConversionUom(String name, String category, BigDecimal conversionRatio, Uom conversionUom) {
        return uomRepository.save(Uom.builder()
                .uomName(name)
                .category(category)
                .conversionRatio(conversionRatio)
                .conversionUom(conversionUom)
                .active(true)
                .build());
    }
    private void normalizeUomCategories() {
        uomRepository.findAll().forEach(uom -> {
            String category = uom.getCategory();

            if (category == null || category.isBlank()) {
                return;
            }

            if (List.of("COUNT", "WEIGHT", "VOLUME", "LENGTH", "OTHER").contains(category)) {
                uom.setCategory("Bán lẻ");
                uomRepository.save(uom);
            }

            if ("PACKAGE".equals(category)) {
                uom.setCategory("Đóng gói");
                uomRepository.save(uom);
            }
        });
    }
}