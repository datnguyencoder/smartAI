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
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PosIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String token;
    private Long itemId;

    @BeforeEach
    void loginAndLoadItem() throws Exception {
        MvcResult login = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"staff\",\"password\":\"staff123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();
        JsonNode loginBody = objectMapper.readTree(login.getResponse().getContentAsString());
        token = loginBody.path("data").path("accessToken").asText();

        MvcResult items = mockMvc.perform(get("/api/v1/items")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode arr = objectMapper.readTree(items.getResponse().getContentAsString()).path("data");
        assertThat(arr.isArray()).isTrue();
        assertThat(arr.size()).isPositive();
        assertThat(arr.get(0).path("imageUrl").asText()).isNotBlank();
        itemId = arr.get(0).path("id").asLong();
    }

    @Test
    void tcPos01_checkoutReducesStock() throws Exception {
        MvcResult before = mockMvc.perform(get("/api/v1/items/" + itemId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        BigDecimal stockBefore = new BigDecimal(
                objectMapper.readTree(before.getResponse().getContentAsString())
                        .path("data").path("totalAvailableQty").asText("0"));

        mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "customerName", "Khách lẻ",
                                "paymentMethod", "CASH",
                                "items", java.util.List.of(Map.of("itemId", itemId, "quantity", 1))
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));

        MvcResult after = mockMvc.perform(get("/api/v1/items/" + itemId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        BigDecimal stockAfter = new BigDecimal(
                objectMapper.readTree(after.getResponse().getContentAsString())
                        .path("data").path("totalAvailableQty").asText("0"));

        assertThat(stockAfter).isEqualByComparingTo(stockBefore.subtract(BigDecimal.ONE));
    }

    @Test
    void tcPos02_insufficientStockRejected() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "customerName", "Khách lẻ",
                "paymentMethod", "CASH",
                "items", java.util.List.of(Map.of("itemId", itemId, "quantity", 999999))
        ));
        mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().is4xxClientError())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void tcPos03_loyaltyPointsEarnAndRedeemAutomatically() throws Exception {
        String phone = "0909000111";

        MvcResult firstOrder = mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "customerName", "Khách Loyalty",
                                "customerPhone", phone,
                                "paymentMethod", "CASH",
                                "items", java.util.List.of(Map.of("itemId", itemId, "quantity", 1))
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.loyaltyPointsEarned").exists())
                .andExpect(jsonPath("$.data.customerLoyaltyPoints").exists())
                .andReturn();

        JsonNode firstData = objectMapper.readTree(firstOrder.getResponse().getContentAsString()).path("data");
        int firstEarned = firstData.path("loyaltyPointsEarned").asInt();
        int firstBalance = firstData.path("customerLoyaltyPoints").asInt();
        assertThat(firstEarned).isPositive();
        assertThat(firstBalance).isGreaterThanOrEqualTo(firstEarned);

        MvcResult secondOrder = mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "customerName", "Khách Loyalty",
                                "customerPhone", phone,
                                "paymentMethod", "CASH",
                                "loyaltyPointsRedeemed", 1,
                                "items", java.util.List.of(Map.of("itemId", itemId, "quantity", 1))
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.loyaltyPointsRedeemed").value(1))
                .andExpect(jsonPath("$.data.loyaltyPointsEarned").exists())
                .andExpect(jsonPath("$.data.customerLoyaltyPoints").exists())
                .andReturn();

        JsonNode secondData = objectMapper.readTree(secondOrder.getResponse().getContentAsString()).path("data");
        int secondEarned = secondData.path("loyaltyPointsEarned").asInt();
        int secondBalance = secondData.path("customerLoyaltyPoints").asInt();
        assertThat(secondBalance).isEqualTo(firstBalance - 1 + secondEarned);
    }
}
