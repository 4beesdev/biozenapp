package com.example.app.user;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/me")
public class MeController {

    private final UserRepository userRepository;

    public MeController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> me(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.ok(Map.of(
                    "authenticated", false,
                    "email", null
            ));
        }

        String email = String.valueOf(auth.getPrincipal());
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                    "authenticated", true,
                    "email", email
            ));
        }

        User user = userOpt.get();
        Map<String, Object> response = new HashMap<>();
        response.put("authenticated", true);
        response.put("email", user.getEmail());
        response.put("ime", user.getIme());
        response.put("prezime", user.getPrezime());
        response.put("pol", user.getPol());
        response.put("starost", user.getStarost());
        response.put("kilaza", user.getKilaza());
        response.put("zeljenaKilaza", user.getZeljenaKilaza());
        response.put("id", user.getId());
        response.put("role", user.getRole() != null ? user.getRole() : "USER");

        return ResponseEntity.ok(response);
    }

    @PutMapping
    public ResponseEntity<?> updateMe(Authentication auth, @RequestBody UpdateUserRequest request) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("message", "Niste autentifikovani"));
        }

        String email = String.valueOf(auth.getPrincipal());
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "Korisnik nije pronađen"));
        }

        User user = userOpt.get();
        
        if (request.ime != null) user.setIme(request.ime);
        if (request.prezime != null) user.setPrezime(request.prezime);
        if (request.pol != null) user.setPol(request.pol);
        if (request.starost != null) user.setStarost(request.starost);
        if (request.kilaza != null) user.setKilaza(request.kilaza);
        if (request.zeljenaKilaza != null) user.setZeljenaKilaza(request.zeljenaKilaza);

        userRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Podaci su ažurirani");
        response.put("email", user.getEmail());
        response.put("ime", user.getIme());
        response.put("prezime", user.getPrezime());
        response.put("pol", user.getPol());
        response.put("starost", user.getStarost());
        response.put("kilaza", user.getKilaza());
        response.put("zeljenaKilaza", user.getZeljenaKilaza());
        response.put("role", user.getRole() != null ? user.getRole() : "USER");

        return ResponseEntity.ok(response);
    }

    public static class UpdateUserRequest {
        public String ime;
        public String prezime;
        public String pol;
        public Integer starost;
        public Double kilaza;
        public Double zeljenaKilaza;
    }
}
