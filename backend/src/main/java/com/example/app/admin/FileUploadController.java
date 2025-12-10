package com.example.app.admin;

import com.example.app.user.User;
import com.example.app.user.UserRepository;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/upload")
public class FileUploadController {

    private final UserRepository userRepository;
    private static final String UPLOAD_DIR = "uploads";

    public FileUploadController(UserRepository userRepository) {
        this.userRepository = userRepository;
        // Create upload directory if it doesn't exist
        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
        } catch (IOException e) {
            System.err.println("Failed to create upload directory: " + e.getMessage());
        }
    }

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

    @PostMapping("/image")
    public ResponseEntity<?> uploadImage(
            Authentication auth,
            @RequestParam("file") MultipartFile file) {
        
        if (!isAdmin(auth)) {
            return ResponseEntity.status(403).body(Map.of("message", "Nedovoljno dozvola"));
        }

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Fajl je prazan"));
        }

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Fajl mora biti slika"));
        }

        try {
            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String filename = UUID.randomUUID().toString() + extension;

            // Save file
            Path uploadPath = Paths.get(UPLOAD_DIR);
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Return URL
            String fileUrl = "/api/admin/files/" + filename;
            return ResponseEntity.ok(Map.of("url", fileUrl, "filename", filename));

        } catch (IOException e) {
            System.err.println("Error uploading file: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("message", "Greška pri upload-u fajla"));
        }
    }

    @GetMapping("/files/{filename:.+}")
    public ResponseEntity<Resource> getFile(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(UPLOAD_DIR).resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                String contentType = "application/octet-stream";
                try {
                    contentType = Files.probeContentType(filePath);
                    if (contentType == null) {
                        contentType = "application/octet-stream";
                    }
                } catch (IOException e) {
                    // Use default content type
                }

                return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}

