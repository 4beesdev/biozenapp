package com.example.app.auth;

import com.example.app.config.JwtService;
import com.example.app.user.User;
import com.example.app.user.UserRepository;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    // DTO klase umesto record-a
    public static class RegisterReq {
        @Email
        public String email;
        @NotBlank
        public String password;
    }

    public static class LoginReq {
        @Email
        public String email;
        @NotBlank
        public String password;
    }

    public static class AuthRes {
        public String token;
        public String email;
        public AuthRes(String token, String email) {
            this.token = token;
            this.email = email;
        }
    }

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthController(UserRepository users, PasswordEncoder encoder, JwtService jwt) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterReq req) {
        if (req == null || req.email == null || req.password == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Nedostaju email ili lozinka"));
        }
        if (users.existsByEmail(req.email)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email već postoji"));
        }

        User u = new User();
        u.setEmail(req.email);
        u.setPasswordHash(encoder.encode(req.password));
        users.save(u);

        String token = jwt.generate(u.getEmail(), Map.of("uid", u.getId()));
        return ResponseEntity.ok(new AuthRes(token, u.getEmail()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginReq req) {
        if (req == null || req.email == null || req.password == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Neispravan email ili lozinka"));
        }

        Optional<User> userOpt = users.findByEmail(req.email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "Neispravan email ili lozinka"));
        }

        User u = userOpt.get();
        if (!encoder.matches(req.password, u.getPasswordHash())) {
            return ResponseEntity.status(401).body(Map.of("message", "Neispravan email ili lozinka"));
        }

        String token = jwt.generate(u.getEmail(), Map.of("uid", u.getId()));
        return ResponseEntity.ok(new AuthRes(token, u.getEmail()));
    }
}

