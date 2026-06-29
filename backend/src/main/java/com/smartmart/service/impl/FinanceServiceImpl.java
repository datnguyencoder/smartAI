package com.smartmart.service.impl;

import com.smartmart.dto.request.CreateFinanceTransactionRequest;
import com.smartmart.dto.response.FinanceSummaryResponse;
import com.smartmart.dto.response.FinanceTransactionResponse;
import com.smartmart.entity.FinanceTransaction;
import com.smartmart.enums.FinanceTransactionType;
import com.smartmart.repository.FinanceTransactionRepository;
import com.smartmart.repository.FinanceCategoryRepository;
import com.smartmart.repository.CashAccountRepository;
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
import java.util.List;

@Service
@Transactional
public class FinanceServiceImpl implements FinanceService {
    private final FinanceTransactionRepository financeTransactionRepository;
    private final FinanceCategoryRepository financeCategoryRepository;
    private final CashAccountRepository cashAccountRepository;

    public FinanceServiceImpl(
            FinanceTransactionRepository financeTransactionRepository,
            FinanceCategoryRepository financeCategoryRepository,
            CashAccountRepository cashAccountRepository) {
        this.financeTransactionRepository = financeTransactionRepository;
        this.financeCategoryRepository = financeCategoryRepository;
        this.cashAccountRepository = cashAccountRepository;
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
        return FinanceSummaryResponse.builder()
                .totalIncome(income)
                .totalExpense(expense)
                .netCashFlow(income.subtract(expense))
                .build();
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
