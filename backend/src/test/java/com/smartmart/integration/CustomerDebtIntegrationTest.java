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

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CustomerDebtIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String staffToken;
    private Long itemId;

    @BeforeEach
    void loginAndLoadItem() throws Exception {
        MvcResult login = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"staff\",\"password\":\"staff123\"}"))
                .andExpect(status().isOk())
                .andReturn();
        staffToken = objectMapper.readTree(login.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();

        MvcResult items = mockMvc.perform(get("/api/v1/items")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode arr = objectMapper.readTree(items.getResponse().getContentAsString()).path("data");
        assertThat(arr.size()).isPositive();
        itemId = arr.get(0).path("id").asLong();
    }

    @Test
    void payLaterOrderCreatesCustomerDebtAndSupportsPartialPayment() throws Exception {
        String phone = "0912000999";
        MvcResult order = mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "customerName", "Khách ghi nợ",
                                "customerPhone", phone,
                                "paymentMethod", "PAY_LATER",
                                "items", java.util.List.of(Map.of("itemId", itemId, "quantity", 1))
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.paymentMethod").value("PAY_LATER"))
                .andReturn();
        String orderCode = objectMapper.readTree(order.getResponse().getContentAsString())
                .path("data").path("orderCode").asText();

        MvcResult debts = mockMvc.perform(get("/api/v1/customer-debts")
                        .header("Authorization", "Bearer " + staffToken)
                        .param("status", "UNPAID"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();

        JsonNode arr = objectMapper.readTree(debts.getResponse().getContentAsString()).path("data");
        JsonNode debt = null;
        for (JsonNode node : arr) {
            if (orderCode.equals(node.path("orderCode").asText())) {
                debt = node;
                break;
            }
        }
        assertThat(debt).isNotNull();

        mockMvc.perform(post("/api/v1/customer-debts/" + debt.path("id").asLong() + "/payments")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"amount\":1,\"paymentMethod\":\"CASH\",\"note\":\"Thu test\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("PARTIAL"));
    }

    @Test
    void payLaterRequiresCustomerPhone() throws Exception {
        mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "customerName", "Khách lẻ",
                                "paymentMethod", "PAY_LATER",
                                "items", java.util.List.of(Map.of("itemId", itemId, "quantity", 1))
                        ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }
}
