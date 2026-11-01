package com.smartcity.controller;

import com.smartcity.dto.AuthResponse;
import com.smartcity.dto.LoginRequest;
import com.smartcity.model.User;
import com.smartcity.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        AuthResponse response = userService.authenticate(request);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(401).body(response);
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> payload) {
        try {
            User citizen = userService.registerCitizen(
                    payload.get("fullName"),
                    payload.get("email"),
                    payload.get("password"),
                    payload.get("phone"),
                    payload.get("areaName")
            );
            return ResponseEntity.ok(new AuthResponse(
                    true,
                    "Registration successful",
                    citizen.getId(),
                    citizen.getFullName(),
                    citizen.getEmail(),
                    citizen.getRole(),
                    citizen.getAreaName()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
