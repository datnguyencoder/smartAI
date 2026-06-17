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
    public List<SupplierDebt> listAll(SupplierDebtStatus status) {
        refreshOverdueDebts();
        if (status != null) {
            return supplierDebtRepository.findByStatusOrderByIdDesc(status);
        }
        return supplierDebtRepository.findAllByOrderByIdDesc();
    }

    @Override
    public List<SupplierDebt> listBySupplier(Long supplierId) {
        refreshOverdueDebts();
        return supplierDebtRepository.findBySupplierIdOrderByIdDesc(supplierId);
    }

    @Override
    public SupplierDebt findById(Long id) {
        refreshOverdueDebts();
        return supplierDebtRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy công nợ"));
    }

    @Override
    public SupplierDebt recordPayment(Long debtId, CreateDebtPaymentRequest request) {
        SupplierDebt debt = findById(debtId);
        refreshStatus(debt);
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
        updateStatusAfterPayment(debt, newPaid);

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
                .dueDate(dueDate != null ? dueDate : LocalDate.now().plusDays(30))
                .status(SupplierDebtStatus.UNPAID)
                .note("Công nợ từ phiếu nhập #" + po.getId())
                .build();

        refreshStatus(debt);
        SupplierDebt saved = supplierDebtRepository.save(debt);
        auditLogService.log(
                AuditAction.DEBT_CREATE,
                "SUPPLIER_DEBT",
                saved.getId().toString(),
                "Tạo công nợ từ phiếu nhập #" + po.getId(),
                null,
                AuditData.of(
                        "purchaseOrderId", po.getId(),
                        "supplierId", po.getSupplier().getId(),
                        "amount", saved.getAmount(),
                        "dueDate", saved.getDueDate(),
                        "status", saved.getStatus()
                )
        );
        return saved;
    }

    private void updateStatusAfterPayment(SupplierDebt debt, BigDecimal newPaid) {
        if (newPaid.compareTo(debt.getAmount()) >= 0) {
            debt.setStatus(SupplierDebtStatus.PAID);
            return;
        }
        debt.setStatus(isOverdue(debt) ? SupplierDebtStatus.OVERDUE : SupplierDebtStatus.PARTIAL);
    }

    private void refreshStatus(SupplierDebt debt) {
        if (debt.getStatus() == SupplierDebtStatus.PAID) {
            return;
        }
        if (isOverdue(debt)) {
            debt.setStatus(SupplierDebtStatus.OVERDUE);
        } else if (debt.getPaidAmount() != null && debt.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
            debt.setStatus(SupplierDebtStatus.PARTIAL);
        } else {
            debt.setStatus(SupplierDebtStatus.UNPAID);
        }
    }

    private void refreshOverdueDebts() {
        List<SupplierDebt> debts = supplierDebtRepository.findAllByOrderByIdDesc();
        boolean changed = false;
        for (SupplierDebt debt : debts) {
            SupplierDebtStatus before = debt.getStatus();
            refreshStatus(debt);
            changed = changed || before != debt.getStatus();
        }
        if (changed) {
            supplierDebtRepository.saveAll(debts);
        }
    }

    private boolean isOverdue(SupplierDebt debt) {
        return debt.getDueDate() != null
                && debt.getDueDate().isBefore(LocalDate.now())
                && debt.getPaidAmount().compareTo(debt.getAmount()) < 0;
    }
}
