package com.smartmart.service.impl;

import com.smartmart.dto.request.CreateCustomerRequest;
import com.smartmart.dto.request.UpdateCustomerRequest;
import com.smartmart.dto.response.CustomerResponse;
import com.smartmart.entity.Customer;
import com.smartmart.exception.BadRequestException;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.CustomerRepository;
import com.smartmart.service.CustomerService;
import com.smartmart.service.SettingService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@Transactional
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepository;
    private final SettingService settingService;

    public CustomerServiceImpl(CustomerRepository customerRepository, SettingService settingService) {
        this.customerRepository = customerRepository;
        this.settingService = settingService;
    }

    @Transactional(readOnly = true)
    @Override
    public List<CustomerResponse> search(String phone, String q) {
        if (phone != null && !phone.isBlank()) {
            return customerRepository.findByPhone(normalizePhone(phone))
                    .map(c -> List.of(toResponse(c)))
                    .orElse(List.of());
        }
        if (q != null && !q.isBlank()) {
            return customerRepository.findByFullNameContainingIgnoreCaseOrPhoneContaining(q.trim(), q.trim())
                    .stream().map(this::toResponse).toList();
        }
        return customerRepository.findTop50ByOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    @Override
    public CustomerResponse getById(Long id) {
        return toResponse(findCustomer(id));
    }

    @Transactional(readOnly = true)
    @Override
    public CustomerResponse getByPhone(String phone) {
        return toResponse(customerRepository.findByPhone(normalizePhone(phone))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy khách hàng với SĐT này")));
    }

    @Override
    public CustomerResponse create(CreateCustomerRequest request) {
        String phone = normalizePhone(request.getPhone());
        if (customerRepository.findByPhone(phone).isPresent()) {
            throw new BadRequestException("Số điện thoại đã tồn tại");
        }
        Customer saved = customerRepository.save(Customer.builder()
                .fullName(request.getFullName().trim())
                .phone(phone)
                .email(request.getEmail())
                .loyaltyPoints(0)
                .tier("REGULAR")
                .build());
        return toResponse(saved);
    }

    @Override
    public CustomerResponse update(Long id, UpdateCustomerRequest request) {
        Customer customer = findCustomer(id);
        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            customer.setFullName(request.getFullName().trim());
        }
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            String phone = normalizePhone(request.getPhone());
            customerRepository.findByPhone(phone).ifPresent(existing -> {
                if (!existing.getId().equals(id)) {
                    throw new BadRequestException("Số điện thoại đã được sử dụng");
                }
            });
            customer.setPhone(phone);
        }
        if (request.getEmail() != null) {
            customer.setEmail(request.getEmail());
        }
        return toResponse(customer);
    }

    @Override
    public Customer findOrCreateByPhone(String phone, String fullName) {
        if (phone == null || phone.isBlank()) {
            return null;
        }
        String normalized = normalizePhone(phone);
        return customerRepository.findByPhone(normalized).orElseGet(() -> {
            String name = (fullName != null && !fullName.isBlank()) ? fullName.trim() : "Khách lẻ";
            return customerRepository.save(Customer.builder()
                    .fullName(name)
                    .phone(normalized)
                    .loyaltyPoints(0)
                    .tier("REGULAR")
                    .build());
        });
    }

    @Override
    public void awardPoints(Long customerId, BigDecimal orderTotalVnd) {
        if (customerId == null || orderTotalVnd == null) {
            return;
        }
        Customer customer = findCustomer(customerId);
        int pointRate = settingService.getIntValue("LOYALTY_POINT_RATE", 1000);
        if (pointRate <= 0) {
            pointRate = 1000;
        }
        int earned = orderTotalVnd.divide(BigDecimal.valueOf(pointRate), 0, RoundingMode.DOWN).intValue();
        if (earned <= 0) {
            return;
        }
        int newPoints = customer.getLoyaltyPoints() + earned;
        customer.setLoyaltyPoints(newPoints);
        customer.setTier(resolveTier(newPoints));
    }

    private Customer findCustomer(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy khách hàng"));
    }

    private String resolveTier(int points) {
        int gold = settingService.getIntValue("LOYALTY_GOLD_THRESHOLD", 2000);
        int silver = settingService.getIntValue("LOYALTY_SILVER_THRESHOLD", 500);
        if (points >= gold) {
            return "GOLD";
        }
        if (points >= silver) {
            return "SILVER";
        }
        return "REGULAR";
    }

    private String normalizePhone(String phone) {
        return phone.replaceAll("[^0-9+]", "").trim();
    }

    private CustomerResponse toResponse(Customer customer) {
        return CustomerResponse.builder()
                .id(customer.getId())
                .fullName(customer.getFullName())
                .phone(customer.getPhone())
                .email(customer.getEmail())
                .loyaltyPoints(customer.getLoyaltyPoints())
                .tier(customer.getTier())
                .createdAt(customer.getCreatedAt())
                .build();
    }
}
