package com.smartmart.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
public class TestWebSocketController {

    @MessageMapping("/hello")
    @SendTo("/topic/greetings")
    public Map<String, String> greeting(Map<String, String> message) {
        return Map.of("message", "world");
    }
}
