package com.smartmart.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthRbacIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void staffCannotAccessUsersApi() throws Exception {
        String token = loginAs("staff", "staff123");
        mockMvc.perform(get("/api/v1/users").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void warehouseCannotCreateOrder() throws Exception {
        String token = loginAs("warehouse", "warehouse123");
        mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"customerName\":\"Test\",\"items\":[{\"itemId\":1,\"quantity\":1}]}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void logoutInvalidatesToken() throws Exception {
        var login = loginResponse("staff", "staff123");
        String access = login.path("accessToken").asText();
        String refresh = login.path("refreshToken").asText();
        mockMvc.perform(post("/api/v1/auth/logout")
                        .header("Authorization", "Bearer " + access)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refresh + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
        mockMvc.perform(get("/api/v1/items").header("Authorization", "Bearer " + access))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refresh + "\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void refreshRotatesTokens() throws Exception {
        var login = loginResponse("staff", "staff123");
        String oldRefresh = login.path("refreshToken").asText();
        var refreshed = mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + oldRefresh + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").exists())
                .andExpect(jsonPath("$.data.refreshToken").exists())
                .andReturn();
        String newRefresh = com.fasterxml.jackson.databind.json.JsonMapper.builder().build()
                .readTree(refreshed.getResponse().getContentAsString())
                .path("data").path("refreshToken").asText();
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + oldRefresh + "\"}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + newRefresh + "\"}"))
                .andExpect(status().isOk());
    }

    private String loginAs(String username, String password) throws Exception {
        return loginResponse(username, password).path("accessToken").asText();
    }

    private com.fasterxml.jackson.databind.JsonNode loginResponse(String username, String password) throws Exception {
        var result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return com.fasterxml.jackson.databind.json.JsonMapper.builder().build()
                .readTree(result.getResponse().getContentAsString())
                .path("data");
    }
}
