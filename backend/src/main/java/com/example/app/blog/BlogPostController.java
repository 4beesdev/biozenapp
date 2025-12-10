package com.example.app.blog;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/blog")
public class BlogPostController {

    private final BlogPostRepository blogPostRepository;

    public BlogPostController(BlogPostRepository blogPostRepository) {
        this.blogPostRepository = blogPostRepository;
    }

    @GetMapping
    public ResponseEntity<?> getPublishedPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            System.out.println("=== GET /api/blog ===");
            System.out.println("Page: " + page + ", Size: " + size);
            Pageable pageable = PageRequest.of(page, size);
            Page<BlogPost> posts = blogPostRepository.findByStatusOrderByPublishedAtDesc("PUBLISHED", pageable);
            System.out.println("Found " + posts.getTotalElements() + " published blog posts");
            System.out.println("Returning " + posts.getContent().size() + " posts on this page");
            return ResponseEntity.ok(Map.of(
                "posts", posts.getContent(),
                "totalPages", posts.getTotalPages(),
                "totalElements", posts.getTotalElements(),
                "currentPage", page
            ));
        } catch (Exception e) {
            System.err.println("ERROR in getPublishedPosts: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Greška pri učitavanju blogova"));
        }
    }

    @GetMapping("/{slug}")
    public ResponseEntity<?> getPostBySlug(@PathVariable String slug) {
        try {
            Optional<BlogPost> postOpt = blogPostRepository.findBySlug(slug);
            if (postOpt.isEmpty() || !"PUBLISHED".equals(postOpt.get().getStatus())) {
                return ResponseEntity.notFound().build();
            }

            BlogPost post = postOpt.get();
            // Increment view count
            post.setViewCount((post.getViewCount() == null ? 0 : post.getViewCount()) + 1);
            blogPostRepository.save(post);

            return ResponseEntity.ok(post);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Greška pri učitavanju bloga"));
        }
    }
}

