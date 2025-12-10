package com.example.app.blog;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface BlogPostRepository extends JpaRepository<BlogPost, Long> {
    Optional<BlogPost> findBySlug(String slug);
    
    Page<BlogPost> findByStatusOrderByPublishedAtDesc(String status, Pageable pageable);
    
    Page<BlogPost> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);
    
    @Query("SELECT b FROM BlogPost b WHERE b.status = :status ORDER BY b.publishedAt DESC")
    Page<BlogPost> findPublishedPosts(@Param("status") String status, Pageable pageable);
    
    @Query("SELECT b FROM BlogPost b WHERE b.status = :status AND (b.title LIKE %:search% OR b.content LIKE %:search%)")
    Page<BlogPost> findByStatusAndSearch(@Param("status") String status, @Param("search") String search, Pageable pageable);
}

