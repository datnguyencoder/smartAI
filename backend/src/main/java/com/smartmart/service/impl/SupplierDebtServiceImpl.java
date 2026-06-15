package com.smartmart.service.impl;

import com.smartmart.constant.AuditAction;
import com.smartmart.dto.request.CreateDebtPaymentRequest;
import com.smartmart.entity.DebtPayment;
import com.smartmart.entity.PurchaseOrder;
import com.smartmart.entity.SupplierDebt;
import com.smartmart.enums.SupplierDebtStatus;
import com.smartmart.exception.BadRequestException;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.PurchaseOrderRepository;
import com.smartmart.repository.SupplierDebtRepository;
import com.smartmart.security.SecurityUtils;
import com.smartmart.service.AuditLogService;
import com.smartmart.service.SupplierDebtService;
import com.smartmart.util.AuditData;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class SupplierDebtServiceImpl implements SupplierDebtService {

    private final SupplierDebtRepository supplierDebtRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final AuditLogService auditLogService;

    public SupplierDebtServiceImpl(
            SupplierDebtRepository supplierDebtRepository,
            PurchaseOrderRepository purchaseOrderRepository,
            AuditLogService auditLogService
    ) {
        this.supplierDebtRepository = supplierDebtRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.auditLogService = auditLogService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<SupplierDebt> listAll(SupplierDebtStatus status) {
        if (status != null) {
            return supplierDebtRepository.findByStatusOrderByIdDesc(status);
        }
        return supplierDebtRepository.findAllByOrderByIdDesc();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SupplierDebt> listBySupplier(Long supplierId) {
        return supplierDebtRepository.findBySupplierIdOrderByIdDesc(supplierId);
    }

    @Override
    @Transactional(readOnly = true)
    public SupplierDebt findById(Long id) {
        return supplierDebtRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy công nợ"));
    }

    @Override
    public SupplierDebt recordPayment(Long debtId, CreateDebtPaymentRequest request) {
        SupplierDebt debt = findById(debtId);
        if (debt.getStatus() == SupplierDebtStatus.PAID) {
            throw new BadRequestException("Công nợ đã được thanh toán đủ");
        }

        BigDecimal remaining = debt.getAmount().subtract(debt.getPaidAmount());
        if (request.getAmount().compareTo(remaining) > 0) {
            throw new BadRequestException("Số tiền thanh toán vượt quá số nợ còn lại");
        }

        DebtPayment payment = DebtPayment.builder()
                .supplierDebt(debt)
                .amount(request.getAmount())
                .paymentDate(LocalDateTime.now())
                .paymentMethod(request.getPaymentMethod())
                .note(request.getNote())
                .createdBy(SecurityUtils.getCurrentUserId().orElse(null))
                .createdAt(LocalDateTime.now())
                .build();
        debt.getPayments().add(payment);

        BigDecimal newPaid = debt.getPaidAmount().add(request.getAmount());
        debt.setPaidAmount(newPaid);
        if (newPaid.compareTo(debt.getAmount()) >= 0) {
            debt.setStatus(SupplierDebtStatus.PAID);
        } else {
            debt.setStatus(SupplierDebtStatus.PARTIAL);
        }

        SupplierDebt saved = supplierDebtRepository.save(debt);
        auditLogService.log(
                AuditAction.DEBT_PAYMENT,
                "SUPPLIER_DEBT",
                saved.getId().toString(),
                "Thanh toán công nợ #" + saved.getId(),
                AuditData.of("paidAmount", debt.getPaidAmount().subtract(request.getAmount())),
                AuditData.of("paidAmount", saved.getPaidAmount(), "status", saved.getStatus())
        );
        return saved;
    }

    @Override
    public SupplierDebt createFromPurchaseOrder(Long purchaseOrderId, LocalDate dueDate) {
        if (supplierDebtRepository.existsByPurchaseOrderId(purchaseOrderId)) {
            throw new BadRequestException("Công nợ cho phiếu nhập này đã tồn tại");
        }
        PurchaseOrder po = purchaseOrderRepository.findByIdWithDetails(purchaseOrderId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy phiếu nhập"));

        SupplierDebt debt = SupplierDebt.builder()
                .supplier(po.getSupplier())
                .purchaseOrder(po)
                .amount(po.getTotalAmount())
                .paidAmount(BigDecimal.ZERO)
                .dueDate(dueDate)
                .status(SupplierDebtStatus.UNPAID)
                .note("Công nợ từ phiếu nhập #" + po.getId())
                .build();

        return supplierDebtRepository.save(debt);
    }
}
