package com.smartmart.service;

import com.smartmart.entity.Supplier;
import com.smartmart.entity.SupplierDebt;
import com.smartmart.enums.SupplierDebtStatus;
import com.smartmart.repository.PurchaseOrderRepository;
import com.smartmart.repository.SupplierDebtRepository;
import com.smartmart.service.impl.SupplierDebtServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SupplierDebtServiceTest {

    @Mock
    private SupplierDebtRepository supplierDebtRepository;
    @Mock
    private PurchaseOrderRepository purchaseOrderRepository;
    @Mock
    private AuditLogService auditLogService;

    private SupplierDebtService service;

    @BeforeEach
    void setUp() {
        service = new SupplierDebtServiceImpl(
                supplierDebtRepository,
                purchaseOrderRepository,
                auditLogService
        );
    }

    @Test
    void listAll_marksPastDueUnpaidDebtAsOverdue() {
        Supplier supplier = Supplier.builder().supplierName("NCC").build();
        supplier.setId(1L);
        SupplierDebt debt = SupplierDebt.builder()
                .supplier(supplier)
                .amount(BigDecimal.valueOf(100000))
                .paidAmount(BigDecimal.ZERO)
                .dueDate(LocalDate.now().minusDays(1))
                .status(SupplierDebtStatus.UNPAID)
                .build();
        debt.setId(10L);

        when(supplierDebtRepository.findAllByOrderByIdDesc()).thenReturn(List.of(debt));

        List<SupplierDebt> rows = service.listAll(null);

        assertThat(rows).hasSize(1);
        assertThat(rows.getFirst().getStatus()).isEqualTo(SupplierDebtStatus.OVERDUE);
        verify(supplierDebtRepository).saveAll(List.of(debt));
    }
}
