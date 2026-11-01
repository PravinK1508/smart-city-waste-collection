package com.smartcity.service;

import com.smartcity.dto.AuthResponse;
import com.smartcity.dto.LoginRequest;
import com.smartcity.model.User;
import com.smartcity.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public AuthResponse authenticate(LoginRequest request) {
        if (request.getEmail() == null || request.getPassword() == null) {
            return new AuthResponse(false, "Email and password are required", null, null, null, null, null);
        }

        Optional<User> userOpt = userRepository.findByEmail(request.getEmail().trim().toLowerCase());
        if (userOpt.isEmpty()) {
            return new AuthResponse(false, "User not found with this email", null, null, null, null, null);
        }

        User user = userOpt.get();
        if (!user.getPassword().equals(request.getPassword().trim())) {
            return new AuthResponse(false, "Invalid credentials", null, null, null, null, null);
        }

        return new AuthResponse(
                true,
                "Authentication successful",
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.getAreaName()
        );
    }

    public User registerCitizen(String fullName, String email, String password, String phone, String areaName) {
        if (userRepository.existsByEmail(email.trim().toLowerCase())) {
            throw new IllegalArgumentException("Email already registered: " + email);
        }
        User citizen = new User(fullName, email.trim().toLowerCase(), password, "CITIZEN", phone, areaName);
        return userRepository.save(citizen);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email.trim().toLowerCase());
    }
}
