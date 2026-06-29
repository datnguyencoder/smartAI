package com.smartmart.service.impl;

import com.smartmart.constant.AuditAction;
import com.smartmart.dto.request.CreateDebtPaymentRequest;
import com.smartmart.dto.response.CustomerDebtPaymentResponse;
import com.smartmart.dto.response.CustomerDebtResponse;
import com.smartmart.entity.Customer;
import com.smartmart.entity.CustomerDebt;
import com.smartmart.entity.CustomerDebtPayment;
import com.smartmart.entity.Order;
import com.smartmart.enums.CustomerDebtStatus;
import com.smartmart.exception.BadRequestException;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.CustomerDebtRepository;
import com.smartmart.security.SecurityUtils;
import com.smartmart.service.AuditLogService;
import com.smartmart.service.CustomerDebtService;
import com.smartmart.util.AuditData;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class CustomerDebtServiceImpl implements CustomerDebtService {
    private final CustomerDebtRepository customerDebtRepository;
    private final AuditLogService auditLogService;

    public CustomerDebtServiceImpl(CustomerDebtRepository customerDebtRepository, AuditLogService auditLogService) {
        this.customerDebtRepository = customerDebtRepository;
        this.auditLogService = auditLogService;
    }

    @Override
    public CustomerDebt createFromOrder(Order order, Customer customer) {
        if (customerDebtRepository.existsByOrderId(order.getId())) {
            throw new BadRequestException("Công nợ cho hóa đơn này đã tồn tại");
        }
        CustomerDebt debt = CustomerDebt.builder()
                .customer(customer)
                .order(order)
                .amount(order.getTotalAmount())
                .paidAmount(BigDecimal.ZERO)
                .dueDate(LocalDate.now().plusDays(30))
                .status(CustomerDebtStatus.UNPAID)
                .note("Công nợ từ hóa đơn " + order.getOrderCode())
                .build();
        CustomerDebt saved = customerDebtRepository.save(debt);
        auditLogService.log(AuditAction.DEBT_CREATE, "CUSTOMER_DEBT", saved.getId().toString(),
                "Tạo công nợ khách từ hóa đơn " + order.getOrderCode(),
                null,
                AuditData.of("orderId", order.getId(), "customerId", customer.getId(), "amount", saved.getAmount()));
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomerDebtResponse> listAll(CustomerDebtStatus status) {
        List<CustomerDebt> debts = status != null
                ? customerDebtRepository.findByStatusOrderByIdDesc(status)
                : customerDebtRepository.findAllByOrderByIdDesc();
        return debts.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomerDebtResponse> listByCustomer(Long customerId) {
        return customerDebtRepository.findByCustomerIdOrderByIdDesc(customerId).stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerDebtResponse getById(Long id) {
        return toResponse(findDebt(id));
    }

    @Override
    public CustomerDebtResponse recordPayment(Long id, CreateDebtPaymentRequest request) {
        CustomerDebt debt = findDebt(id);
        refreshStatus(debt);
        if (debt.getStatus() == CustomerDebtStatus.PAID) {
            throw new BadRequestException("Công nợ đã được thanh toán đủ");
        }
        BigDecimal remaining = debt.getAmount().subtract(debt.getPaidAmount());
        if (request.getAmount().compareTo(remaining) > 0) {
            throw new BadRequestException("Số tiền thanh toán vượt quá số nợ còn lại");
        }
        debt.getPayments().add(CustomerDebtPayment.builder()
                .customerDebt(debt)
                .amount(request.getAmount())
                .paymentDate(LocalDateTime.now())
                .paymentMethod(request.getPaymentMethod())
                .note(request.getNote())
                .createdBy(SecurityUtils.getCurrentUserId().orElse(null))
                .createdAt(LocalDateTime.now())
                .build());
        BigDecimal beforePaid = debt.getPaidAmount();
        debt.setPaidAmount(beforePaid.add(request.getAmount()));
        updateStatusAfterPayment(debt);
        CustomerDebt saved = customerDebtRepository.save(debt);
        auditLogService.log(AuditAction.DEBT_PAYMENT, "CUSTOMER_DEBT", saved.getId().toString(),
                "Thanh toán công nợ khách #" + saved.getId(),
                AuditData.of("paidAmount", beforePaid),
                AuditData.of("paidAmount", saved.getPaidAmount(), "status", saved.getStatus()));
        return toResponse(saved);
    }

    private CustomerDebt findDebt(Long id) {
        return customerDebtRepository.findWithDetailsById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy công nợ khách"));
    }

    private void refreshStatus(CustomerDebt debt) {
        if (debt.getStatus() == CustomerDebtStatus.PAID) return;
        if (debt.getDueDate() != null && debt.getDueDate().isBefore(LocalDate.now())) {
            debt.setStatus(CustomerDebtStatus.OVERDUE);
        } else if (debt.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
            debt.setStatus(CustomerDebtStatus.PARTIAL);
        } else {
            debt.setStatus(CustomerDebtStatus.UNPAID);
        }
    }

    private void updateStatusAfterPayment(CustomerDebt debt) {
        if (debt.getPaidAmount().compareTo(debt.getAmount()) >= 0) {
            debt.setStatus(CustomerDebtStatus.PAID);
        } else {
            refreshStatus(debt);
        }
    }

    private CustomerDebtResponse toResponse(CustomerDebt debt) {
        BigDecimal remaining = debt.getAmount().subtract(debt.getPaidAmount());
        return CustomerDebtResponse.builder()
                .id(debt.getId())
                .customerId(debt.getCustomer().getId())
                .customerName(debt.getCustomer().getFullName())
                .customerPhone(debt.getCustomer().getPhone())
                .orderId(debt.getOrder().getId())
                .orderCode(debt.getOrder().getOrderCode())
                .amount(debt.getAmount())
                .paidAmount(debt.getPaidAmount())
                .remainingAmount(remaining)
                .dueDate(debt.getDueDate())
                .status(debt.getStatus())
                .note(debt.getNote())
                .createdAt(debt.getCreatedAt())
                .payments(debt.getPayments().stream().map(payment -> CustomerDebtPaymentResponse.builder()
                        .id(payment.getId())
                        .amount(payment.getAmount())
                        .paymentDate(payment.getPaymentDate())
                        .paymentMethod(payment.getPaymentMethod())
                        .note(payment.getNote())
                        .build()).toList())
                .build();
    }
}
