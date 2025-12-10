package com.example.app.config;

import com.example.app.config.JwtAuthFilter;
import com.example.app.config.SimpleCorsFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import jakarta.servlet.http.HttpServletResponse;
import java.util.Arrays;
import java.util.List;

@Configuration
public class SecurityConfig {

    private final JwtAuthFilter jwtFilter;
    private final SimpleCorsFilter simpleCorsFilter;

    public SecurityConfig(JwtAuthFilter jwtFilter, SimpleCorsFilter simpleCorsFilter) {
        this.jwtFilter = jwtFilter;
        this.simpleCorsFilter = simpleCorsFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable());
        http.cors(cors -> cors.configurationSource(corsConfigurationSource()));
        http.authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()   // register/login javne
                .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/api/**").permitAll()  // OPTIONS zahtevi bez autentifikacije
                .requestMatchers("/api/admin/**").hasRole("ADMIN")  // Admin endpoints require ADMIN role
                .anyRequest().authenticated()                  // ostalo traži token
        );
        http.httpBasic(basic -> basic.disable());
        http.formLogin(form -> form.disable());
        
        // Add CORS headers to error responses (403, 401, etc.)
        http.exceptionHandling(exceptions -> exceptions
            .accessDeniedHandler((request, response, accessDeniedException) -> {
                // Add CORS headers before sending error response
                String origin = request.getHeader("Origin");
                if (origin != null && !origin.isEmpty()) {
                    response.setHeader("Access-Control-Allow-Origin", origin);
                    response.setHeader("Access-Control-Allow-Credentials", "true");
                } else {
                    response.setHeader("Access-Control-Allow-Origin", "*");
                }
                response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
                response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Requested-With, Accept, Origin");
                response.setHeader("Access-Control-Expose-Headers", "Authorization");
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json");
                response.getWriter().write("{\"message\":\"Nedovoljno dozvola\",\"error\":\"Forbidden\"}");
            })
            .authenticationEntryPoint((request, response, authException) -> {
                // Add CORS headers before sending error response
                String origin = request.getHeader("Origin");
                if (origin != null && !origin.isEmpty()) {
                    response.setHeader("Access-Control-Allow-Origin", origin);
                    response.setHeader("Access-Control-Allow-Credentials", "true");
                } else {
                    response.setHeader("Access-Control-Allow-Origin", "*");
                }
                response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
                response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Requested-With, Accept, Origin");
                response.setHeader("Access-Control-Expose-Headers", "Authorization");
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write("{\"message\":\"Niste autentifikovani\",\"error\":\"Unauthorized\"}");
            })
        );
        
        // CORS filter mora biti prvi - SimpleCorsFilter ima HIGHEST_PRECEDENCE
        http.addFilterBefore(simpleCorsFilter, UsernamePasswordAuthenticationFilter.class);
        http.addFilterBefore(corsFilter(), UsernamePasswordAuthenticationFilter.class);
        http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public CorsFilter corsFilter() {
        return new CorsFilter(corsConfigurationSource());
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(false);
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }
}

