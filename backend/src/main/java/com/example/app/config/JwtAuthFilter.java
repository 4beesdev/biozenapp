package com.example.app.config;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwt;

    public JwtAuthFilter(JwtService jwt) {
        this.jwt = jwt;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        
        // CORS headers - dodaj uvek (PRVO, pre bilo čega)
        String origin = request.getHeader("Origin");
        if (origin != null && !origin.isEmpty()) {
            response.setHeader("Access-Control-Allow-Origin", origin);
            response.setHeader("Access-Control-Allow-Credentials", "true");
        } else {
            response.setHeader("Access-Control-Allow-Origin", "*");
            // Ne može credentials sa wildcard
        }
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Requested-With");
        response.setHeader("Access-Control-Max-Age", "3600");

        // Handle preflight OPTIONS request
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        // Preskoči JWT proveru za javne endpoint-e
        if (path.startsWith("/api/auth/") || path.startsWith("/api/blog/")) {
            System.out.println("=== JwtAuthFilter ===");
            System.out.println("Skipping JWT check for public endpoint: " + path);
            chain.doFilter(request, response);
            return;
        }

        String h = request.getHeader("Authorization");
        if (h != null && h.startsWith("Bearer ")) {
            String token = h.substring(7);
            try {
                Claims c = jwt.parse(token).getBody();
                // Subject is now user ID (not email) for security
                String userId = c.getSubject();
                System.out.println("=== JwtAuthFilter ===");
                System.out.println("User ID from token: " + userId);
                
                // Extract role from token claims and add as authority
                List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                String role = (String) c.get("role");
                System.out.println("Role from token: " + role);
                if (role != null && !role.isEmpty()) {
                    // Spring Security expects role with "ROLE_" prefix for hasRole() to work
                    String authority = "ROLE_" + role.toUpperCase();
                    authorities.add(new SimpleGrantedAuthority(authority));
                    System.out.println("Added authority: " + authority);
                } else {
                    // Default to USER role if not specified
                    authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
                    System.out.println("No role in token, defaulting to ROLE_USER");
                }
                
                // Store user ID as principal, with role as authority
                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(userId, null, authorities);
                SecurityContextHolder.getContext().setAuthentication(auth);
                System.out.println("Authentication set successfully");
            } catch (Exception e) {
                // Log the exception to see what's wrong
                System.err.println("=== JWT AUTH ERROR ===");
                System.err.println("Error parsing token: " + e.getClass().getSimpleName());
                System.err.println("Error message: " + e.getMessage());
                e.printStackTrace();
                // nevalidan/istekao token -> nastavi kao neregistrovan
            }
        } else {
            System.out.println("=== JwtAuthFilter ===");
            System.out.println("No Authorization header or not Bearer token");
        }

        chain.doFilter(request, response);
    }
}
