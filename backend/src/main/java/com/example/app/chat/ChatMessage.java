package com.example.app.chat;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "chat_messages")
public class ChatMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false, length = 20)
    private String role; // "user" or "assistant"

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public ChatMessage() {}

    public ChatMessage(Long userId, String role, String message) {
        this.userId = userId;
        this.role = role;
        this.message = message;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getRole() { return role; }
    public String getMessage() { return message; }
    public Instant getCreatedAt() { return createdAt; }

    public void setId(Long id) { this.id = id; }
    public void setUserId(Long userId) { this.userId = userId; }
    public void setRole(String role) { this.role = role; }
    public void setMessage(String message) { this.message = message; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}

