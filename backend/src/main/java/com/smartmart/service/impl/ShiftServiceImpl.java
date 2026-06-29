package com.smartmart.service.impl;

import com.smartmart.constant.AuditAction;
import com.smartmart.dto.request.CloseShiftRequest;
import com.smartmart.dto.request.OpenShiftRequest;
import com.smartmart.dto.request.ReviewShiftRequest;
import com.smartmart.dto.response.ShiftSummaryResponse;
import com.smartmart.entity.Order;
import com.smartmart.entity.Shift;
import com.smartmart.enums.PaymentMethod;
import com.smartmart.enums.ShiftStatus;
import com.smartmart.exception.BadRequestException;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.OrderPaymentRepository;
import com.smartmart.repository.OrderRepository;
import com.smartmart.repository.ShiftRepository;
import com.smartmart.repository.UserRepository;
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
    private static final BigDecimal CASH_VARIANCE_REVIEW_THRESHOLD = new BigDecimal("0.01");

    private final ShiftRepository shiftRepository;
    private final OrderRepository orderRepository;
    private final OrderPaymentRepository orderPaymentRepository;
    private final AuditLogService auditLogService;
    private final UserRepository userRepository;

    public ShiftServiceImpl(
            ShiftRepository shiftRepository,
            OrderRepository orderRepository,
            OrderPaymentRepository orderPaymentRepository,
            AuditLogService auditLogService,
            UserRepository userRepository
    ) {
        this.shiftRepository = shiftRepository;
        this.orderRepository = orderRepository;
        this.orderPaymentRepository = orderPaymentRepository;
        this.auditLogService = auditLogService;
        this.userRepository = userRepository;
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
        boolean requiresReview = variance.abs().compareTo(CASH_VARIANCE_REVIEW_THRESHOLD) >= 0;
        if (requiresReview && (request.getVarianceReason() == null || request.getVarianceReason().isBlank())) {
            throw new BadRequestException("Ca lệch tiền phải nhập lý do đối soát");
        }

        shift.setClosedAt(LocalDateTime.now());
        shift.setClosingCash(request.getClosingCash());
        shift.setExpectedCash(expectedCash);
        shift.setCashVariance(variance);
        shift.setVarianceReason(request.getVarianceReason());
        shift.setTotalOrders(orders.size());
        shift.setTotalRevenue(totalRevenue);
        shift.setStatus(requiresReview ? ShiftStatus.PENDING_REVIEW : ShiftStatus.CLOSED);
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
                        "expectedCash", saved.getExpectedCash(),
                        "closingCash", saved.getClosingCash(),
                        "cashVariance", saved.getCashVariance()
                )
        );
        return saved;
    }

    @Override
    public Shift reviewShift(Long id, ReviewShiftRequest request) {
        Shift shift = findById(id);
        if (shift.getStatus() != ShiftStatus.PENDING_REVIEW) {
            throw new BadRequestException("Chỉ ca lệch tiền đang chờ duyệt mới cần đối soát");
        }

        Long reviewerId = SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new BadRequestException("Không xác định được người duyệt"));
        String beforeData = AuditData.of(
                "status", shift.getStatus(),
                "cashVariance", shift.getCashVariance(),
                "varianceReason", shift.getVarianceReason()
        );

        shift.setStatus(ShiftStatus.CLOSED);
        shift.setReviewedBy(reviewerId);
        shift.setReviewedAt(LocalDateTime.now());
        shift.setReviewNote(request.getReviewNote());

        Shift saved = shiftRepository.save(shift);
        auditLogService.log(
                AuditAction.SHIFT_REVIEW,
                "SHIFT",
                saved.getId().toString(),
                "Duyệt đối soát ca làm việc #" + saved.getId(),
                beforeData,
                AuditData.of(
                        "status", saved.getStatus(),
                        "reviewedBy", saved.getReviewedBy(),
                        "reviewNote", saved.getReviewNote()
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

    @Override
    @Transactional(readOnly = true)
    public ShiftSummaryResponse getSummary(Long id) {
        Shift shift = findById(id);
        List<Order> orders = orderRepository.findCompletedByShiftId(shift.getId());
        BigDecimal cashSales = orderPaymentRepository.sumCashByShiftId(shift.getId());
        BigDecimal bankSales = orderPaymentRepository.sumByShiftIdAndMethod(shift.getId(), PaymentMethod.BANK_TRANSFER);
        for (Order order : orders) {
            if (order.getPayments().isEmpty()) {
                if (order.getPaymentMethod() == PaymentMethod.CASH) {
                    cashSales = cashSales.add(order.getTotalAmount());
                } else if (order.getPaymentMethod() == PaymentMethod.BANK_TRANSFER) {
                    bankSales = bankSales.add(order.getTotalAmount());
                }
            }
        }
        String cashierName = userRepository.findById(shift.getCashierId())
                .map(u -> u.getFullName() != null ? u.getFullName() : u.getUsername())
                .orElse("N/A");
        return ShiftSummaryResponse.builder()
                .shiftId(shift.getId())
                .cashierName(cashierName)
                .openedAt(shift.getOpenedAt())
                .closedAt(shift.getClosedAt())
                .status(shift.getStatus().name())
                .openingCash(shift.getOpeningCash())
                .closingCash(shift.getClosingCash())
                .expectedCash(shift.getExpectedCash())
                .cashVariance(shift.getCashVariance())
                .totalOrders(orders.size())
                .totalRevenue(orders.stream().map(Order::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add))
                .cashSales(cashSales)
                .bankSales(bankSales)
                .build();
    }
}
