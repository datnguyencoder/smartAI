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
class StocktakeIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    private String warehouseToken;
    private String managerToken;

    @BeforeEach
    void login() throws Exception {
        warehouseToken = loginAs("warehouse", "warehouse123");
        managerToken = loginAs("manager", "manager123");
    }

    @Test
    void warehouseSubmitsCountAndManagerApprovalSetsExactInventory() throws Exception {
        JsonNode inventoryRow = inventoryRows(warehouseToken).get(0);
        long itemId = inventoryRow.path("itemId").asLong();
        long locationId = inventoryRow.path("locationId").asLong();
        Long lotId = nullableLong(inventoryRow, "lotId");
        BigDecimal before = inventoryRow.path("quantity").decimalValue();
        BigDecimal counted = before.add(BigDecimal.valueOf(2));

        Map<String, Object> line = new LinkedHashMap<>();
        line.put("itemId", itemId);
        if (lotId != null) line.put("lotId", lotId);
        line.put("actualQuantity", counted);

        MvcResult created = mockMvc.perform(post("/api/v1/stocktakes")
                        .header("Authorization", "Bearer " + warehouseToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "locationId", locationId,
                                "note", "Kiểm kê tích hợp",
                                "items", List.of(line)
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status").value("DRAFT"))
                .andReturn();
        long stocktakeId = objectMapper.readTree(created.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        mockMvc.perform(post("/api/v1/stocktakes/" + stocktakeId + "/approve")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/v1/stocktakes/" + stocktakeId + "/submit")
                        .header("Authorization", "Bearer " + warehouseToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("items", List.of(line)))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PENDING_APPROVAL"))
                .andExpect(jsonPath("$.data.submittedBy").isNumber())
                .andExpect(jsonPath("$.data.items[0].variance").value(2));

        assertThat(findInventoryRow(warehouseToken, itemId, locationId, lotId).path("quantity").decimalValue())
                .isEqualByComparingTo(before);

        mockMvc.perform(post("/api/v1/stocktakes/" + stocktakeId + "/approve")
                        .header("Authorization", "Bearer " + warehouseToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/stocktakes/" + stocktakeId + "/approve")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.data.approvedBy").isNumber())
                .andExpect(jsonPath("$.data.items[0].actualQuantity").value(counted.doubleValue()));

        assertThat(findInventoryRow(managerToken, itemId, locationId, lotId).path("quantity").decimalValue())
                .isEqualByComparingTo(counted);

        mockMvc.perform(post("/api/v1/stocktakes/" + stocktakeId + "/approve")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isBadRequest());
    }

    private JsonNode inventoryRows(String token) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/inventory")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode rows = objectMapper.readTree(result.getResponse().getContentAsString()).path("data");
        assertThat(rows.isArray()).isTrue();
        assertThat(rows.size()).isPositive();
        return rows;
    }

    private JsonNode findInventoryRow(String token, long itemId, long locationId, Long lotId) throws Exception {
        for (JsonNode row : inventoryRows(token)) {
            boolean sameLot = lotId == null
                    ? row.path("lotId").isMissingNode() || row.path("lotId").isNull()
                    : row.path("lotId").asLong() == lotId;
            if (row.path("itemId").asLong() == itemId
                    && row.path("locationId").asLong() == locationId
                    && sameLot) {
                return row;
            }
        }
        throw new AssertionError("Inventory row not found after stocktake");
    }

    private Long nullableLong(JsonNode node, String field) {
        return node.path(field).isMissingNode() || node.path(field).isNull()
                ? null
                : node.path(field).asLong();
    }

    private String loginAs(String username, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "username", username,
                                "password", password
                        ))))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
    }
}
