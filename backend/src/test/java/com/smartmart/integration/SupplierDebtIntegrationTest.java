package com.smartmart.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SupplierDebtIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void deferredPurchaseCreatesDebtAndSupportsPartialPayment() throws Exception {
        String managerToken = loginAs("manager", "manager123");
        PoLine poLine = resolveSupplierPoLine(managerToken, 1L);

        String expiryField = poLine.hasExpiry()
                ? ", \"expiryDate\": \"" + LocalDate.now().plusMonths(6) + "\""
                : "";

        String createPoBody = """
                {
                  "supplierId": 1,
                  "locationId": 1,
                  "paymentDeferred": true,
                  "items": [
                    { "itemId": %d, "quantity": 2, "unitPrice": 10000%s }
                  ]
                }
                """.formatted(poLine.itemId(), expiryField);

        MvcResult created = mockMvc.perform(post("/api/v1/purchase-orders")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createPoBody))
                .andExpect(status().isCreated())
                .andReturn();
        long purchaseOrderId = objectMapper.readTree(created.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        mockMvc.perform(post("/api/v1/purchase-orders/" + purchaseOrderId + "/receive")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("COMPLETED"));

        JsonNode debts = fetchSupplierDebts(managerToken, 1L);
        JsonNode debt = null;
        for (JsonNode row : debts) {
            if (row.path("purchaseOrderId").asLong() == purchaseOrderId) {
                debt = row;
                break;
            }
        }
        assertThat(debt).isNotNull();
        long debtId = debt.path("id").asLong();
        BigDecimal amount = new BigDecimal(debt.path("amount").asText());

        mockMvc.perform(post("/api/v1/supplier-debts/" + debtId + "/payments")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"amount\":5000,\"paymentMethod\":\"BANK_TRANSFER\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PARTIAL"))
                .andExpect(jsonPath("$.data.paidAmount").value(5000));

        mockMvc.perform(post("/api/v1/supplier-debts/" + debtId + "/payments")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"amount\":" + amount + ",\"paymentMethod\":\"BANK_TRANSFER\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));

        BigDecimal remaining = amount.subtract(BigDecimal.valueOf(5000));
        mockMvc.perform(post("/api/v1/supplier-debts/" + debtId + "/payments")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"amount\":" + remaining + ",\"paymentMethod\":\"BANK_TRANSFER\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PAID"))
                .andExpect(jsonPath("$.data.remainingAmount").value(0));
    }

    private JsonNode fetchSupplierDebts(String token, Long supplierId) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/supplier-debts/supplier/" + supplierId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).path("data");
    }

    private long findNonExpiryItemId(String token) throws Exception {
        MvcResult items = mockMvc.perform(get("/api/v1/items")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode rows = objectMapper.readTree(items.getResponse().getContentAsString()).path("data");
        for (JsonNode row : rows) {
            if (!row.path("hasExpiry").asBoolean(false)) {
                return row.path("id").asLong();
            }
        }
        throw new AssertionError("Test seed must contain at least one non-expiry item");
    }

    private record PoLine(long itemId, boolean hasExpiry) {}

    private PoLine resolveSupplierPoLine(String token, long supplierId) throws Exception {
        MvcResult mapped = mockMvc.perform(get("/api/v1/supplier-items?supplierId=" + supplierId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode mappedRows = objectMapper.readTree(mapped.getResponse().getContentAsString()).path("data");
        if (mappedRows.isArray()) {
            for (JsonNode mappedRow : mappedRows) {
                String sku = mappedRow.path("skuItem").asText();
                JsonNode item = findItemByCode(token, sku);
                if (item != null) {
                    return new PoLine(item.path("id").asLong(), item.path("hasExpiry").asBoolean(false));
                }
            }
        }
        long itemId = findNonExpiryItemId(token);
        String itemCode = findItemCode(token, itemId);
        mockMvc.perform(post("/api/v1/supplier-items")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"supplierId":%d,"skuItem":"%s","defaultCostPrice":10000}
                                """.formatted(supplierId, itemCode)))
                .andExpect(status().isCreated());
        return new PoLine(itemId, false);
    }

    private JsonNode findItemByCode(String token, String itemCode) throws Exception {
        MvcResult items = mockMvc.perform(get("/api/v1/items")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode rows = objectMapper.readTree(items.getResponse().getContentAsString()).path("data");
        for (JsonNode row : rows) {
            if (itemCode.equalsIgnoreCase(row.path("itemCode").asText())) {
                return row;
            }
        }
        return null;
    }

    private String findItemCode(String token, long itemId) throws Exception {
        MvcResult items = mockMvc.perform(get("/api/v1/items")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode rows = objectMapper.readTree(items.getResponse().getContentAsString()).path("data");
        for (JsonNode row : rows) {
            if (row.path("id").asLong() == itemId) {
                return row.path("itemCode").asText();
            }
        }
        throw new AssertionError("Item not found: " + itemId);
    }

    private String loginAs(String username, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
    }
}
