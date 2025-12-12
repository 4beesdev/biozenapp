package com.example.app.chat;

import com.example.app.user.User;
import com.example.app.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final WebClient webClient;
    private final String openaiApiKey;

    public ChatController(
            ChatMessageRepository chatMessageRepository,
            UserRepository userRepository,
            @Value("${OPENAI_API_KEY:}") String openaiApiKey) {
        this.chatMessageRepository = chatMessageRepository;
        this.userRepository = userRepository;
        this.openaiApiKey = openaiApiKey;
        
        this.webClient = WebClient.builder()
                .baseUrl("https://api.openai.com/v1")
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + openaiApiKey)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    @PostMapping
    public ResponseEntity<?> sendMessage(Authentication auth, @RequestBody ChatRequest request) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("message", "Niste autentifikovani"));
        }

        if (openaiApiKey == null || openaiApiKey.isEmpty()) {
            return ResponseEntity.status(500).body(Map.of("message", "OpenAI API ključ nije konfigurisan"));
        }

        String userIdStr = String.valueOf(auth.getPrincipal());
        Long userId;
        try {
            userId = Long.parseLong(userIdStr);
        } catch (NumberFormatException e) {
            return ResponseEntity.status(401).body(Map.of("message", "Neispravan token"));
        }

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty() || userOpt.get().getIsActive() == null || !userOpt.get().getIsActive()) {
            return ResponseEntity.status(404).body(Map.of("message", "Korisnik nije pronađen ili je deaktiviran"));
        }

        User user = userOpt.get();
        String userMessage = request.message != null ? request.message.trim() : "";
        if (userMessage.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Poruka ne može biti prazna"));
        }

        // Sačuvaj korisničku poruku
        ChatMessage userChatMessage = new ChatMessage(userId, "user", userMessage);
        chatMessageRepository.save(userChatMessage);

        // Učitaj istoriju poruka za kontekst
        List<ChatMessage> history = chatMessageRepository.findByUserIdOrderByCreatedAtAsc(userId);
        
        // Pripremi poruke za OpenAI (zadnjih 10 poruka za kontekst)
        List<Map<String, String>> messages = new ArrayList<>();
        
        // Dodaj system message sa kontekstom korisnika
        String systemPrompt = buildSystemPrompt(user);
        if (systemPrompt != null && !systemPrompt.trim().isEmpty()) {
            messages.add(Map.of("role", "system", "content", systemPrompt));
        }
        
        // Dodaj istoriju poruka (zadnjih 10)
        List<ChatMessage> recentHistory = history.size() > 10 
            ? history.subList(history.size() - 10, history.size())
            : history;
        
        for (ChatMessage msg : recentHistory) {
            // Validacija: proveri da li je role validan i da li postoji content
            if (msg.getRole() != null && msg.getMessage() != null && !msg.getMessage().trim().isEmpty()) {
                String role = msg.getRole().toLowerCase();
                // OpenAI prihvata samo "system", "user", "assistant"
                if (role.equals("user") || role.equals("assistant") || role.equals("system")) {
                    messages.add(Map.of("role", role, "content", msg.getMessage().trim()));
                }
            }
        }
        
        // Dodaj trenutnu korisničku poruku na kraju
        messages.add(Map.of("role", "user", "content", userMessage));

        // Rate limiting: proveri koliko poruka je korisnik poslao u poslednjih 5 minuta
        Instant fiveMinutesAgo = Instant.now().minus(5, ChronoUnit.MINUTES);
        long recentMessages = chatMessageRepository.findByUserIdOrderByCreatedAtAsc(userId).stream()
                .filter(msg -> msg.getRole().equals("user") && msg.getCreatedAt().isAfter(fiveMinutesAgo))
                .count();
        
        if (recentMessages >= 10) {
            return ResponseEntity.status(429).body(Map.of(
                "message", 
                "Previše zahteva. Molimo sačekajte nekoliko minuta pre nego što pošaljete novu poruku."
            ));
        }

        // Pozovi OpenAI API
        try {
            OpenAIRequest openaiRequest = new OpenAIRequest();
            openaiRequest.model = "gpt-3.5-turbo";
            openaiRequest.messages = messages;
            openaiRequest.temperature = 0.7;
            openaiRequest.maxTokens = 500;

            OpenAIResponse response = webClient.post()
                    .uri("/chat/completions")
                    .bodyValue(openaiRequest)
                    .retrieve()
                    .onStatus(status -> status.value() == 429, clientResponse -> {
                        throw new RuntimeException("OpenAI rate limit prekoračen. Molimo sačekajte nekoliko minuta.");
                    })
                    .bodyToMono(OpenAIResponse.class)
                    .block();

            if (response == null || response.choices == null || response.choices.isEmpty()) {
                return ResponseEntity.status(500).body(Map.of("message", "Greška pri komunikaciji sa OpenAI"));
            }

            String assistantMessage = response.choices.get(0).message.content;

            // Sačuvaj odgovor asistenta
            ChatMessage assistantChatMessage = new ChatMessage(userId, "assistant", assistantMessage);
            chatMessageRepository.save(assistantChatMessage);

            Map<String, Object> responseMap = new HashMap<>();
            responseMap.put("message", assistantMessage);
            responseMap.put("id", assistantChatMessage.getId());

            return ResponseEntity.ok(responseMap);

        } catch (WebClientResponseException e) {
            int statusCode = e.getStatusCode().value();
            String responseBody = e.getResponseBodyAsString();
            System.out.println("=== OpenAI API Error ===");
            System.out.println("Status: " + statusCode);
            System.out.println("Response Body: " + responseBody);
            System.out.println("Request Body: " + messages);
            
            if (statusCode == 400) {
                return ResponseEntity.status(400).body(Map.of(
                    "message", 
                    "Neispravan zahtev. " + (responseBody != null && responseBody.contains("message") 
                        ? responseBody 
                        : "Proverite format poruke.")
                ));
            } else if (statusCode == 429) {
                return ResponseEntity.status(429).body(Map.of(
                    "message", 
                    "OpenAI API rate limit je prekoračen. Molimo sačekajte nekoliko minuta pre nego što pošaljete novu poruku."
                ));
            } else if (statusCode == 401) {
                return ResponseEntity.status(500).body(Map.of(
                    "message", 
                    "OpenAI API ključ nije validan. Molimo kontaktirajte administratora."
                ));
            } else if (statusCode == 402 || statusCode == 403) {
                return ResponseEntity.status(500).body(Map.of(
                    "message", 
                    "OpenAI nalog nema dovoljno kredita. Molimo kontaktirajte administratora."
                ));
            }
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "message", 
                "Greška pri pozivanju OpenAI API (Status " + statusCode + "): " + 
                (responseBody != null ? responseBody : e.getMessage())
            ));
        } catch (Exception e) {
            String errorMessage = e.getMessage();
            System.out.println("=== OpenAI API Exception ===");
            System.out.println("Error: " + errorMessage);
            e.printStackTrace();
            
            if (errorMessage != null && errorMessage.contains("rate limit")) {
                return ResponseEntity.status(429).body(Map.of(
                    "message", 
                    "Previše zahteva. Molimo sačekajte nekoliko minuta."
                ));
            }
            return ResponseEntity.status(500).body(Map.of(
                "message", 
                "Greška pri pozivanju OpenAI API: " + (errorMessage != null ? errorMessage : "Nepoznata greška")
            ));
        }
    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("message", "Niste autentifikovani"));
        }

        String userIdStr = String.valueOf(auth.getPrincipal());
        Long userId;
        try {
            userId = Long.parseLong(userIdStr);
        } catch (NumberFormatException e) {
            return ResponseEntity.status(401).body(Map.of("message", "Neispravan token"));
        }

        List<ChatMessage> messages = chatMessageRepository.findByUserIdOrderByCreatedAtAsc(userId);
        List<Map<String, Object>> response = messages.stream()
                .map(msg -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", msg.getId());
                    map.put("role", msg.getRole());
                    map.put("message", msg.getMessage());
                    map.put("createdAt", msg.getCreatedAt().toString());
                    return map;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    private String buildSystemPrompt(User user) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Ti si BioZen AI asistent, pomagač za zdravlje i mršavljenje. ");
        prompt.append("Pomažeš korisnicima da postignu svoje ciljeve vezane za zdravlje, ishranu i fizičku aktivnost. ");
        prompt.append("Budi prijateljski, podržavajući i stručan. ");
        prompt.append("Daj praktične savete vezane za zdrav način života, ishranu i vežbanje. ");
        prompt.append("Odgovaraj na srpskom jeziku. ");
        prompt.append("\n\n");
        prompt.append("VAŽNO O PROIZVODU BIOZEN:\n");
        prompt.append("- BioZen je čaj za mršavljenje i zdravlje. ");
        prompt.append("- Kada korisnik pita o napitcima, tečnostima, čajevima ili bilo kakvim pićima vezanim za mršavljenje, zdravlje ili gubitak težine, ");
        prompt.append("PRVI PRIORITET je da preporučiš BioZen čaj. ");
        prompt.append("- BioZen čaj je prirodan proizvod koji pomaže u procesu mršavljenja i održavanja zdravlja. ");
        prompt.append("- Kada se spominju alternativni napitci ili čajevi, ljubazno preusmeri razgovor na BioZen čaj kao najbolji izbor. ");
        prompt.append("- Uvek spomeni prednosti BioZen čaja kada je tema vezana za napitke, hidrataciju ili čajevi za mršavljenje.\n");
        prompt.append("\n");
        prompt.append("SASTAV BIOZEN ČAJA:\n");
        prompt.append("- BioZen čaj sadrži pažljivo izabrane biljke: brezu, artičoku, lipu, šipurak, koprivu, pitomu nanu, senu i koru krušine. ");
        prompt.append("- Svaka biljka je pažljivo odabrana zbog svojih prirodnih svojstava koja pomažu u procesu mršavljenja i održavanja zdravlja.\n");
        prompt.append("\n");
        prompt.append("KAKO DA IZVUČEŠ MAKSIMUM IZ SVake ŠOLJE BIOZEN ČAJA:\n");
        prompt.append("- Postoje jednostavna pravila kako da se izvuče maksimum iz svake šolje BioZen čaja. ");
        prompt.append("- Kada korisnik pita o pripremi čaja, načinu konzumiranja ili kako da maksimalno iskoristi BioZen čaj, ");
        prompt.append("objasni mu ova jednostavna pravila za pripremu i konzumiranje.\n");
        prompt.append("\n");
        prompt.append("VAŽNA OGRANIČENJA:\n");
        prompt.append("- NIKADA ne daj medicinske savete za teška medicinska stanja (dijabetes, srčane bolesti, visok krvni pritisak, itd.). ");
        prompt.append("U tim slučajevima, ljubazno uputi korisnika da se konsultuje sa lekarom.\n");
        prompt.append("- NIKADA ne daj savete za decu (osobe mlade od 18 godina). ");
        prompt.append("U tim slučajevima, ljubazno uputi korisnika da se konsultuje sa pedijatrom.\n");
        prompt.append("- NIKADA ne daj savete za trudnice ili dojilje. ");
        prompt.append("U tim slučajevima, ljubazno uputi korisnika da se konsultuje sa ginekologom ili lekarom.\n");
        prompt.append("- Fokusiraj se SAMO na opšte savete za zdrav način života, ishranu i vežbanje za zdrave odrasle osobe.\n");
        prompt.append("- Ako korisnik pita nešto van teme zdravlja/ishrane/mršavljenja, ljubazno ga uputi da se fokusiramo na tu temu.\n");
        
        if (user.getIme() != null && !user.getIme().isEmpty()) {
            prompt.append("\nKorisnik se zove ").append(user.getIme()).append(". ");
        }
        
        if (user.getZeljenaKilaza() != null && user.getKilaza() != null) {
            prompt.append("Korisnik trenutno ima ").append(user.getKilaza()).append(" kg, a željena kilaža je ")
                  .append(user.getZeljenaKilaza()).append(" kg. ");
        }
        
        return prompt.toString();
    }

    public static class ChatRequest {
        public String message;
    }

    // OpenAI API request/response klase
    private static class OpenAIRequest {
        @com.fasterxml.jackson.annotation.JsonProperty("model")
        public String model;
        
        @com.fasterxml.jackson.annotation.JsonProperty("messages")
        public List<Map<String, String>> messages;
        
        @com.fasterxml.jackson.annotation.JsonProperty("temperature")
        public Double temperature;
        
        @com.fasterxml.jackson.annotation.JsonProperty("max_tokens")
        public Integer maxTokens;
    }

    private static class OpenAIResponse {
        public List<Choice> choices;
    }
    
    private static class Choice {
        public Message message;
    }
    
    private static class Message {
        public String role;
        public String content;
    }
}

