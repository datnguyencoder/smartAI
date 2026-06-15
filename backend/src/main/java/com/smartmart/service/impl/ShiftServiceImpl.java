package com.smartmart.service.impl;

import com.smartmart.constant.AuditAction;
import com.smartmart.dto.request.CloseShiftRequest;
import com.smartmart.dto.request.OpenShiftRequest;
import com.smartmart.entity.Order;
import com.smartmart.entity.Shift;
import com.smartmart.enums.PaymentMethod;
import com.smartmart.enums.ShiftStatus;
import com.smartmart.exception.BadRequestException;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.OrderPaymentRepository;
import com.smartmart.repository.OrderRepository;
import com.smartmart.repository.ShiftRepository;
import com.smartmart.security.SecurityUtils;
import com.smartmart.service.AuditLogService;
import com.smartmart.service.ShiftService;
import com.smartmart.util.AuditData;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ShiftServiceImpl implements ShiftService {

    private final ShiftRepository shiftRepository;
    private final OrderRepository orderRepository;
    private final OrderPaymentRepository orderPaymentRepository;
    private final AuditLogService auditLogService;

    public ShiftServiceImpl(
            ShiftRepository shiftRepository,
            OrderRepository orderRepository,
            OrderPaymentRepository orderPaymentRepository,
            AuditLogService auditLogService
    ) {
        this.shiftRepository = shiftRepository;
        this.orderRepository = orderRepository;
        this.orderPaymentRepository = orderPaymentRepository;
        this.auditLogService = auditLogService;
    }

    @Override
    public Shift openShift(OpenShiftRequest request) {
        Long cashierId = SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new BadRequestException("Không xác định được người dùng"));

        shiftRepository.findByCashierIdAndStatus(cashierId, ShiftStatus.OPEN)
                .ifPresent(s -> {
                    throw new BadRequestException("Bạn đang có ca làm việc mở. Vui lòng đóng ca trước.");
                });

        Shift shift = Shift.builder()
                .cashierId(cashierId)
                .openedAt(LocalDateTime.now())
                .openingCash(request.getOpeningCash())
                .totalOrders(0)
                .totalRevenue(BigDecimal.ZERO)
                .status(ShiftStatus.OPEN)
                .note(request.getNote())
                .build();

        Shift saved = shiftRepository.save(shift);
        auditLogService.log(
                AuditAction.SHIFT_OPEN,
                "SHIFT",
                saved.getId().toString(),
                "Mở ca làm việc #" + saved.getId(),
                null,
                AuditData.of("openingCash", saved.getOpeningCash())
        );
        return saved;
    }

    @Override
    public Shift closeShift(Long id, CloseShiftRequest request) {
        Shift shift = findById(id);
        if (shift.getStatus() != ShiftStatus.OPEN) {
            throw new BadRequestException("Ca làm việc đã đóng");
        }

        List<Order> orders = orderRepository.findCompletedByShiftId(shift.getId());
        BigDecimal totalRevenue = orders.stream()
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal cashSales = orderPaymentRepository.sumCashByShiftId(shift.getId());
        for (Order order : orders) {
            if (order.getPayments().isEmpty() && order.getPaymentMethod() == PaymentMethod.CASH) {
                cashSales = cashSales.add(order.getTotalAmount());
            }
        }

        BigDecimal expectedCash = shift.getOpeningCash().add(cashSales);
        BigDecimal variance = request.getClosingCash().subtract(expectedCash);

        shift.setClosedAt(LocalDateTime.now());
        shift.setClosingCash(request.getClosingCash());
        shift.setExpectedCash(expectedCash);
        shift.setCashVariance(variance);
        shift.setTotalOrders(orders.size());
        shift.setTotalRevenue(totalRevenue);
        shift.setStatus(ShiftStatus.CLOSED);
        if (request.getNote() != null) {
            shift.setNote(request.getNote());
        }

        Shift saved = shiftRepository.save(shift);
        auditLogService.log(
                AuditAction.SHIFT_CLOSE,
                "SHIFT",
                saved.getId().toString(),
                "Đóng ca làm việc #" + saved.getId(),
                AuditData.of("status", ShiftStatus.OPEN),
                AuditData.of(
                        "status", saved.getStatus(),
                        "totalRevenue", saved.getTotalRevenue(),
                        "cashVariance", saved.getCashVariance()
                )
        );
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Shift> getOpenShiftForCurrentUser() {
        return SecurityUtils.getCurrentUserId()
                .flatMap(userId -> shiftRepository.findByCashierIdAndStatus(userId, ShiftStatus.OPEN));
    }

    @Override
    @Transactional(readOnly = true)
    public Shift findById(Long id) {
        return shiftRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy ca làm việc"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Shift> listAll() {
        return shiftRepository.findAllByOrderByIdDesc();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Shift> listByCashier(Long cashierId) {
        return shiftRepository.findByCashierIdOrderByIdDesc(cashierId);
    }
}
