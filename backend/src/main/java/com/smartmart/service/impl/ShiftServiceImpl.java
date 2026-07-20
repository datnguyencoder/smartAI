package com.smartmart.service.impl;

import com.smartmart.constant.AuditAction;
import com.smartmart.dto.request.CloseShiftRequest;
import com.smartmart.dto.request.OpenShiftRequest;
import com.smartmart.dto.request.PaymentMethodCorrectionRequest;
import com.smartmart.dto.request.ReviewShiftRequest;
import com.smartmart.dto.response.ShiftDashboardResponse;
import com.smartmart.dto.response.ShiftBillFlowResponse;
import com.smartmart.dto.response.ShiftMoneyFlowResponse;
import com.smartmart.dto.response.ShiftResponse;
import com.smartmart.dto.response.ShiftReturnedItemResponse;
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
import com.smartmart.mapper.WmsResponseMapper;
import com.smartmart.repository.OrderPaymentRepository;
import com.smartmart.repository.OrderRepository;
import com.smartmart.repository.ReturnOrderRepository;
import com.smartmart.repository.ShiftRepository;
import com.smartmart.repository.UserRepository;
import com.smartmart.security.SecurityUtils;
import com.smartmart.service.AuditLogService;
import com.smartmart.service.FinanceService;
import com.smartmart.service.ShiftService;
import com.smartmart.util.AuditData;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class ShiftServiceImpl implements ShiftService {
    private static final BigDecimal OPENING_CASH_FUND = new BigDecimal("1000000.00");

    private final ShiftRepository shiftRepository;
    private final OrderRepository orderRepository;
    private final OrderPaymentRepository orderPaymentRepository;
    private final ReturnOrderRepository returnOrderRepository;
    private final AuditLogService auditLogService;
    private final UserRepository userRepository;
    private final FinanceService financeService;

    public ShiftServiceImpl(
            ShiftRepository shiftRepository,
            OrderRepository orderRepository,
            OrderPaymentRepository orderPaymentRepository,
            ReturnOrderRepository returnOrderRepository,
            AuditLogService auditLogService,
            UserRepository userRepository,
            FinanceService financeService
    ) {
        this.shiftRepository = shiftRepository;
        this.orderRepository = orderRepository;
        this.orderPaymentRepository = orderPaymentRepository;
        this.returnOrderRepository = returnOrderRepository;
        this.auditLogService = auditLogService;
        this.userRepository = userRepository;
        this.financeService = financeService;
    }

    @Override
    public Shift openShift(OpenShiftRequest request) {
        Long cashierId = currentUserId();
        shiftRepository.findByCashierIdAndStatus(cashierId, ShiftStatus.OPEN)
                .ifPresent(existing -> {
                    throw new BadRequestException("Bạn đang có ca làm việc mở. Vui lòng đóng ca trước.");
                });

        Shift saved = shiftRepository.save(Shift.builder()
                .cashierId(cashierId)
                .openedAt(LocalDateTime.now())
                .openingCash(OPENING_CASH_FUND)
                .openingBalanceSourceShiftId(null)
                .totalOrders(0)
                .totalRevenue(BigDecimal.ZERO)
                .staffMismatchReported(false)
                .status(ShiftStatus.OPEN)
                .note(request.getNote().trim())
                .build());
        audit(AuditAction.SHIFT_OPENED, saved, request.getNote().trim(), null,
                AuditData.of("status", saved.getStatus(), "openedAt", saved.getOpenedAt(),
                        "openingCashFund", OPENING_CASH_FUND,
                        "openingNote", saved.getNote()));
        return saved;
    }

    @Override
    public Shift closeShift(Long id, CloseShiftRequest request) {
        Shift shift = findById(id);
        requireOwnerOrManagement(shift);
        requireStatus(shift, ShiftStatus.OPEN, "Ca làm việc đã được đóng");

        ShiftSummaryResponse summary = calculateSummary(shift);
        BigDecimal cashRefunds = summary.getCashRefundAmount();
        BigDecimal expectedCash = summary.getCashDrawerEndingAmount();
        BigDecimal countedCash = request.getClosingCash() != null ? request.getClosingCash() : expectedCash;
        BigDecimal variance = countedCash.subtract(expectedCash);
        boolean matches = request.getMatchesSystemData() != null
                ? request.getMatchesSystemData()
                : variance.abs().compareTo(new BigDecimal("0.01")) < 0;
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
                        "openingCashFund", shift.getOpeningCash(), "expectedCash", expectedCash,
                        "closingCash", countedCash, "cashVariance", variance,
                        "matchesSystemData", matches,
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
        BigDecimal newClosingBalance = summary.getCashDrawerEndingAmount();
        shift.setTotalRevenue(summary.getNetRevenue());
        shift.setExpectedCash(newClosingBalance);
        shift.setClosingCash(newClosingBalance);
        shiftRepository.save(shift);
        audit(AuditAction.PAYMENT_METHOD_CORRECTED, shift, request.getReason(),
                AuditData.of("paymentId", paymentId, "paymentMethod", oldMethod),
                AuditData.of("paymentId", paymentId, "paymentMethod", request.getPaymentMethod()));
        audit(AuditAction.BALANCE_ADJUSTED, shift,
                "Hệ thống tính lại tiền mặt trong két sau khi sửa phương thức thanh toán",
                AuditData.of("cashDrawerEndingAmount", oldClosingBalance),
                AuditData.of("cashDrawerEndingAmount", newClosingBalance));
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

    @Override
    @Transactional(readOnly = true)
    public ShiftDashboardResponse getDashboard() {
        List<Shift> shifts = listAll();
        List<ShiftSummaryResponse> summaries = shifts.stream().map(this::calculateSummary).toList();
        BigDecimal totalCashCollected = summaries.stream()
                .map(ShiftSummaryResponse::getCashSales).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalNonCashCollected = summaries.stream()
                .map(ShiftSummaryResponse::getNonCashSales).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalRefunded = summaries.stream()
                .map(ShiftSummaryResponse::getRefundAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal shiftRecordedMoney = totalCashCollected.add(totalNonCashCollected).subtract(totalRefunded);
        BigDecimal currentStoreMoney = SecurityUtils.hasAnyRole("ADMIN", "MANAGER")
                ? financeService.summary(null, null).getCurrentStoreMoney()
                : shiftRecordedMoney;
        BigDecimal currentCashDrawerAmount = summaries.stream()
                .filter(summary -> ShiftStatus.OPEN.name().equals(summary.getStatus()))
                .map(ShiftSummaryResponse::getCashDrawerEndingAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        int completedOrders = summaries.stream().mapToInt(ShiftSummaryResponse::getCompletedOrders).sum();
        int cancelledOrders = summaries.stream().mapToInt(ShiftSummaryResponse::getCancelledOrders).sum();
        List<ShiftResponse> recentShifts = shifts.stream()
                .sorted(Comparator.comparing(Shift::getOpenedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .limit(2)
                .map(shift -> WmsResponseMapper.toShiftResponse(shift, cashierName(shift)))
                .toList();

        return ShiftDashboardResponse.builder()
                .currentStoreMoney(currentStoreMoney)
                .currentCashDrawerAmount(currentCashDrawerAmount)
                .totalCashCollected(totalCashCollected)
                .totalNonCashCollected(totalNonCashCollected)
                .totalRefunded(totalRefunded)
                .activeShiftCount((int) shifts.stream().filter(s -> s.getStatus() == ShiftStatus.OPEN).count())
                .pendingManagerCount((int) shifts.stream().filter(s -> s.getStatus() == ShiftStatus.PENDING_REVIEW).count())
                .pendingAdminCount((int) shifts.stream().filter(s -> s.getStatus() == ShiftStatus.REVIEWED_BY_MANAGER).count())
                .statistics(ShiftDashboardResponse.ShiftStatistics.builder()
                        .totalShifts(shifts.size())
                        .totalCompletedOrders(completedOrders)
                        .totalCancelledOrders(cancelledOrders)
                        .totalCashCollected(totalCashCollected)
                        .totalNonCashCollected(totalNonCashCollected)
                        .totalRefunded(totalRefunded)
                        .currentStoreMoney(currentStoreMoney)
                        .build())
                .recentShifts(recentShifts)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ShiftMoneyFlowResponse> getMoneyFlow(Long id) {
        Shift shift = findById(id);
        List<ShiftMoneyFlowResponse> rows = new ArrayList<>();
        rows.add(ShiftMoneyFlowResponse.builder()
                .occurredAt(shift.getOpenedAt())
                .transactionType("OPENING_FUND")
                .referenceCode("SHIFT-" + shift.getId())
                .description("Tiền quỹ đầu ca")
                .paymentMethod(PaymentMethod.CASH.name())
                .moneyIn(shift.getOpeningCash())
                .moneyOut(BigDecimal.ZERO)
                .amount(shift.getOpeningCash())
                .actorName(cashierName(shift))
                .build());

        for (Order order : orderRepository.findCompletedByShiftId(shift.getId())) {
            if (order.getPayments().isEmpty()) {
                rows.add(saleFlow(order, order.getPaymentMethod(), order.getTotalAmount()));
                continue;
            }
            for (OrderPayment payment : order.getPayments()) {
                rows.add(saleFlow(order, payment.getPaymentMethod(), payment.getAmount()));
            }
        }

        for (ReturnOrder returnOrder : returnOrderRepository.findByShiftIdAndStatus(shift.getId(), ReturnOrderStatus.COMPLETED)) {
            BigDecimal cashRefund = cashPortionOfRefund(returnOrder);
            BigDecimal nonCashRefund = returnOrder.getRefundAmount().subtract(cashRefund).max(BigDecimal.ZERO);
            if (cashRefund.signum() > 0) {
                rows.add(refundFlow(returnOrder, PaymentMethod.CASH.name(), cashRefund));
            }
            if (nonCashRefund.signum() > 0) {
                rows.add(refundFlow(returnOrder, "NON_CASH", nonCashRefund));
            }
        }

        return rows.stream()
                .sorted(Comparator.comparing(ShiftMoneyFlowResponse::getOccurredAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ShiftReturnedItemResponse> getReturnedItems() {
        List<Long> visibleShiftIds = listAll().stream().map(Shift::getId).toList();
        if (visibleShiftIds.isEmpty()) {
            return List.of();
        }

        return returnOrderRepository
                .findByShiftIdsAndStatusWithItems(visibleShiftIds, ReturnOrderStatus.COMPLETED)
                .stream()
                .flatMap(returnOrder -> returnOrder.getItems().stream()
                        .map(item -> ShiftReturnedItemResponse.builder()
                                .shiftId(returnOrder.getOriginalOrder().getShift().getId())
                                .returnOrderId(returnOrder.getId())
                                .returnItemId(item.getId())
                                .originalOrderCode(returnOrder.getOriginalOrder().getOrderCode())
                                .returnedAt(returnOrder.getReturnDate())
                                .itemId(item.getItem().getId())
                                .itemName(item.getItem().getItemName())
                                .quantity(item.getQuantity())
                                .refundAmount(item.getSubtotal())
                                .paymentMethods(paymentMethods(returnOrder.getOriginalOrder()))
                                .build()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ShiftBillFlowResponse> getBillFlow(Long id) {
        Shift shift = findById(id);
        List<ShiftBillFlowResponse> rows = new ArrayList<>();

        orderRepository.findCompletedWithItemsByShiftId(id).forEach(order -> rows.add(
                ShiftBillFlowResponse.builder()
                        .occurredAt(order.getOrderDate())
                        .transactionType("SALE")
                        .shiftId(id)
                        .billCode(order.getOrderCode())
                        .itemSummary(order.getItems().stream()
                                .map(item -> item.getItem().getItemName() + " × " + formatQuantity(item.getQuantity()))
                                .collect(Collectors.joining("; ")))
                        .paymentMethods(paymentMethods(order))
                        .amount(order.getTotalAmount())
                        .afterShiftClosed(false)
                        .build()));

        returnOrderRepository.findByShiftIdAndStatusWithItems(id, ReturnOrderStatus.COMPLETED)
                .forEach(returnOrder -> rows.add(ShiftBillFlowResponse.builder()
                        .occurredAt(returnOrder.getReturnDate())
                        .transactionType("RETURN")
                        .shiftId(id)
                        .billCode(returnOrder.getOriginalOrder().getOrderCode())
                        .returnOrderId(returnOrder.getId())
                        .itemSummary(returnOrder.getItems().stream()
                                .map(item -> item.getItem().getItemName() + " × " + formatQuantity(item.getQuantity()))
                                .collect(Collectors.joining("; ")))
                        .paymentMethods(paymentMethods(returnOrder.getOriginalOrder()))
                        .amount(returnOrder.getRefundAmount().negate())
                        .afterShiftClosed(shift.getClosedAt() != null
                                && returnOrder.getReturnDate().isAfter(shift.getClosedAt()))
                        .build()));

        return rows.stream()
                .sorted(Comparator.comparing(ShiftBillFlowResponse::getOccurredAt,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
    }

    private ShiftSummaryResponse calculateSummary(Shift shift) {
        List<Order> allOrders = orderRepository.findByShiftId(shift.getId());
        List<Order> completed = allOrders.stream().filter(o -> o.getStatus() == OrderStatus.COMPLETED).toList();
        int cancelled = (int) allOrders.stream().filter(o -> o.getStatus() == OrderStatus.CANCELLED).count();
        List<ReturnOrder> returns = returnOrderRepository.findByShiftIdAndStatus(shift.getId(), ReturnOrderStatus.COMPLETED);
        List<ReturnOrder> returnsAtClose = shift.getClosedAt() == null
                ? returns
                : returns.stream()
                        .filter(returnOrder -> !returnOrder.getReturnDate().isAfter(shift.getClosedAt()))
                        .toList();
        List<ReturnOrder> returnsAfterClose = shift.getClosedAt() == null
                ? List.of()
                : returns.stream()
                        .filter(returnOrder -> returnOrder.getReturnDate().isAfter(shift.getClosedAt()))
                        .toList();
        BigDecimal gross = completed.stream().map(Order::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal refunds = returns.stream().map(ReturnOrder::getRefundAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal refundsAtClose = returnsAtClose.stream()
                .map(ReturnOrder::getRefundAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal refundsAfterClose = returnsAfterClose.stream()
                .map(ReturnOrder::getRefundAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal cashRefunds = returnsAtClose.stream()
                .map(this::cashPortionOfRefund).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal nonCashRefunds = refundsAtClose.subtract(cashRefunds).max(BigDecimal.ZERO);
        BigDecimal cash = paymentTotal(shift.getId(), PaymentMethod.CASH, completed);
        BigDecimal bank = paymentTotal(shift.getId(), PaymentMethod.BANK_TRANSFER, completed);
        BigDecimal card = paymentTotal(shift.getId(), PaymentMethod.CARD, completed);
        BigDecimal wallet = paymentTotal(shift.getId(), PaymentMethod.WALLET, completed);
        BigDecimal other = paymentTotal(shift.getId(), PaymentMethod.PAY_LATER, completed);
        BigDecimal nonCash = bank.add(card).add(wallet).add(other);
        BigDecimal cashDrawerEndingAmount = shift.getOpeningCash().add(cash).subtract(cashRefunds);
        BigDecimal calculatedRevenueAtClose = gross.subtract(refundsAtClose);
        BigDecimal revenueAtClose = shift.getClosedAt() != null && shift.getTotalRevenue() != null
                ? shift.getTotalRevenue()
                : calculatedRevenueAtClose;
        BigDecimal revenueAfterPostCloseReturns = revenueAtClose.subtract(refundsAfterClose);
        BigDecimal storeMoneyMovement = gross.subtract(refunds);
        return ShiftSummaryResponse.builder()
                .shiftId(shift.getId())
                .cashierName(cashierName(shift))
                .openedAt(shift.getOpenedAt()).closedAt(shift.getClosedAt()).status(shift.getStatus().name())
                .openingCash(shift.getOpeningCash()).closingCash(shift.getClosingCash())
                .expectedCash(shift.getExpectedCash() != null ? shift.getExpectedCash() : cashDrawerEndingAmount)
                .cashVariance(shift.getCashVariance())
                .totalOrders(allOrders.size()).completedOrders(completed.size()).cancelledOrders(cancelled)
                .refundedOrders(returns.size()).grossSales(gross).refundAmount(refunds)
                .cashRefundAmount(cashRefunds).nonCashRefundAmount(nonCashRefunds)
                .netRevenue(revenueAtClose).totalRevenue(revenueAtClose)
                .cashSales(cash).bankSales(bank).cardSales(card).walletSales(wallet)
                .otherSales(other).nonCashSales(nonCash)
                .cashDrawerEndingAmount(cashDrawerEndingAmount)
                .storeMoneyMovement(storeMoneyMovement)
                .refundAmountAtClose(refundsAtClose)
                .postCloseRefundAmount(refundsAfterClose)
                .revenueAfterPostCloseReturns(revenueAfterPostCloseReturns)
                .build();
    }

    private ShiftMoneyFlowResponse saleFlow(Order order, PaymentMethod method, BigDecimal amount) {
        return ShiftMoneyFlowResponse.builder()
                .occurredAt(order.getOrderDate())
                .transactionType("SALE_PAYMENT")
                .referenceCode(order.getOrderCode())
                .description("Thanh toán đơn " + order.getOrderCode())
                .paymentMethod(method != null ? method.name() : null)
                .moneyIn(amount)
                .moneyOut(BigDecimal.ZERO)
                .amount(amount)
                .actorName(userName(order.getCreatedBy()))
                .build();
    }

    private ShiftMoneyFlowResponse refundFlow(ReturnOrder returnOrder, String method, BigDecimal amount) {
        return ShiftMoneyFlowResponse.builder()
                .occurredAt(returnOrder.getReturnDate())
                .transactionType("RETURN_REFUND")
                .referenceCode("RETURN-" + returnOrder.getId())
                .description("Hoàn tiền đơn trả hàng #" + returnOrder.getId())
                .paymentMethod(method)
                .moneyIn(BigDecimal.ZERO)
                .moneyOut(amount)
                .amount(amount.negate())
                .actorName(userName(returnOrder.getCreatedBy()))
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

    private String paymentMethods(Order order) {
        if (order.getPayments() == null || order.getPayments().isEmpty()) {
            return order.getPaymentMethod() != null ? order.getPaymentMethod().name() : null;
        }
        return order.getPayments().stream()
                .map(OrderPayment::getPaymentMethod)
                .filter(method -> method != null)
                .map(PaymentMethod::name)
                .distinct()
                .collect(Collectors.joining(", "));
    }

    private String formatQuantity(BigDecimal quantity) {
        return quantity.stripTrailingZeros().toPlainString();
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

    private String userName(Long userId) {
        if (userId == null) {
            return "N/A";
        }
        return userRepository.findById(userId)
                .map(user -> user.getFullName() != null ? user.getFullName() : user.getUsername())
                .orElse("N/A");
    }

    private void audit(String action, Shift shift, String detail, String before, String after) {
        auditLogService.log(action, "SHIFT", shift.getId().toString(), detail, before, after);
    }
}
