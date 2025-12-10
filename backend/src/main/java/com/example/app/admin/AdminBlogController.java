package com.example.app.admin;

import com.example.app.blog.BlogPost;
import com.example.app.blog.BlogPostRepository;
import com.example.app.user.User;
import com.example.app.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/admin/blog")
public class AdminBlogController {

    private final BlogPostRepository blogPostRepository;
    private final UserRepository userRepository;

    public AdminBlogController(BlogPostRepository blogPostRepository, UserRepository userRepository) {
        this.blogPostRepository = blogPostRepository;
        this.userRepository = userRepository;
    }

    private boolean isAdmin(Authentication auth) {
        if (auth == null || auth.getPrincipal() == null) return false;
        String email = String.valueOf(auth.getPrincipal());
        Optional<User> userOpt = userRepository.findByEmail(email);
        return userOpt.isPresent() && "ADMIN".equals(userOpt.get().getRole());
    }

    private String generateSlug(String title) {
        return title.toLowerCase()
            .replace("ć", "c")
            .replace("č", "c")
            .replace("đ", "d")
            .replace("š", "s")
            .replace("ž", "z")
            .replaceAll("[^a-z0-9\\s-]", "")
            .replaceAll("\\s+", "-")
            .replaceAll("-+", "-")
            .trim();
    }

    @GetMapping
    public ResponseEntity<?> getAllBlogs(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        
        if (!isAdmin(auth)) {
            return ResponseEntity.status(403).body(Map.of("message", "Nedovoljno dozvola"));
        }

        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<BlogPost> posts;

            if (search != null && !search.isEmpty()) {
                String searchStatus = status != null ? status : "";
                posts = blogPostRepository.findByStatusAndSearch(searchStatus, search, pageable);
            } else if (status != null && !status.isEmpty()) {
                posts = blogPostRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
            } else {
                posts = blogPostRepository.findAll(pageable);
            }

            return ResponseEntity.ok(Map.of(
                "posts", posts.getContent(),
                "totalPages", posts.getTotalPages(),
                "totalElements", posts.getTotalElements(),
                "currentPage", page
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Greška pri učitavanju blogova"));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getBlogById(Authentication auth, @PathVariable Long id) {
        if (!isAdmin(auth)) {
            return ResponseEntity.status(403).body(Map.of("message", "Nedovoljno dozvola"));
        }

        try {
            Optional<BlogPost> postOpt = blogPostRepository.findById(id);
            if (postOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(postOpt.get());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Greška pri učitavanju bloga"));
        }
    }

    @PostMapping
    public ResponseEntity<?> createBlog(Authentication auth, @RequestBody Map<String, Object> req) {
        if (!isAdmin(auth)) {
            return ResponseEntity.status(403).body(Map.of("message", "Nedovoljno dozvola"));
        }

        try {
            String email = String.valueOf(auth.getPrincipal());
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(401).body(Map.of("message", "Korisnik nije pronađen"));
            }

            BlogPost post = new BlogPost();
            post.setTitle((String) req.get("title"));
            post.setSlug(generateSlug((String) req.get("title")));
            post.setContent((String) req.get("content"));
            post.setExcerpt((String) req.get("excerpt"));
            post.setFeaturedImage((String) req.get("featuredImage"));
            post.setAuthorId(userOpt.get().getId());
            post.setStatus((String) req.getOrDefault("status", "DRAFT"));
            post.setCreatedAt(Instant.now());

            if ("PUBLISHED".equals(post.getStatus())) {
                post.setPublishedAt(Instant.now());
            }

            blogPostRepository.save(post);
            return ResponseEntity.ok(post);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Greška pri kreiranju bloga"));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateBlog(Authentication auth, @PathVariable Long id, @RequestBody Map<String, Object> req) {
        if (!isAdmin(auth)) {
            return ResponseEntity.status(403).body(Map.of("message", "Nedovoljno dozvola"));
        }

        try {
            Optional<BlogPost> postOpt = blogPostRepository.findById(id);
            if (postOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            BlogPost post = postOpt.get();
            if (req.containsKey("title")) {
                post.setTitle((String) req.get("title"));
                post.setSlug(generateSlug((String) req.get("title")));
            }
            if (req.containsKey("content")) post.setContent((String) req.get("content"));
            if (req.containsKey("excerpt")) post.setExcerpt((String) req.get("excerpt"));
            if (req.containsKey("featuredImage")) post.setFeaturedImage((String) req.get("featuredImage"));
            if (req.containsKey("status")) {
                String newStatus = (String) req.get("status");
                post.setStatus(newStatus);
                if ("PUBLISHED".equals(newStatus) && post.getPublishedAt() == null) {
                    post.setPublishedAt(Instant.now());
                }
            }
            post.setUpdatedAt(Instant.now());

            blogPostRepository.save(post);
            return ResponseEntity.ok(post);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Greška pri ažuriranju bloga"));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBlog(Authentication auth, @PathVariable Long id) {
        if (!isAdmin(auth)) {
            return ResponseEntity.status(403).body(Map.of("message", "Nedovoljno dozvola"));
        }

        try {
            Optional<BlogPost> postOpt = blogPostRepository.findById(id);
            if (postOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            blogPostRepository.delete(postOpt.get());
            return ResponseEntity.ok(Map.of("message", "Blog je uspešno obrisan"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Greška pri brisanju bloga"));
        }
    }

    @PutMapping("/{id}/publish")
    public ResponseEntity<?> publishBlog(Authentication auth, @PathVariable Long id) {
        if (!isAdmin(auth)) {
            return ResponseEntity.status(403).body(Map.of("message", "Nedovoljno dozvola"));
        }

        try {
            Optional<BlogPost> postOpt = blogPostRepository.findById(id);
            if (postOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            BlogPost post = postOpt.get();
            post.setStatus("PUBLISHED");
            if (post.getPublishedAt() == null) {
                post.setPublishedAt(Instant.now());
            }
            post.setUpdatedAt(Instant.now());
            blogPostRepository.save(post);

            return ResponseEntity.ok(post);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Greška pri objavljivanju bloga"));
        }
    }

    @PutMapping("/{id}/unpublish")
    public ResponseEntity<?> unpublishBlog(Authentication auth, @PathVariable Long id) {
        if (!isAdmin(auth)) {
            return ResponseEntity.status(403).body(Map.of("message", "Nedovoljno dozvola"));
        }

        try {
            Optional<BlogPost> postOpt = blogPostRepository.findById(id);
            if (postOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            BlogPost post = postOpt.get();
            post.setStatus("DRAFT");
            post.setUpdatedAt(Instant.now());
            blogPostRepository.save(post);

            return ResponseEntity.ok(post);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Greška pri povlačenju bloga"));
        }
    }
}

