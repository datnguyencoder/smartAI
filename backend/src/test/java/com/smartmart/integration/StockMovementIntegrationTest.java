package com.smartmart.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class StockMovementIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String warehouseToken;

    @BeforeEach
    void login() throws Exception {
        MvcResult login = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"warehouse\",\"password\":\"warehouse123\"}"))
                .andExpect(status().isOk())
                .andReturn();
        warehouseToken = objectMapper.readTree(login.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
    }

    @Test
    void stockAdjustmentUpdatesInventoryAndLogsMovement() throws Exception {
        JsonNode row = firstInventoryRow();
        long itemId = row.path("itemId").asLong();
        long locationId = row.path("locationId").asLong();
        Long lotId = row.path("lotId").isMissingNode() || row.path("lotId").isNull()
                ? null
                : row.path("lotId").asLong();
        BigDecimal before = new BigDecimal(row.path("quantity").asText("0"));
        BigDecimal actualQuantity = before.add(BigDecimal.valueOf(3));

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("itemId", itemId);
        payload.put("locationId", locationId);
        if (lotId != null) payload.put("lotId", lotId);
        payload.put("actualQuantity", actualQuantity);
        payload.put("note", "CI điều chỉnh tồn");

        mockMvc.perform(post("/api/v1/inventory/adjustments")
                        .header("Authorization", "Bearer " + warehouseToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.actionType").value("ADJUSTMENT"))
                .andExpect(jsonPath("$.data.quantity").value(3));

        JsonNode updated = findInventoryRow(itemId, locationId, lotId);
        assertThat(new BigDecimal(updated.path("quantity").asText("0"))).isEqualByComparingTo(actualQuantity);

        mockMvc.perform(get("/api/v1/inventory/logs")
                        .header("Authorization", "Bearer " + warehouseToken)
                        .param("actionType", "ADJUSTMENT")
                        .param("itemId", String.valueOf(itemId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].actionType").value("ADJUSTMENT"));
    }

    @Test
    void stockTransferMovesQuantityBetweenLocations() throws Exception {
        JsonNode source = firstInventoryRowWithAvailable();
        long itemId = source.path("itemId").asLong();
        long fromLocationId = source.path("locationId").asLong();
        Long lotId = source.path("lotId").isMissingNode() || source.path("lotId").isNull()
                ? null
                : source.path("lotId").asLong();
        long toLocationId = createLocation("CI-Transfer-" + System.currentTimeMillis());

        BigDecimal beforeSource = new BigDecimal(source.path("quantity").asText("0"));
        BigDecimal transferQty = BigDecimal.ONE;

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("itemId", itemId);
        payload.put("fromLocationId", fromLocationId);
        payload.put("toLocationId", toLocationId);
        if (lotId != null) payload.put("lotId", lotId);
        payload.put("quantity", transferQty);
        payload.put("note", "CI điều chuyển kho");

        mockMvc.perform(post("/api/v1/inventory/transfers")
                        .header("Authorization", "Bearer " + warehouseToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.actionType").value("TRANSFER_OUT"))
                .andExpect(jsonPath("$.data.quantity").value(1));

        JsonNode updatedSource = findInventoryRow(itemId, fromLocationId, lotId);
        assertThat(new BigDecimal(updatedSource.path("quantity").asText("0")))
                .isEqualByComparingTo(beforeSource.subtract(transferQty));

        JsonNode target = findInventoryRow(itemId, toLocationId, lotId);
        assertThat(new BigDecimal(target.path("quantity").asText("0"))).isEqualByComparingTo(transferQty);
    }

    @Test
    void stockTransferRejectsSameLocation() throws Exception {
        JsonNode source = firstInventoryRowWithAvailable();
        long itemId = source.path("itemId").asLong();
        long locationId = source.path("locationId").asLong();

        mockMvc.perform(post("/api/v1/inventory/transfers")
                        .header("Authorization", "Bearer " + warehouseToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "itemId", itemId,
                                "fromLocationId", locationId,
                                "toLocationId", locationId,
                                "quantity", 1
                        ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void stockTransferRejectsInsufficientStock() throws Exception {
        JsonNode source = firstInventoryRowWithAvailable();
        long itemId = source.path("itemId").asLong();
        long fromLocationId = source.path("locationId").asLong();
        Long lotId = source.path("lotId").isMissingNode() || source.path("lotId").isNull()
                ? null
                : source.path("lotId").asLong();
        long toLocationId = createLocation("CI-Insufficient-" + System.currentTimeMillis());

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("itemId", itemId);
        payload.put("fromLocationId", fromLocationId);
        payload.put("toLocationId", toLocationId);
        if (lotId != null) payload.put("lotId", lotId);
        payload.put("quantity", 999999);

        mockMvc.perform(post("/api/v1/inventory/transfers")
                        .header("Authorization", "Bearer " + warehouseToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    private JsonNode firstInventoryRow() throws Exception {
        JsonNode rows = inventoryRows();
        assertThat(rows.isArray()).isTrue();
        assertThat(rows.size()).isPositive();
        return rows.get(0);
    }

    private JsonNode firstInventoryRowWithAvailable() throws Exception {
        for (JsonNode row : inventoryRows()) {
            if (new BigDecimal(row.path("availableQuantity").asText("0")).compareTo(BigDecimal.ZERO) > 0) {
                return row;
            }
        }
        throw new AssertionError("No inventory row with available stock found");
    }

    private JsonNode findInventoryRow(long itemId, long locationId, Long lotId) throws Exception {
        for (JsonNode row : inventoryRows()) {
            boolean sameLot = lotId == null
                    ? row.path("lotId").isMissingNode() || row.path("lotId").isNull()
                    : row.path("lotId").asLong() == lotId;
            if (row.path("itemId").asLong() == itemId && row.path("locationId").asLong() == locationId && sameLot) {
                return row;
            }
        }
        throw new AssertionError("Inventory row not found");
    }

    private JsonNode inventoryRows() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/inventory")
                        .header("Authorization", "Bearer " + warehouseToken))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).path("data");
    }

    private long createLocation(String name) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/locations")
                        .header("Authorization", "Bearer " + warehouseToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "locationName", name,
                                "locationType", "WAREHOUSE"
                        ))))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("id").asLong();
    }
}
