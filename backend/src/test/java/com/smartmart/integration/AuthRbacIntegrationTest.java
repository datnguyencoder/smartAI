package com.smartmart.integration;

import com.smartmart.entity.User;
import com.smartmart.enums.Role;
import com.smartmart.enums.UserStatus;
import com.smartmart.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
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
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

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
    void forecastRecommendationsAllowedForAdminAndManagerOnly() throws Exception {
        ensureAnalystUser();

        String adminToken = loginAs("admin", "admin123");
        String managerToken = loginAs("manager", "manager123");
        String warehouseToken = loginAs("warehouse", "warehouse123");
        String staffToken = loginAs("staff", "staff123");
        String analystToken = loginAs("analyst", "analyst123");

        mockMvc.perform(get("/api/v1/forecast/recommendations")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/forecast/recommendations")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/forecast/recommendations")
                        .header("Authorization", "Bearer " + warehouseToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/forecast/recommendations")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/forecast/recommendations")
                        .header("Authorization", "Bearer " + analystToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void analystCanReadForecastAndReportsButCannotOperateForecast() throws Exception {
        ensureAnalystUser();
        String analystToken = loginAs("analyst", "analyst123");

        mockMvc.perform(get("/api/v1/forecast/results")
                        .header("Authorization", "Bearer " + analystToken))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/forecast/ai-status")
                        .header("Authorization", "Bearer " + analystToken))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/reports/sales")
                        .header("Authorization", "Bearer " + analystToken))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/forecast/train")
                        .header("Authorization", "Bearer " + analystToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/v1/forecast/run")
                        .header("Authorization", "Bearer " + analystToken))
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

    private void ensureAnalystUser() {
        if (userRepository.findByUsername("analyst").isPresent()) {
            return;
        }
        userRepository.save(User.builder()
                .username("analyst")
                .password(passwordEncoder.encode("analyst123"))
                .email("analyst@smartmart.com")
                .fullName("Chuyên viên phân tích")
                .role(Role.ROLE_ANALYST)
                .status(UserStatus.ACTIVE)
                .build());
    }
}
