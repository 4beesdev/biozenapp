package com.example.app.admin;

import com.example.app.chat.ChatMessageRepository;
import com.example.app.measurement.MeasurementRepository;
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
    private final MeasurementRepository measurementRepository;
    private final ChatMessageRepository chatMessageRepository;

    public AdminController(UserRepository userRepository, PasswordEncoder passwordEncoder, MeasurementRepository measurementRepository, ChatMessageRepository chatMessageRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.measurementRepository = measurementRepository;
        this.chatMessageRepository = chatMessageRepository;
    }

    // Check if user is admin
    private boolean isAdmin(Authentication auth) {
        System.out.println("=== isAdmin() CHECK ===");
        if (auth == null) {
            System.out.println("ERROR: auth is null");
            return false;
        }
        
        // First check Spring Security authorities (from JWT token)
        boolean hasAdminAuthority = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        System.out.println("Has ROLE_ADMIN authority: " + hasAdminAuthority);
        
        if (hasAdminAuthority) {
            // Also verify in database that user is active
        if (auth.getPrincipal() == null) {
            System.out.println("ERROR: auth.getPrincipal() is null");
            return false;
        }
        String userIdStr = String.valueOf(auth.getPrincipal());
        System.out.println("User ID from token: " + userIdStr);
        Long userId;
        try {
            userId = Long.parseLong(userIdStr);
            System.out.println("Parsed user ID: " + userId);
        } catch (NumberFormatException e) {
            System.out.println("ERROR: Cannot parse user ID: " + userIdStr);
            return false;
        }
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            System.out.println("ERROR: User not found with ID: " + userId);
            return false;
        }
        User user = userOpt.get();
        System.out.println("User found: " + user.getEmail());
        System.out.println("User role: " + user.getRole());
        System.out.println("User isActive: " + user.getIsActive());
            // Check if user is active (case-insensitive role check)
            boolean isActive = user.getIsActive() != null && user.getIsActive();
            boolean hasAdminRole = user.getRole() != null && "ADMIN".equalsIgnoreCase(user.getRole());
            boolean isAdmin = isActive && hasAdminRole;
        System.out.println("Is admin? " + isAdmin);
        return isAdmin;
        }
        
        System.out.println("Is admin? false (no ROLE_ADMIN authority)");
        return false;
    }

    @GetMapping("/users")
    public ResponseEntity<?> getUsers(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {
        
        System.out.println("=== GET /api/admin/users ===");
        System.out.println("Request reached controller!");
        System.out.println("Auth object: " + (auth != null ? "EXISTS" : "NULL"));
        if (auth != null) {
            System.out.println("Auth principal: " + auth.getPrincipal());
            System.out.println("Auth authorities: " + auth.getAuthorities());
            System.out.println("Auth isAuthenticated: " + auth.isAuthenticated());
        }
        System.out.println("Page: " + page + ", Size: " + size);
        System.out.println("Search: " + search + ", Status: " + status);
        
        if (auth == null) {
            System.out.println("ERROR: Authentication is null - returning 401");
            return ResponseEntity.status(401).body(Map.of("message", "Niste autentifikovani"));
        }
        
        if (!isAdmin(auth)) {
            System.out.println("ERROR: User is not admin");
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

            System.out.println("Total users found: " + users.getTotalElements());
            System.out.println("Users on this page: " + users.getContent().size());

            // Filter by status if provided
            List<User> filteredUsers = users.getContent();
            long totalElements = users.getTotalElements();
            int totalPages = users.getTotalPages();
            
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
                // When filtering, we need to recalculate total elements and pages
                // For now, we'll use the filtered count as total elements for this page
                // Note: This is a simplified approach - for accurate pagination with filters,
                // you'd need to query the database with the filter applied
            }

            System.out.println("Filtered users: " + filteredUsers.size());
            System.out.println("Returning users: " + filteredUsers.size());

            // Create DTOs with measurement count and chat count
            List<Map<String, Object>> userDtos = filteredUsers.stream().map(user -> {
                Map<String, Object> dto = new HashMap<>();
                dto.put("id", user.getId());
                dto.put("email", user.getEmail());
                dto.put("ime", user.getIme());
                dto.put("prezime", user.getPrezime());
                dto.put("pol", user.getPol());
                dto.put("starost", user.getStarost());
                dto.put("kilaza", user.getKilaza());
                dto.put("zeljenaKilaza", user.getZeljenaKilaza());
                dto.put("role", user.getRole());
                dto.put("isActive", user.getIsActive());
                dto.put("createdAt", user.getCreatedAt());
                dto.put("lastLoginAt", user.getLastLoginAt());
                dto.put("loginCount", user.getLoginCount());
                // Count measurements for this user
                long measurementCount = measurementRepository.countByUserId(user.getId());
                dto.put("measurementCount", measurementCount);
                // Count chat messages (only user messages, not assistant responses)
                long chatCount = chatMessageRepository.countByUserIdAndRole(user.getId(), "user");
                dto.put("chatCount", chatCount);
                return dto;
            }).toList();

            return ResponseEntity.ok(Map.of(
                "users", userDtos,
                "totalPages", totalPages,
                "totalElements", totalElements,
                "currentPage", page
            ));
        } catch (Exception e) {
            System.err.println("ERROR in getUsers: " + e.getMessage());
            e.printStackTrace();
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
        System.out.println("=== GET /api/admin/users/stats ===");
        System.out.println("Request reached controller!");
        System.out.println("Auth object: " + (auth != null ? "EXISTS" : "NULL"));
        if (auth != null) {
            System.out.println("Auth principal: " + auth.getPrincipal());
            System.out.println("Auth authorities: " + auth.getAuthorities());
            System.out.println("Auth isAuthenticated: " + auth.isAuthenticated());
        }
        
        if (auth == null) {
            System.out.println("ERROR: Authentication is null - returning 401");
            return ResponseEntity.status(401).body(Map.of("message", "Niste autentifikovani"));
        }
        
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

