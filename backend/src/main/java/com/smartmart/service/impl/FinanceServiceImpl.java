package com.smartmart.service.impl;

import com.smartmart.dto.request.CreateFinanceTransactionRequest;
import com.smartmart.dto.response.FinanceSummaryResponse;
import com.smartmart.dto.response.FinanceTransactionResponse;
import com.smartmart.entity.FinanceTransaction;
import com.smartmart.enums.FinanceTransactionType;
import com.smartmart.repository.FinanceTransactionRepository;
import com.smartmart.repository.FinanceCategoryRepository;
import com.smartmart.repository.CashAccountRepository;
import com.smartmart.repository.OrderRepository;
import com.smartmart.repository.ReturnOrderRepository;
import com.smartmart.entity.FinanceCategory;
import com.smartmart.entity.CashAccount;
import com.smartmart.exception.BadRequestException;
import com.smartmart.exception.NotFoundException;
import com.smartmart.security.SecurityUtils;
import com.smartmart.service.FinanceService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class FinanceServiceImpl implements FinanceService {
    private final FinanceTransactionRepository financeTransactionRepository;
    private final FinanceCategoryRepository financeCategoryRepository;
    private final CashAccountRepository cashAccountRepository;
    private final OrderRepository orderRepository;
    private final ReturnOrderRepository returnOrderRepository;

    public FinanceServiceImpl(
            FinanceTransactionRepository financeTransactionRepository,
            FinanceCategoryRepository financeCategoryRepository,
            CashAccountRepository cashAccountRepository,
            OrderRepository orderRepository,
            ReturnOrderRepository returnOrderRepository) {
        this.financeTransactionRepository = financeTransactionRepository;
        this.financeCategoryRepository = financeCategoryRepository;
        this.cashAccountRepository = cashAccountRepository;
        this.orderRepository = orderRepository;
        this.returnOrderRepository = returnOrderRepository;
    }

    @Override
    public FinanceTransactionResponse create(CreateFinanceTransactionRequest request) {
        FinanceCategory financeCategory = null;
        String categoryName = request.getCategory();
        if (request.getCategoryId() != null) {
            financeCategory = financeCategoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy danh mục thu chi"));
            if (!financeCategory.isActive()) {
                throw new BadRequestException("Danh mục thu chi không hoạt động");
            }
            categoryName = financeCategory.getName();
        } else if (categoryName == null || categoryName.isBlank()) {
            throw new BadRequestException("Cần nhập danh mục hoặc categoryId");
        }

        CashAccount cashAccount = null;
        if (request.getCashAccountId() != null) {
            cashAccount = cashAccountRepository.findById(request.getCashAccountId())
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy tài khoản tiền"));
            if (!cashAccount.isActive()) {
                throw new BadRequestException("Tài khoản tiền không hoạt động");
            }
            if (request.getType() == FinanceTransactionType.INCOME) {
                cashAccount.setBalance(cashAccount.getBalance().add(request.getAmount()));
            } else {
                if (cashAccount.getBalance().compareTo(request.getAmount()) < 0) {
                    throw new BadRequestException("Số dư tài khoản không đủ");
                }
                cashAccount.setBalance(cashAccount.getBalance().subtract(request.getAmount()));
            }
            cashAccountRepository.save(cashAccount);
        }

        FinanceTransaction tx = FinanceTransaction.builder()
                .type(request.getType())
                .category(categoryName.trim())
                .financeCategory(financeCategory)
                .cashAccount(cashAccount)
                .amount(request.getAmount())
                .paymentAccount(request.getPaymentAccount())
                .transactionDate(request.getTransactionDate())
                .note(request.getNote() != null && !request.getNote().isBlank() ? request.getNote().trim() : null)
                .createdBy(SecurityUtils.getCurrentUserId().orElse(null))
                .build();
        return toResponse(financeTransactionRepository.save(tx));
    }

    @Override
    @Transactional(readOnly = true)
    public List<FinanceTransactionResponse> list(FinanceTransactionType type, LocalDate from, LocalDate to) {
        return financeTransactionRepository.findFiltered(type, from, to).stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public FinanceSummaryResponse summary(LocalDate from, LocalDate to) {
        BigDecimal income = BigDecimal.ZERO;
        BigDecimal expense = BigDecimal.ZERO;
        for (FinanceTransaction tx : financeTransactionRepository.findFiltered(null, from, to)) {
            if (tx.getType() == FinanceTransactionType.INCOME) {
                income = income.add(tx.getAmount());
            } else {
                expense = expense.add(tx.getAmount());
            }
        }
        var fromTime = from != null ? from.atStartOfDay() : null;
        var toTime = to != null ? to.plusDays(1).atStartOfDay() : null;
        BigDecimal salesRevenue = sumCompletedRevenue(fromTime, toTime);
        BigDecimal refundAmount = sumCompletedRefunds(fromTime, toTime);

        BigDecimal allTimeSales = orderRepository.sumAllCompletedRevenue();
        BigDecimal allTimeRefunds = returnOrderRepository.sumAllCompletedRefunds();
        BigDecimal allTimeRevenue = allTimeSales.subtract(allTimeRefunds);

        BigDecimal allTimeIncome = BigDecimal.ZERO;
        BigDecimal allTimeExpense = BigDecimal.ZERO;
        for (FinanceTransaction tx : financeTransactionRepository.findFiltered(null, null, null)) {
            if (tx.getType() == FinanceTransactionType.INCOME) {
                allTimeIncome = allTimeIncome.add(tx.getAmount());
            } else {
                allTimeExpense = allTimeExpense.add(tx.getAmount());
            }
        }
        BigDecimal allTimeNetCashFlow = allTimeIncome.subtract(allTimeExpense);

        return FinanceSummaryResponse.builder()
                .salesRevenue(salesRevenue)
                .refundAmount(refundAmount)
                .totalIncome(income)
                .totalExpense(expense)
                .netCashFlow(income.subtract(expense))
                .allTimeRevenue(allTimeRevenue)
                .currentStoreMoney(allTimeRevenue.add(allTimeNetCashFlow))
                .build();
    }

    private BigDecimal sumCompletedRevenue(LocalDateTime from, LocalDateTime to) {
        if (from != null && to != null) {
            return orderRepository.sumCompletedRevenueBetween(from, to);
        }
        if (from != null) {
            return orderRepository.sumCompletedRevenueFrom(from);
        }
        if (to != null) {
            return orderRepository.sumCompletedRevenueBefore(to);
        }
        return orderRepository.sumAllCompletedRevenue();
    }

    private BigDecimal sumCompletedRefunds(LocalDateTime from, LocalDateTime to) {
        if (from != null && to != null) {
            return returnOrderRepository.sumCompletedRefundsBetween(from, to);
        }
        if (from != null) {
            return returnOrderRepository.sumCompletedRefundsFrom(from);
        }
        if (to != null) {
            return returnOrderRepository.sumCompletedRefundsBefore(to);
        }
        return returnOrderRepository.sumAllCompletedRefunds();
    }

    private FinanceTransactionResponse toResponse(FinanceTransaction tx) {
        return FinanceTransactionResponse.builder()
                .id(tx.getId())
                .type(tx.getType())
                .category(tx.getCategory())
                .categoryId(tx.getFinanceCategory() != null ? tx.getFinanceCategory().getId() : null)
                .cashAccountId(tx.getCashAccount() != null ? tx.getCashAccount().getId() : null)
                .amount(tx.getAmount())
                .paymentAccount(tx.getPaymentAccount())
                .transactionDate(tx.getTransactionDate())
                .note(tx.getNote())
                .createdBy(tx.getCreatedBy())
                .createdAt(tx.getCreatedAt())
                .build();
    }
}
