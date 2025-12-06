# 🔧 Finalni CORS Fix - Korak po Korak

## Problem
CORS i dalje ne radi uprkos svim izmenama.

## Rešenje - Proveri sve ovo na Droplet-u:

### 1. Proveri SecurityConfig.java

```bash
cd /opt/biozenapp
cat backend/src/main/java/com/example/app/config/SecurityConfig.java
```

Trebalo bi da vidiš:
```java
configuration.setAllowedOriginPatterns(List.of("*"));
configuration.setAllowCredentials(false);
```

### 2. Proveri da li je CorsConfig onemogućen

```bash
grep "@Configuration" backend/src/main/java/com/example/app/config/CorsConfig.java
```

**NE TREBA** da vidiš `@Configuration` (treba da bude zakomentarisano).

### 3. Proveri frontend nginx.conf

```bash
cat frontend/nginx.conf | grep -A 15 "location /api"
```

Trebalo bi da vidiš CORS headere.

### 4. Rebuild SVE od nule

```bash
cd /opt/biozenapp

# Zaustavi sve
docker compose down

# Rebuild backend
docker compose build --no-cache backend

# Rebuild frontend
docker compose build --no-cache frontend

# Pokreni
docker compose up -d

# Proveri logove
docker compose logs -f
```

### 5. Testiraj direktno

```bash
# Testiraj OPTIONS (preflight)
curl -X OPTIONS http://localhost:8080/api/auth/register \
  -H "Origin: http://164.90.231.47" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v 2>&1 | grep -i "access-control"
```

Trebalo bi da vidiš:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`

### 6. Ako i dalje ne radi

Proveri da li backend stvarno koristi novu konfiguraciju:

```bash
# Proveri da li se klasa kompajlira
docker compose exec backend ls -la /app/src/main/java/com/example/app/config/

# Proveri logove za CORS greške
docker compose logs backend | grep -i cors
```

## Alternativno rešenje - Dodaj CORS direktno u JwtAuthFilter

Ako ništa ne radi, možemo dodati CORS headere direktno u filter:

```java
// U JwtAuthFilter.java, dodaj na početak doFilterInternal:
response.setHeader("Access-Control-Allow-Origin", "*");
response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
```

