package com.smartmart.service.impl;

import com.smartmart.exception.NotFoundException;
import com.smartmart.model.Category;
import com.smartmart.model.Product;
import com.smartmart.model.Supplier;
import com.smartmart.repository.CategoryRepository;
import com.smartmart.repository.ProductRepository;
import com.smartmart.repository.SupplierRepository;
import com.smartmart.service.ProductService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;

    public ProductServiceImpl(
            ProductRepository productRepository,
            CategoryRepository categoryRepository,
            SupplierRepository supplierRepository
    ) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.supplierRepository = supplierRepository;
    }

    @Override
    public Product createProduct(Product product, UUID categoryId, UUID supplierId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy danh mục"));
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy nhà cung cấp"));

        product.setCategory(category);
        product.setSupplier(supplier);
        return productRepository.save(product);
    }

    @Override
    @Transactional(readOnly = true)
    public Product getProductById(UUID id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy sản phẩm với ID: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Product> getAllProducts(Pageable pageable) {
        return productRepository.findAll(pageable);
    }

    @Override
    public Product updateProduct(UUID id, Product productDetails) {
        Product product = getProductById(id);

        product.setName(productDetails.getName());
        product.setDescription(productDetails.getDescription());
        product.setPrice(productDetails.getPrice());
        product.setCostPrice(productDetails.getCostPrice());
        product.setMinimumStock(productDetails.getMinimumStock());
        product.setMaximumStock(productDetails.getMaximumStock());
        product.setStatus(productDetails.getStatus());

        return productRepository.save(product);
    }

    @Override
    public void deleteProduct(UUID id) {
        Product product = getProductById(id);
        productRepository.delete(product);
    }

    @Override
    public Product adjustStock(UUID id, Integer quantity, String reason) {
        Product product = getProductById(id);
        int newQty = product.getQuantity() + quantity;
        if (newQty < 0) {
            throw new IllegalArgumentException("Số lượng tồn kho không thể âm");
        }
        product.setQuantity(newQty);
        return productRepository.save(product);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Product> getLowStockProducts() {
        return productRepository.findLowStockProducts();
    }
}
