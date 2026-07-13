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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ShiftIntegrationTest {
    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @Test
    void shiftMovesThroughStaffManagerAndAdminReview() throws Exception {
        String staff = loginAs("staff", "staff123");
        String manager = loginAs("manager", "manager123");
        String admin = loginAs("admin", "admin123");

        MvcResult opened = postJson("/api/v1/shifts/open", staff, "{\"note\":\"Bắt đầu ca bình thường\"}", 201)
                .andExpect(jsonPath("$.data.status").value("OPEN"))
                .andExpect(jsonPath("$.data.openingCash").value(0))
                .andReturn();
        long shiftId = objectMapper.readTree(opened.getResponse().getContentAsString()).path("data").path("id").asLong();

        postJson("/api/v1/shifts/open", staff, "{\"note\":\"Không được mở trùng\"}", 400);
        postJson("/api/v1/shifts/" + shiftId + "/close", staff,
                "{\"closingCash\":1000,\"matchesSystemData\":false,\"note\":\"Đã kiểm tra đơn trong ca\"}", 400);
        postJson("/api/v1/shifts/" + shiftId + "/close", staff,
                "{\"closingCash\":1000,\"matchesSystemData\":false,\"note\":\"Đã kiểm tra đơn trong ca\",\"varianceReason\":\"Giao dịch chuyển khoản ghi nhầm tiền mặt\"}", 200)
                .andExpect(jsonPath("$.data.status").value("PENDING_REVIEW"))
                .andExpect(jsonPath("$.data.staffMismatchReported").value(true));

        postJson("/api/v1/shifts/" + shiftId + "/manager-review", staff,
                "{\"note\":\"Không được phép\"}", 403);
        postJson("/api/v1/shifts/" + shiftId + "/request-staff-update", manager,
                "{\"note\":\"Vui lòng bổ sung mã giao dịch\"}", 200)
                .andExpect(jsonPath("$.data.status").value("NEEDS_STAFF_UPDATE"));
        postJson("/api/v1/shifts/" + shiftId + "/staff-explanation", staff,
                "{\"note\":\"Mã giao dịch NH-001\"}", 200)
                .andExpect(jsonPath("$.data.status").value("PENDING_REVIEW"));
        postJson("/api/v1/shifts/" + shiftId + "/manager-review", manager,
                "{\"note\":\"Đã kiểm tra chứng từ\"}", 200)
                .andExpect(jsonPath("$.data.status").value("REVIEWED_BY_MANAGER"));
        postJson("/api/v1/shifts/" + shiftId + "/approve", manager,
                "{\"note\":\"Không được phép\"}", 403);
        postJson("/api/v1/shifts/" + shiftId + "/approve", admin,
                "{\"note\":\"Phê duyệt cuối\"}", 200)
                .andExpect(jsonPath("$.data.status").value("APPROVED"));

        mockMvc.perform(get("/api/v1/shifts/" + shiftId + "/activity")
                        .header("Authorization", "Bearer " + staff))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.content[0].actorRole").exists());

        postJson("/api/v1/shifts/open", staff, "{\"note\":\"Mở ca kế tiếp\"}", 201)
                .andExpect(jsonPath("$.data.openingCash").value(1000))
                .andExpect(jsonPath("$.data.openingBalanceSourceShiftId").value(shiftId));
    }

    private org.springframework.test.web.servlet.ResultActions postJson(
            String path, String token, String body, int expectedStatus) throws Exception {
        return mockMvc.perform(post(path)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().is(expectedStatus));
    }

    private String loginAs(String username, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        return body.path("data").path("accessToken").asText();
    }
}
