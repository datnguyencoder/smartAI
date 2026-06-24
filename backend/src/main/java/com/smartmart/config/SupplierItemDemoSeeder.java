package com.smartmart.config;

import com.smartmart.entity.Item;
import com.smartmart.entity.Supplier;
import com.smartmart.entity.SupplierItem;
import com.smartmart.repository.ItemRepository;
import com.smartmart.repository.SupplierItemRepository;
import com.smartmart.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@Profile({"local", "prod", "test"})
@Order(3)
@RequiredArgsConstructor
public class SupplierItemDemoSeeder implements CommandLineRunner {

    private final SupplierRepository supplierRepository;
    private final ItemRepository itemRepository;
    private final SupplierItemRepository supplierItemRepository;

    @Override
    @Transactional
    public void run(String... args) {
        mapBySupplierNameContains("Vinamilk", List.of(
                "MILK-VNM-1L",
                "SUA-VNM-1L",
                "SUA-VNM-1L-ITDUONG",
                "SUA-VNM-1L-KDUONG",
                "SUA-CHUA-VNM",
                "SUA-CHUA-VNM-NHA-DAM",
                "PROBI-65ML-LOC5"
        ));

        mapBySupplierNameContains("Coca-Cola", List.of(
                "COCA-330",
                "COCA-ZERO-330",
                "COCA-LIGHT-330",
                "LAVIE-500",
                "LAVIE-1500",
                "AQUAFINA-500",
                "REDBULL-250",
                "STING-DAU-330",
                "TRA-XANH-0",
                "TEA-PLUS-450"
        ));

        mapBySupplierNameContains("PepsiCo", List.of(
                "PEPSI-330"
        ));

        mapBySupplierNameContains("Trung Nguyên", List.of(
                "COFFEE-G7",
                "COFFEE-G7-DEN"
        ));

        mapBySupplierNameContains("Nestlé", List.of(
                "NESCAFE-3IN1"
        ));

        mapBySupplierNameContains("gạo", List.of(
                "GAO-ST25-5KG",
                "GAO-JASMINE-5KG",
                "GAO-NANG-HOA-5KG"
        ));

        mapBySupplierNameContains("Colgate", List.of(
                "KDR-COLGATE-180"
        ));

        mapBySupplierNameContains("Acecook", List.of(
                "MI-HAOHAO",
                "MI-HAOHAO-TOM",
                "MI-HAOHAO-SA-TE",
                "MI-HAOHAO-GA-VANG",
                "MI-HAOHAO-XAO-TOM-HANH",
                "MI-KOKOMI-90"
        ));

        mapBySupplierNameContains("Masan", List.of(
                "MI-OMACHI",
                "MI-OMACHI-BO-HAM",
                "NUOC-MAM-NN",
                "NUOC-MAM-NN-750",
                "NUOC-TUONG-CHINSU",
                "TUONG-OT-CHINSU",
                "HAT-NEM-KNORR-400",
                "DAU-SIMPLY-1L",
                "DAU-TUONG-SIMPLY-1L",
                "DAU-CAI-TUONG-AN-1L"
        ));

        mapBySupplierNameContains("Unilever", List.of(
                "BOT-GIAT-OMO",
                "BOT-GIAT-OMO-FRONT-2KG",
                "SUNLIGHT-CHANH-750",
                "COMFORT-800",
                "LIFEBUOY-HANDWASH-450",
                "KDR-PS-180",
                "KDR-PS-MUOI-180",
                "DAU-GOI-CLEAR-630",
                "SUA-TAM-LIFEBUOY-850"
        ));

        mapBySupplierNameContains("Orion", List.of(
                "BANH-CHOCOPIE-12P",
                "BANH-CUSTAS-12P",
                "BANH-OISHI",
                "BANH-OISHI-BAP-NGOT",
                "KEO-ALPENLIEBE",
                "KEO-ALPENLIEBE-DAU",
                "SNACK-LAYS",
                "SNACK-LAYS-BBQ",
                "SNACK-POCA-MUC"
        ));

        mapBySupplierNameContains("Vinamilk", List.of(
                "SUA-TH-1L-ITDUONG",
                "SUA-DALAT-1L",
                "SUA-CHUA-TH-LOC4",
                "PHO-MAI-BELCUBE",
                "BANH-FLAN-4H"
        ));
    }

    private void mapBySupplierNameContains(String supplierKeyword, List<String> itemCodes) {
        Supplier supplier = supplierRepository.findAll().stream()
                .filter(s -> s.getSupplierName() != null
                        && s.getSupplierName().toLowerCase().contains(supplierKeyword.toLowerCase()))
                .findFirst()
                .orElse(null);

        if (supplier == null) {
            return;
        }

        for (String itemCode : itemCodes) {
            itemRepository.findByItemCode(itemCode)
                    .ifPresent(item -> upsertSupplierItem(supplier, item));
        }
    }

    private void upsertSupplierItem(Supplier supplier, Item item) {
        boolean exists = supplierItemRepository
                .existsBySupplierIdAndSkuItemIgnoreCase(supplier.getId(), item.getItemCode());

        if (exists) {
            return;
        }

        supplierItemRepository.save(SupplierItem.builder()
                .supplier(supplier)
                .skuItem(item.getItemCode())
                .defaultCostPrice(item.getCostPrice())
                .active(true)
                .build());
    }
}
