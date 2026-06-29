package com.smartmart.service.impl;

import com.smartmart.dto.request.CreateAccountTransferRequest;
import com.smartmart.dto.request.CreateCashAccountRequest;
import com.smartmart.dto.response.AccountTransferResponse;
import com.smartmart.dto.response.CashAccountResponse;
import com.smartmart.entity.AccountTransfer;
import com.smartmart.entity.CashAccount;
import com.smartmart.exception.BadRequestException;
import com.smartmart.exception.NotFoundException;
import com.smartmart.repository.AccountTransferRepository;
import com.smartmart.repository.CashAccountRepository;
import com.smartmart.security.SecurityUtils;
import com.smartmart.service.CashAccountService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class CashAccountServiceImpl implements CashAccountService {

    private final CashAccountRepository cashAccountRepository;
    private final AccountTransferRepository accountTransferRepository;

    public CashAccountServiceImpl(
            CashAccountRepository cashAccountRepository,
            AccountTransferRepository accountTransferRepository) {
        this.cashAccountRepository = cashAccountRepository;
        this.accountTransferRepository = accountTransferRepository;
    }

    @Override
    public CashAccountResponse create(CreateCashAccountRequest request) {
        BigDecimal initial = request.getInitialBalance() != null ? request.getInitialBalance() : BigDecimal.ZERO;
        CashAccount account = CashAccount.builder()
                .accountName(request.getAccountName().trim())
                .accountType(request.getAccountType())
                .balance(initial)
                .active(true)
                .build();
        return toResponse(cashAccountRepository.save(account));
    }

    @Override
    @Transactional(readOnly = true)
    public CashAccountResponse getById(Long id) {
        return toResponse(findAccount(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<CashAccountResponse> listAll() {
        return cashAccountRepository.findByActiveTrueOrderByAccountNameAsc().stream()
                .map(this::toResponse).toList();
    }

    @Override
    public AccountTransferResponse transfer(CreateAccountTransferRequest request) {
        if (request.getFromAccountId().equals(request.getToAccountId())) {
            throw new BadRequestException("Tài khoản nguồn và đích phải khác nhau");
        }
        CashAccount from = findAccount(request.getFromAccountId());
        CashAccount to = findAccount(request.getToAccountId());
        if (!from.isActive() || !to.isActive()) {
            throw new BadRequestException("Tài khoản không hoạt động");
        }
        if (from.getBalance().compareTo(request.getAmount()) < 0) {
            throw new BadRequestException("Số dư tài khoản nguồn không đủ");
        }

        from.setBalance(from.getBalance().subtract(request.getAmount()));
        to.setBalance(to.getBalance().add(request.getAmount()));
        cashAccountRepository.save(from);
        cashAccountRepository.save(to);

        AccountTransfer transfer = AccountTransfer.builder()
                .fromAccount(from)
                .toAccount(to)
                .amount(request.getAmount())
                .transferDate(request.getTransferDate())
                .note(request.getNote())
                .createdBy(SecurityUtils.getCurrentUserId().orElse(null))
                .build();
        return toTransferResponse(accountTransferRepository.save(transfer));
    }

    @Override
    @Transactional(readOnly = true)
    public List<AccountTransferResponse> listTransfers() {
        return accountTransferRepository.findAllByOrderByTransferDateDesc().stream()
                .map(this::toTransferResponse).toList();
    }

    private CashAccount findAccount(Long id) {
        return cashAccountRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy tài khoản: " + id));
    }

    private CashAccountResponse toResponse(CashAccount account) {
        return CashAccountResponse.builder()
                .id(account.getId())
                .accountName(account.getAccountName())
                .accountType(account.getAccountType())
                .balance(account.getBalance())
                .active(account.isActive())
                .createdAt(account.getCreatedAt())
                .build();
    }

    private AccountTransferResponse toTransferResponse(AccountTransfer transfer) {
        return AccountTransferResponse.builder()
                .id(transfer.getId())
                .fromAccountId(transfer.getFromAccount().getId())
                .fromAccountName(transfer.getFromAccount().getAccountName())
                .toAccountId(transfer.getToAccount().getId())
                .toAccountName(transfer.getToAccount().getAccountName())
                .amount(transfer.getAmount())
                .transferDate(transfer.getTransferDate())
                .note(transfer.getNote())
                .createdAt(transfer.getCreatedAt())
                .build();
    }
}
