package com.smartmart.service.impl;

import com.smartmart.constant.AuditAction;
import com.smartmart.dto.request.CloseShiftRequest;
import com.smartmart.dto.request.OpenShiftRequest;
import com.smartmart.dto.request.PaymentMethodCorrectionRequest;
import com.smartmart.dto.request.ReviewShiftRequest;
import com.smartmart.dto.response.ShiftSummaryResponse;
import com.smartmart.entity.Order;
import com.smartmart.entity.OrderPayment;
import com.smartmart.entity.ReturnOrder;
import com.smartmart.entity.Shift;
import com.smartmart.enums.OrderStatus;
import com.smartmart.enums.PaymentMethod;
import com.smartmart.enums.ReturnOrderStatus;
import com.smartmart.enums.ShiftStatus;
import com.smartmart.exception.BadRequestException;
import com.smartmart.exception.ForbiddenException;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.OrderPaymentRepository;
import com.smartmart.repository.OrderRepository;
import com.smartmart.repository.ReturnOrderRepository;
import com.smartmart.repository.ShiftRepository;
import com.smartmart.repository.UserRepository;
import com.smartmart.security.SecurityUtils;
import com.smartmart.service.AuditLogService;
import com.smartmart.service.ShiftService;
import com.smartmart.util.AuditData;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ShiftServiceImpl implements ShiftService {
    private final ShiftRepository shiftRepository;
    private final OrderRepository orderRepository;
    private final OrderPaymentRepository orderPaymentRepository;
    private final ReturnOrderRepository returnOrderRepository;
    private final AuditLogService auditLogService;
    private final UserRepository userRepository;

    public ShiftServiceImpl(
            ShiftRepository shiftRepository,
            OrderRepository orderRepository,
            OrderPaymentRepository orderPaymentRepository,
            ReturnOrderRepository returnOrderRepository,
            AuditLogService auditLogService,
            UserRepository userRepository
    ) {
        this.shiftRepository = shiftRepository;
        this.orderRepository = orderRepository;
        this.orderPaymentRepository = orderPaymentRepository;
        this.returnOrderRepository = returnOrderRepository;
        this.auditLogService = auditLogService;
        this.userRepository = userRepository;
    }

    @Override
    public Shift openShift(OpenShiftRequest request) {
        Long cashierId = currentUserId();
        shiftRepository.findByCashierIdAndStatus(cashierId, ShiftStatus.OPEN)
                .ifPresent(existing -> {
                    throw new BadRequestException("Bạn đang có ca làm việc mở. Vui lòng đóng ca trước.");
                });

        Optional<Shift> previousShift = shiftRepository.findFirstByClosingCashIsNotNullOrderByClosedAtDesc();
        BigDecimal openingBalance = previousShift.map(Shift::getClosingCash).orElse(BigDecimal.ZERO);
        Shift saved = shiftRepository.save(Shift.builder()
                .cashierId(cashierId)
                .openedAt(LocalDateTime.now())
                .openingCash(openingBalance)
                .openingBalanceSourceShiftId(previousShift.map(Shift::getId).orElse(null))
                .totalOrders(0)
                .totalRevenue(BigDecimal.ZERO)
                .staffMismatchReported(false)
                .status(ShiftStatus.OPEN)
                .note(request.getNote().trim())
                .build());
        audit(AuditAction.SHIFT_OPENED, saved, request.getNote().trim(), null,
                AuditData.of("status", saved.getStatus(), "openedAt", saved.getOpenedAt(),
                        "openingBalance", openingBalance,
                        "openingBalanceSourceShiftId", saved.getOpeningBalanceSourceShiftId(),
                        "openingNote", saved.getNote()));
        return saved;
    }

    @Override
    public Shift closeShift(Long id, CloseShiftRequest request) {
        Shift shift = findById(id);
        requireOwnerOrManagement(shift);
        requireStatus(shift, ShiftStatus.OPEN, "Ca làm việc đã được đóng");

        BigDecimal countedCash = request.getClosingCash();
        if (countedCash == null) {
            throw new BadRequestException("Vui lòng nhập số tiền mặt thực tế kiểm đếm cuối ca");
        }

        ShiftSummaryResponse summary = calculateSummary(shift);
        BigDecimal cashRefunds = cashRefundTotal(shift.getId());
        BigDecimal expectedCash = shift.getOpeningCash().add(summary.getCashSales()).subtract(cashRefunds);
        BigDecimal variance = countedCash.subtract(expectedCash);
        // SHIFT-03: lệch từ 0.01 VND trở lên bắt buộc phải giải trình
        boolean matches = variance.abs().compareTo(new BigDecimal("0.01")) < 0;
        if (!matches && (request.getVarianceReason() == null || request.getVarianceReason().isBlank())) {
            throw new BadRequestException("Ca lệch tiền, bạn phải nhập giải trình");
        }

        shift.setClosedAt(LocalDateTime.now());
        shift.setExpectedCash(expectedCash);
        shift.setClosingCash(countedCash);
        shift.setCashVariance(variance);
        shift.setStaffMismatchReported(!matches);
        shift.setVarianceReason(matches ? null : request.getVarianceReason().trim());
        shift.setClosingNote(request.getNote().trim());
        shift.setTotalOrders(summary.getTotalOrders());
        shift.setTotalRevenue(summary.getNetRevenue());
        shift.setStatus(ShiftStatus.PENDING_REVIEW);
        Shift saved = shiftRepository.save(shift);
        audit(AuditAction.SHIFT_CLOSED, saved, request.getNote().trim(), AuditData.of("status", ShiftStatus.OPEN),
                AuditData.of("status", saved.getStatus(), "grossSales", summary.getGrossSales(),
                        "refundAmount", summary.getRefundAmount(), "netRevenue", summary.getNetRevenue(),
                        "cashSales", summary.getCashSales(), "cashRefunds", cashRefunds,
                        "openingBalance", shift.getOpeningCash(), "expectedCash", expectedCash,
                        "closingCash", countedCash, "cashVariance", variance,
                        "closingNote", saved.getClosingNote(),
                        "staffMismatchReported", saved.getStaffMismatchReported(),
                        "staffExplanation", saved.getVarianceReason()));
        return saved;
    }

    @Override
    public Shift reviewShift(Long id, ReviewShiftRequest request) {
        return submitManagerReview(id, request.getReviewNote());
    }

    @Override
    public Shift requestStaffUpdate(Long id, String note) {
        Shift shift = findById(id);
        requireStatus(shift, ShiftStatus.PENDING_REVIEW, "Chỉ ca đang chờ duyệt mới có thể yêu cầu giải trình");
        return transition(shift, ShiftStatus.NEEDS_STAFF_UPDATE, note, AuditAction.SHIFT_RETURNED_TO_STAFF,
                "Quản lý yêu cầu nhân viên bổ sung giải trình", false);
    }

    @Override
    public Shift updateStaffExplanation(Long id, String note) {
        Shift shift = findById(id);
        requireOwner(shift);
        requireStatus(shift, ShiftStatus.NEEDS_STAFF_UPDATE, "Ca không ở trạng thái cần bổ sung giải trình");
        String before = AuditData.of("status", shift.getStatus(), "staffExplanation", shift.getVarianceReason());
        shift.setVarianceReason(note.trim());
        shift.setStaffMismatchReported(true);
        shift.setStatus(ShiftStatus.PENDING_REVIEW);
        Shift saved = shiftRepository.save(shift);
        audit(AuditAction.SHIFT_STAFF_UPDATE, saved, "Nhân viên bổ sung giải trình", before,
                AuditData.of("status", saved.getStatus(), "staffExplanation", saved.getVarianceReason()));
        return saved;
    }

    @Override
    public Shift submitManagerReview(Long id, String note) {
        Shift shift = findById(id);
        if (shift.getStatus() != ShiftStatus.PENDING_REVIEW && shift.getStatus() != ShiftStatus.NEEDS_MANAGER_UPDATE) {
            throw new BadRequestException("Ca không ở trạng thái quản lý có thể duyệt");
        }
        shift.setReviewedBy(currentUserId());
        shift.setReviewedAt(LocalDateTime.now());
        shift.setReviewNote(note);
        shift.setManagerNote(note);
        return transition(shift, ShiftStatus.REVIEWED_BY_MANAGER, note, AuditAction.SHIFT_MANAGER_REVIEW,
                "Quản lý đã duyệt và gửi ca cho Admin", false);
    }

    @Override
    public Shift requestManagerUpdate(Long id, String note) {
        Shift shift = findById(id);
        requireStatus(shift, ShiftStatus.REVIEWED_BY_MANAGER, "Chỉ ca đã được quản lý duyệt mới có thể trả lại");
        return transition(shift, ShiftStatus.NEEDS_MANAGER_UPDATE, note, AuditAction.SHIFT_RETURNED_TO_MANAGER,
                "Admin yêu cầu quản lý kiểm tra lại", true);
    }

    @Override
    public Shift approveShift(Long id, String note) {
        Shift shift = findById(id);
        requireStatus(shift, ShiftStatus.REVIEWED_BY_MANAGER, "Chỉ ca đã được quản lý duyệt mới có thể phê duyệt");
        return transition(shift, ShiftStatus.APPROVED, note, AuditAction.SHIFT_APPROVED,
                "Admin phê duyệt ca", true);
    }

    @Override
    public Shift correctPaymentMethod(Long shiftId, Long paymentId, PaymentMethodCorrectionRequest request) {
        Shift shift = findById(shiftId);
        if (shift.getStatus() != ShiftStatus.PENDING_REVIEW && shift.getStatus() != ShiftStatus.NEEDS_MANAGER_UPDATE) {
            throw new BadRequestException("Chỉ được sửa giao dịch khi ca đang được quản lý kiểm tra");
        }
        OrderPayment payment = orderPaymentRepository.findById(paymentId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy thanh toán"));
        if (payment.getOrder().getShift() == null || !shiftId.equals(payment.getOrder().getShift().getId())) {
            throw new BadRequestException("Thanh toán không thuộc ca làm việc này");
        }
        PaymentMethod oldMethod = payment.getPaymentMethod();
        payment.setPaymentMethod(request.getPaymentMethod());
        if (payment.getOrder().getPayments().size() == 1) {
            payment.getOrder().setPaymentMethod(request.getPaymentMethod());
        }
        orderPaymentRepository.save(payment);
        BigDecimal oldClosingBalance = shift.getClosingCash();
        ShiftSummaryResponse summary = calculateSummary(shift);
        BigDecimal newClosingBalance = shift.getOpeningCash()
                .add(summary.getCashSales()).subtract(cashRefundTotal(shiftId));
        shift.setTotalRevenue(summary.getNetRevenue());
        shift.setExpectedCash(newClosingBalance);
        shift.setClosingCash(newClosingBalance);
        shiftRepository.save(shift);
        audit(AuditAction.PAYMENT_METHOD_CORRECTED, shift, request.getReason(),
                AuditData.of("paymentId", paymentId, "paymentMethod", oldMethod),
                AuditData.of("paymentId", paymentId, "paymentMethod", request.getPaymentMethod()));
        audit(AuditAction.BALANCE_ADJUSTED, shift,
                "Hệ thống tính lại số dư sau khi sửa phương thức thanh toán",
                AuditData.of("closingBalance", oldClosingBalance),
                AuditData.of("closingBalance", newClosingBalance));
        return shift;
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
        Shift shift = shiftRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy ca làm việc"));
        requireOwnerOrManagement(shift);
        return shift;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Shift> listAll() {
        if (SecurityUtils.hasAnyRole("ADMIN", "MANAGER")) {
            return shiftRepository.findAllByOrderByIdDesc();
        }
        return shiftRepository.findByCashierIdOrderByIdDesc(currentUserId());
    }

    @Override
    @Transactional(readOnly = true)
    public List<Shift> listByCashier(Long cashierId) {
        if (!SecurityUtils.hasAnyRole("ADMIN", "MANAGER") && !currentUserId().equals(cashierId)) {
            throw new ForbiddenException("Bạn không có quyền xem ca của người khác");
        }
        return shiftRepository.findByCashierIdOrderByIdDesc(cashierId);
    }

    @Override
    @Transactional(readOnly = true)
    public ShiftSummaryResponse getSummary(Long id) {
        return calculateSummary(findById(id));
    }

    private ShiftSummaryResponse calculateSummary(Shift shift) {
        List<Order> allOrders = orderRepository.findByShiftId(shift.getId());
        List<Order> completed = allOrders.stream().filter(o -> o.getStatus() == OrderStatus.COMPLETED).toList();
        int cancelled = (int) allOrders.stream().filter(o -> o.getStatus() == OrderStatus.CANCELLED).count();
        List<ReturnOrder> returns = returnOrderRepository.findByShiftIdAndStatus(shift.getId(), ReturnOrderStatus.COMPLETED);
        BigDecimal gross = completed.stream().map(Order::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal refunds = returns.stream().map(ReturnOrder::getRefundAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal cash = paymentTotal(shift.getId(), PaymentMethod.CASH, completed);
        BigDecimal bank = paymentTotal(shift.getId(), PaymentMethod.BANK_TRANSFER, completed);
        BigDecimal card = paymentTotal(shift.getId(), PaymentMethod.CARD, completed);
        BigDecimal wallet = paymentTotal(shift.getId(), PaymentMethod.WALLET, completed);
        BigDecimal other = paymentTotal(shift.getId(), PaymentMethod.PAY_LATER, completed);
        BigDecimal nonCash = bank.add(card).add(wallet).add(other);
        return ShiftSummaryResponse.builder()
                .shiftId(shift.getId())
                .cashierName(cashierName(shift))
                .openedAt(shift.getOpenedAt()).closedAt(shift.getClosedAt()).status(shift.getStatus().name())
                .openingCash(shift.getOpeningCash()).closingCash(shift.getClosingCash())
                .expectedCash(shift.getExpectedCash()).cashVariance(shift.getCashVariance())
                .totalOrders(allOrders.size()).completedOrders(completed.size()).cancelledOrders(cancelled)
                .refundedOrders(returns.size()).grossSales(gross).refundAmount(refunds)
                .netRevenue(gross.subtract(refunds)).totalRevenue(gross.subtract(refunds))
                .cashSales(cash).bankSales(bank).cardSales(card).walletSales(wallet)
                .otherSales(other).nonCashSales(nonCash)
                .build();
    }

    private BigDecimal paymentTotal(Long shiftId, PaymentMethod method, List<Order> completed) {
        BigDecimal total = orderPaymentRepository.sumByShiftIdAndMethod(shiftId, method);
        for (Order order : completed) {
            if (order.getPayments().isEmpty() && order.getPaymentMethod() == method) {
                total = total.add(order.getTotalAmount());
            }
        }
        return total;
    }

    private BigDecimal cashRefundTotal(Long shiftId) {
        return returnOrderRepository.findByShiftIdAndStatus(shiftId, ReturnOrderStatus.COMPLETED).stream()
                .map(this::cashPortionOfRefund)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal cashPortionOfRefund(ReturnOrder returnOrder) {
        Order order = returnOrder.getOriginalOrder();
        if (order.getPayments() == null || order.getPayments().isEmpty()) {
            return order.getPaymentMethod() == PaymentMethod.CASH ? returnOrder.getRefundAmount() : BigDecimal.ZERO;
        }
        BigDecimal totalPaid = order.getPayments().stream()
                .map(OrderPayment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal cashPaid = order.getPayments().stream()
                .filter(payment -> payment.getPaymentMethod() == PaymentMethod.CASH)
                .map(OrderPayment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        if (totalPaid.signum() == 0 || cashPaid.signum() == 0) {
            return BigDecimal.ZERO;
        }
        return returnOrder.getRefundAmount().multiply(cashPaid)
                .divide(totalPaid, 2, RoundingMode.HALF_UP)
                .min(returnOrder.getRefundAmount());
    }

    private Shift transition(Shift shift, ShiftStatus status, String note, String action, String detail, boolean admin) {
        ShiftStatus oldStatus = shift.getStatus();
        shift.setStatus(status);
        if (admin) {
            shift.setAdminNote(note);
        } else if (SecurityUtils.hasRole("MANAGER") || SecurityUtils.hasRole("ADMIN")) {
            shift.setManagerNote(note);
        }
        Shift saved = shiftRepository.save(shift);
        audit(action, saved, detail, AuditData.of("status", oldStatus),
                AuditData.of("status", status, "note", note));
        return saved;
    }

    private void requireStatus(Shift shift, ShiftStatus required, String message) {
        if (shift.getStatus() != required) {
            throw new BadRequestException(message);
        }
    }

    private void requireOwner(Shift shift) {
        if (!shift.getCashierId().equals(currentUserId())) {
            throw new ForbiddenException("Bạn không có quyền thao tác ca của người khác");
        }
    }

    private void requireOwnerOrManagement(Shift shift) {
        if (!SecurityUtils.hasAnyRole("ADMIN", "MANAGER")) {
            requireOwner(shift);
        }
    }

    private Long currentUserId() {
        return SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new BadRequestException("Không xác định được người dùng hiện tại"));
    }

    private String cashierName(Shift shift) {
        return userRepository.findById(shift.getCashierId())
                .map(user -> user.getFullName() != null ? user.getFullName() : user.getUsername())
                .orElse("N/A");
    }

    private void audit(String action, Shift shift, String detail, String before, String after) {
        auditLogService.log(action, "SHIFT", shift.getId().toString(), detail, before, after);
    }
}
