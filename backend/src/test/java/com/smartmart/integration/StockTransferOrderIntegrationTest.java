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
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class StockTransferOrderIntegrationTest {

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
    void stockTransferOrderConfirmMovesInventory() throws Exception {
        JsonNode source = firstInventoryRowWithAvailable();
        long itemId = source.path("itemId").asLong();
        long fromLocationId = source.path("locationId").asLong();
        Long lotId = nullableLong(source.path("lotId"));
        long toLocationId = createLocation("CI-STO-" + System.currentTimeMillis());

        BigDecimal beforeSource = new BigDecimal(source.path("quantity").asText("0"));
        BigDecimal transferQty = BigDecimal.ONE;

        Map<String, Object> line = new LinkedHashMap<>();
        line.put("itemId", itemId);
        if (lotId != null) line.put("lotId", lotId);
        line.put("quantity", transferQty);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("fromLocationId", fromLocationId);
        payload.put("toLocationId", toLocationId);
        payload.put("note", "CI phiếu điều chuyển");
        payload.put("items", List.of(line));

        MvcResult created = mockMvc.perform(post("/api/v1/stock-transfers")
                        .header("Authorization", "Bearer " + warehouseToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status").value("DRAFT"))
                .andReturn();

        long transferId = objectMapper.readTree(created.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        mockMvc.perform(post("/api/v1/stock-transfers/" + transferId + "/confirm")
                        .header("Authorization", "Bearer " + warehouseToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("COMPLETED"));

        JsonNode updatedSource = findInventoryRow(itemId, fromLocationId, lotId);
        assertThat(new BigDecimal(updatedSource.path("quantity").asText("0")))
                .isEqualByComparingTo(beforeSource.subtract(transferQty));

        JsonNode target = findInventoryRow(itemId, toLocationId, lotId);
        assertThat(new BigDecimal(target.path("quantity").asText("0"))).isEqualByComparingTo(transferQty);
    }

    @Test
    void stockTransferOrderCancelFromDraft() throws Exception {
        JsonNode source = firstInventoryRowWithAvailable();
        long toLocationId = createLocation("CI-STO-Cancel-" + System.currentTimeMillis());

        Map<String, Object> line = Map.of(
                "itemId", source.path("itemId").asLong(),
                "quantity", 1
        );
        Map<String, Object> payload = Map.of(
                "fromLocationId", source.path("locationId").asLong(),
                "toLocationId", toLocationId,
                "items", List.of(line)
        );

        MvcResult created = mockMvc.perform(post("/api/v1/stock-transfers")
                        .header("Authorization", "Bearer " + warehouseToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isCreated())
                .andReturn();
        long transferId = objectMapper.readTree(created.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        mockMvc.perform(post("/api/v1/stock-transfers/" + transferId + "/cancel")
                        .header("Authorization", "Bearer " + warehouseToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CANCELLED"));
    }

    private Long nullableLong(JsonNode node) {
        return node.isMissingNode() || node.isNull() ? null : node.asLong();
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
