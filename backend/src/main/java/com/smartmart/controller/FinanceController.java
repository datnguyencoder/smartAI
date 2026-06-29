package com.smartmart.controller;

import com.smartmart.common.response.ApiResponse;
import com.smartmart.dto.request.CreateFinanceTransactionRequest;
import com.smartmart.dto.request.CreateFinanceCategoryRequest;
import com.smartmart.dto.request.UpdateFinanceCategoryRequest;
import com.smartmart.dto.request.CreateCashAccountRequest;
import com.smartmart.dto.request.CreateAccountTransferRequest;
import com.smartmart.dto.response.FinanceSummaryResponse;
import com.smartmart.dto.response.FinanceTransactionResponse;
import com.smartmart.dto.response.FinanceCategoryResponse;
import com.smartmart.dto.response.CashAccountResponse;
import com.smartmart.dto.response.AccountTransferResponse;
import com.smartmart.enums.FinanceTransactionType;
import com.smartmart.exception.BadRequestException;
import com.smartmart.service.CashAccountService;
import com.smartmart.service.FinanceCategoryService;
import com.smartmart.service.FinanceService;
import com.smartmart.service.SettingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@RestController
@RequestMapping("/api/v1/finance")
@Tag(name = "Finance", description = "Thu chi và dòng tiền")
@SecurityRequirement(name = "bearerAuth")
public class FinanceController {
    private final FinanceService financeService;
    private final FinanceCategoryService financeCategoryService;
    private final CashAccountService cashAccountService;
    private final SettingService settingService;

    public FinanceController(
            FinanceService financeService,
            FinanceCategoryService financeCategoryService,
            CashAccountService cashAccountService,
            SettingService settingService) {
        this.financeService = financeService;
        this.financeCategoryService = financeCategoryService;
        this.cashAccountService = cashAccountService;
        this.settingService = settingService;
    }

    @GetMapping("/transactions")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Danh sách giao dịch thu chi")
    public ResponseEntity<ApiResponse<List<FinanceTransactionResponse>>> list(
            @RequestParam(required = false) FinanceTransactionType type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        validateDateRange(from, to);
        return ResponseEntity.ok(ApiResponse.success(financeService.list(type, from, to)));
    }

    @PostMapping("/transactions")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Tạo giao dịch thu chi")
    public ResponseEntity<ApiResponse<FinanceTransactionResponse>> create(@Valid @RequestBody CreateFinanceTransactionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo giao dịch thu chi thành công", financeService.create(request)));
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Tóm tắt dòng tiền")
    public ResponseEntity<ApiResponse<FinanceSummaryResponse>> summary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        validateDateRange(from, to);
        return ResponseEntity.ok(ApiResponse.success(financeService.summary(from, to)));
    }

    @GetMapping("/categories")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Danh sách danh mục thu chi")
    public ResponseEntity<ApiResponse<List<FinanceCategoryResponse>>> listCategories(
            @RequestParam(required = false) FinanceTransactionType type) {
        return ResponseEntity.ok(ApiResponse.success(financeCategoryService.list(type)));
    }

    @PostMapping("/categories")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Tạo danh mục thu chi")
    public ResponseEntity<ApiResponse<FinanceCategoryResponse>> createCategory(
            @Valid @RequestBody CreateFinanceCategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo danh mục thành công", financeCategoryService.create(request)));
    }

    @PutMapping("/categories/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Cập nhật danh mục thu chi")
    public ResponseEntity<ApiResponse<FinanceCategoryResponse>> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody UpdateFinanceCategoryRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật danh mục thành công",
                financeCategoryService.update(id, request)));
    }

    @GetMapping("/cash-accounts")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Danh sách tài khoản tiền")
    public ResponseEntity<ApiResponse<List<CashAccountResponse>>> listAccounts() {
        return ResponseEntity.ok(ApiResponse.success(cashAccountService.listAll()));
    }

    @PostMapping("/cash-accounts")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Tạo tài khoản tiền")
    public ResponseEntity<ApiResponse<CashAccountResponse>> createAccount(
            @Valid @RequestBody CreateCashAccountRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo tài khoản thành công", cashAccountService.create(request)));
    }

    @PostMapping("/cash-accounts/transfer")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Chuyển tiền giữa các tài khoản")
    public ResponseEntity<ApiResponse<AccountTransferResponse>> transfer(
            @Valid @RequestBody CreateAccountTransferRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Chuyển tiền thành công", cashAccountService.transfer(request)));
    }

    @GetMapping("/cash-accounts/transfers")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @Operation(summary = "Lịch sử chuyển tiền")
    public ResponseEntity<ApiResponse<List<AccountTransferResponse>>> listTransfers() {
        return ResponseEntity.ok(ApiResponse.success(cashAccountService.listTransfers()));
    }

    private void validateDateRange(LocalDate from, LocalDate to) {
        if (from == null || to == null) return;
        if (from.isAfter(to)) throw new BadRequestException("Ngày bắt đầu phải trước ngày kết thúc");
        int maxDays = settingService.getIntValue("report_max_days", 366);
        if (ChronoUnit.DAYS.between(from, to) > maxDays) {
            throw new BadRequestException("Khoảng thời gian báo cáo không được vượt quá " + maxDays + " ngày");
        }
    }
}
