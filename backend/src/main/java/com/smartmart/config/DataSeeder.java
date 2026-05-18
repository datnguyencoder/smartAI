package com.smartmart.config;

import com.smartmart.enums.ProductStatus;
import com.smartmart.enums.Role;
import com.smartmart.enums.UserStatus;
import com.smartmart.model.Category;
import com.smartmart.model.Product;
import com.smartmart.model.Supplier;
import com.smartmart.model.User;
import com.smartmart.repository.CategoryRepository;
import com.smartmart.repository.ProductRepository;
import com.smartmart.repository.SupplierRepository;
import com.smartmart.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(
            UserRepository userRepository,
            CategoryRepository categoryRepository,
            SupplierRepository supplierRepository,
            ProductRepository productRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.supplierRepository = supplierRepository;
        this.productRepository = productRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            seedUsers();
        }
        if (categoryRepository.count() == 0) {
            seedCategories();
        }
        if (supplierRepository.count() == 0) {
            seedSuppliers();
        }
        if (productRepository.count() == 0 && categoryRepository.count() > 0 && supplierRepository.count() > 0) {
            seedProducts();
        }
    }

    private void seedUsers() {
        User admin = User.builder()
                .username("admin")
                .password(passwordEncoder.encode("admin123"))
                .email("admin@smartmart.com")
                .fullName("Quản trị viên Hệ thống")
                .role(Role.ROLE_ADMIN)
                .status(UserStatus.ACTIVE)
                .build();

        User staff = User.builder()
                .username("staff")
                .password(passwordEncoder.encode("staff123"))
                .email("staff@smartmart.com")
                .fullName("Nhân viên Bán hàng")
                .role(Role.ROLE_STAFF)
                .status(UserStatus.ACTIVE)
                .build();

        userRepository.saveAll(List.of(admin, staff));
    }

    private void seedCategories() {
        Category electronics = Category.builder()
                .name("Đồ điện tử")
                .description("Điện thoại, máy tính, phụ kiện công nghệ")
                .build();

        Category food = Category.builder()
                .name("Thực phẩm")
                .description("Đồ ăn, thức uống, thực phẩm đóng hộp và tươi sống")
                .build();

        Category household = Category.builder()
                .name("Đồ gia dụng")
                .description("Thiết bị nhà bếp, đồ dùng gia đình")
                .build();

        categoryRepository.saveAll(List.of(electronics, food, household));
    }

    private void seedSuppliers() {
        Supplier electronicsSupplier = Supplier.builder()
                .name("Công ty Cổ phần Bán lẻ Điện máy Việt Nam")
                .contactName("Nguyễn Văn A")
                .email("contact@dienmay.com")
                .phone("0987654321")
                .address("123 Đường Lớn, Hà Nội")
                .build();

        Supplier foodSupplier = Supplier.builder()
                .name("Nhà phân phối Thực phẩm Sạch Toàn Quốc")
                .contactName("Trần Thị B")
                .email("sales@thucphamsach.com")
                .phone("0912345678")
                .address("456 Đường Sạch, TP. Hồ Chí Minh")
                .build();

        supplierRepository.saveAll(List.of(electronicsSupplier, foodSupplier));
    }

    private void seedProducts() {
        Category electronics = categoryRepository.findByName("Đồ điện tử").orElse(null);
        Category food = categoryRepository.findByName("Thực phẩm").orElse(null);

        Supplier elecSupplier = supplierRepository.findByName("Công ty Cổ phần Bán lẻ Điện máy Việt Nam").orElse(null);
        Supplier fdSupplier = supplierRepository.findByName("Nhà phân phối Thực phẩm Sạch Toàn Quốc").orElse(null);

        if (electronics != null && elecSupplier != null) {
            Product iphone = Product.builder()
                    .code("PROD-IP15")
                    .name("Điện thoại iPhone 15 Pro Max")
                    .description("Apple iPhone 15 Pro Max 256GB chính hãng")
                    .price(new BigDecimal("34990000"))
                    .costPrice(new BigDecimal("29000000"))
                    .quantity(50)
                    .minimumStock(10)
                    .maximumStock(100)
                    .sku("SKU-IPHONE15PM-256")
                    .status(ProductStatus.ACTIVE)
                    .category(electronics)
                    .supplier(elecSupplier)
                    .build();
            productRepository.save(iphone);
        }

        if (food != null && fdSupplier != null) {
            Product milk = Product.builder()
                    .code("PROD-MILK")
                    .name("Sữa tươi tiệt trùng Vinamilk")
                    .description("Sữa tươi tiệt trùng Vinamilk ít đường 1L")
                    .price(new BigDecimal("32000"))
                    .costPrice(new BigDecimal("25000"))
                    .quantity(500)
                    .minimumStock(50)
                    .maximumStock(1000)
                    .sku("SKU-VINAMILK-1L")
                    .status(ProductStatus.ACTIVE)
                    .category(food)
                    .supplier(fdSupplier)
                    .build();
            productRepository.save(milk);
        }
    }
}
