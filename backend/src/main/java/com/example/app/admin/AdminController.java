package com.example.app.admin;

import com.example.app.user.User;
import com.example.app.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // Check if user is admin
    private boolean isAdmin(Authentication auth) {
        if (auth == null || auth.getPrincipal() == null) return false;
        String userIdStr = String.valueOf(auth.getPrincipal());
        Long userId;
        try {
            userId = Long.parseLong(userIdStr);
        } catch (NumberFormatException e) {
            return false;
        }
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return false;
        User user = userOpt.get();
        return user.getIsActive() != null && user.getIsActive() && "ADMIN".equals(user.getRole());
    }

    @GetMapping("/users")
    public ResponseEntity<?> getUsers(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {
        
        if (!isAdmin(auth)) {
            return ResponseEntity.status(403).body(Map.of("message", "Nedovoljno dozvola"));
        }

        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<User> users;
            
            if (search != null && !search.isEmpty()) {
                // Simple search by email - you can extend this
                users = userRepository.findByEmailContainingIgnoreCase(search, pageable);
            } else {
                users = userRepository.findAll(pageable);
            }

            // Filter by status if provided
            List<User> filteredUsers = users.getContent();
            if (status != null && !status.isEmpty()) {
                if ("active".equals(status)) {
                    filteredUsers = filteredUsers.stream()
                        .filter(u -> u.getIsActive() != null && u.getIsActive())
                        .toList();
                } else if ("inactive".equals(status)) {
                    filteredUsers = filteredUsers.stream()
                        .filter(u -> u.getIsActive() == null || !u.getIsActive())
                        .toList();
                }
            }

            return ResponseEntity.ok(Map.of(
                "users", filteredUsers,
                "totalPages", users.getTotalPages(),
                "totalElements", users.getTotalElements(),
                "currentPage", page
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Greška pri učitavanju korisnika"));
        }
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<?> getUserById(Authentication auth, @PathVariable Long id) {
        if (!isAdmin(auth)) {
            return ResponseEntity.status(403).body(Map.of("message", "Nedovoljno dozvola"));
        }

        try {
            Optional<User> userOpt = userRepository.findById(id);
            if (userOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(userOpt.get());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Greška pri učitavanju korisnika"));
        }
    }

    @GetMapping("/users/stats")
    public ResponseEntity<?> getUserStats(Authentication auth) {
        if (!isAdmin(auth)) {
            return ResponseEntity.status(403).body(Map.of("message", "Nedovoljno dozvola"));
        }

        try {
            List<User> allUsers = userRepository.findAll();
            long totalUsers = allUsers.size();
            long activeUsers = allUsers.stream()
                .filter(u -> u.getIsActive() != null && u.getIsActive())
                .count();
            
            Instant today = Instant.now();
            Instant yesterday = today.minusSeconds(86400);
            long newUsersToday = allUsers.stream()
                .filter(u -> u.getCreatedAt() != null && u.getCreatedAt().isAfter(yesterday))
                .count();

            // Calculate average weight
            double avgWeight = allUsers.stream()
                .filter(u -> u.getKilaza() != null && u.getKilaza() > 0)
                .mapToDouble(User::getKilaza)
                .average()
                .orElse(0.0);

            return ResponseEntity.ok(Map.of(
                "totalUsers", totalUsers,
                "activeUsers", activeUsers,
                "inactiveUsers", totalUsers - activeUsers,
                "newUsersToday", newUsersToday,
                "averageWeight", Math.round(avgWeight * 10.0) / 10.0
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Greška pri učitavanju statistika"));
        }
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(Authentication auth, @PathVariable Long id, @RequestBody Map<String, Object> updates) {
        if (!isAdmin(auth)) {
            return ResponseEntity.status(403).body(Map.of("message", "Nedovoljno dozvola"));
        }

        try {
            Optional<User> userOpt = userRepository.findById(id);
            if (userOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            User user = userOpt.get();
            if (updates.containsKey("ime")) user.setIme((String) updates.get("ime"));
            if (updates.containsKey("prezime")) user.setPrezime((String) updates.get("prezime"));
            if (updates.containsKey("pol")) user.setPol((String) updates.get("pol"));
            if (updates.containsKey("starost")) user.setStarost(((Number) updates.get("starost")).intValue());
            if (updates.containsKey("kilaza")) user.setKilaza(((Number) updates.get("kilaza")).doubleValue());
            if (updates.containsKey("zeljenaKilaza")) user.setZeljenaKilaza(((Number) updates.get("zeljenaKilaza")).doubleValue());
            if (updates.containsKey("isActive")) user.setIsActive((Boolean) updates.get("isActive"));
            if (updates.containsKey("role")) user.setRole((String) updates.get("role"));

            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Korisnik je uspešno ažuriran"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Greška pri ažuriranju korisnika"));
        }
    }

    @PutMapping("/users/{id}/activate")
    public ResponseEntity<?> activateUser(Authentication auth, @PathVariable Long id) {
        if (!isAdmin(auth)) {
            return ResponseEntity.status(403).body(Map.of("message", "Nedovoljno dozvola"));
        }

        try {
            Optional<User> userOpt = userRepository.findById(id);
            if (userOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            User user = userOpt.get();
            user.setIsActive(true);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Korisnik je aktiviran"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Greška pri aktivaciji korisnika"));
        }
    }

    @PutMapping("/users/{id}/deactivate")
    public ResponseEntity<?> deactivateUser(Authentication auth, @PathVariable Long id) {
        if (!isAdmin(auth)) {
            return ResponseEntity.status(403).body(Map.of("message", "Nedovoljno dozvola"));
        }

        try {
            Optional<User> userOpt = userRepository.findById(id);
            if (userOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            User user = userOpt.get();
            user.setIsActive(false);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Korisnik je deaktiviran"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Greška pri deaktivaciji korisnika"));
        }
    }

    @PostMapping("/users/{id}/reset-password")
    public ResponseEntity<?> resetUserPassword(Authentication auth, @PathVariable Long id, @RequestBody Map<String, String> req) {
        if (!isAdmin(auth)) {
            return ResponseEntity.status(403).body(Map.of("message", "Nedovoljno dozvola"));
        }

        try {
            Optional<User> userOpt = userRepository.findById(id);
            if (userOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            String newPassword = req.get("newPassword");
            if (newPassword == null || newPassword.length() < 6) {
                return ResponseEntity.badRequest().body(Map.of("message", "Lozinka mora imati najmanje 6 karaktera"));
            }

            User user = userOpt.get();
            user.setPasswordHash(passwordEncoder.encode(newPassword));
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Lozinka je uspešno resetovana"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Greška pri resetovanju lozinke"));
        }
    }
}

