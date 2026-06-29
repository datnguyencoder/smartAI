package com.smartmart.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class FinanceIntegrationTest {
    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void managerCanCreateIncomeExpenseAndReadSummary() throws Exception {
        String token = login("manager", "manager123");
        createTx(token, "INCOME", "other-income", 1000);
        createTx(token, "EXPENSE", "utilities", 300);

        mockMvc.perform(get("/api/v1/finance/summary").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalIncome").exists())
                .andExpect(jsonPath("$.data.totalExpense").exists())
                .andExpect(jsonPath("$.data.netCashFlow").exists());
    }

    @Test
    void staffCannotAccessFinance() throws Exception {
        String token = login("staff", "staff123");
        mockMvc.perform(get("/api/v1/finance/transactions").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    private void createTx(String token, String type, int amount) throws Exception {
        createTx(token, type, "test", amount);
    }

    private void createTx(String token, String type, String category, int amount) throws Exception {
        mockMvc.perform(post("/api/v1/finance/transactions")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "type", type,
                                "category", category,
                                "amount", amount,
                                "paymentAccount", "CASH",
                                "transactionDate", LocalDate.now().toString()
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));
    }

    private String login(String username, String password) throws Exception {
        var result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).path("data").path("accessToken").asText();
    }
}
