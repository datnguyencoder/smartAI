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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PurchaseIntegrationTest {

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
    void tcPur02_receiveWithoutExpiryRejected() throws Exception {
        MvcResult items = mockMvc.perform(
                        org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/v1/items")
                                .header("Authorization", "Bearer " + warehouseToken))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode arr = objectMapper.readTree(items.getResponse().getContentAsString()).path("data");
        Long milkItemId = null;
        for (JsonNode n : arr) {
            if (n.path("itemCode").asText("").contains("MILK")) {
                milkItemId = n.path("id").asLong();
                break;
            }
        }
        if (milkItemId == null) return;

        // Try to create PO without expiryDate for milk (which requires expiry)
        String createPo = """
            {"supplierId":1,"locationId":1,"items":[{"itemId":%d,"quantity":5,"unitPrice":25000}]}
            """.formatted(milkItemId);
        mockMvc.perform(post("/api/v1/purchase-orders")
                        .header("Authorization", "Bearer " + warehouseToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createPo))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Sản phẩm bắt buộc phải nhập HSD và phải lớn hơn ngày hiện tại."));
    }
}
