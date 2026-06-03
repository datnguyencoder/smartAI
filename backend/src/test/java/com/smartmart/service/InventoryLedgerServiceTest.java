package com.smartmart.service;

import com.smartmart.entity.*;
import com.smartmart.enums.InventoryActionType;
import com.smartmart.enums.ReferenceType;
import com.smartmart.exception.InsufficientStockException;
import com.smartmart.repository.CurrentInventoryRepository;
import com.smartmart.repository.InventoryLogRepository;
import com.smartmart.repository.ItemLotRepository;
import com.smartmart.service.impl.InventoryLedgerServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryLedgerServiceTest {

    @Mock
    private CurrentInventoryRepository currentInventoryRepository;
    @Mock
    private InventoryLogRepository inventoryLogRepository;
    @Mock
    private ItemLotRepository itemLotRepository;

    private InventoryLedgerService ledgerService;

    @BeforeEach
    void setUp() {
        ledgerService = new InventoryLedgerServiceImpl(
                currentInventoryRepository, inventoryLogRepository, itemLotRepository);
    }

    @Test
    void applyMovement_outInsufficientStock() {
        Item item = Item.builder().itemName("Test").build();
        item.setId(1L);
        Location loc = Location.builder().locationName("Kho").build();
        loc.setId(2L);
        CurrentInventory inv = CurrentInventory.builder()
                .item(item).location(loc).quantity(new BigDecimal("5")).reservedQuantity(BigDecimal.ZERO).build();
        when(currentInventoryRepository.findByItemLocationLot(1L, 2L, null)).thenReturn(Optional.of(inv));

        assertThatThrownBy(() -> ledgerService.applyMovement(
                item, loc, null, new BigDecimal("-10"),
                InventoryActionType.SALE, ReferenceType.ORDER, 1L, null, null))
                .isInstanceOf(InsufficientStockException.class);
    }

    @Test
    void allocateFefo_picksEarliestExpiry() {
        Item item = Item.builder().hasExpiry(true).build();
        item.setId(1L);
        Location loc = Location.builder().locationName("Kho").build();
        loc.setId(2L);
        ItemLot lotEarly = ItemLot.builder().expiryDate(LocalDate.now().plusDays(5)).build();
        lotEarly.setId(10L);
        ItemLot lotLate = ItemLot.builder().expiryDate(LocalDate.now().plusDays(30)).build();
        lotLate.setId(11L);
        CurrentInventory invEarly = CurrentInventory.builder()
                .item(item).location(loc).lot(lotEarly)
                .quantity(new BigDecimal("3")).reservedQuantity(BigDecimal.ZERO).build();
        when(currentInventoryRepository.findByItemId(1L)).thenReturn(List.of(invEarly));

        List<InventoryLedgerService.LotAllocation> allocations =
                ledgerService.allocateFefo(item, loc, new BigDecimal("2"));

        assertThat(allocations).hasSize(1);
        assertThat(allocations.get(0).lot().getId()).isEqualTo(10L);
        assertThat(allocations.get(0).quantity()).isEqualByComparingTo("2");
    }
}
