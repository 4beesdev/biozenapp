# 🔍 Provera Greške pri Kreiranju Blog-a

## Status

✅ Tabela `blog_posts` postoji
⚠️ `featured_image` kolona je `character varying(255)` - možda je URL predugačak

---

## Korak 1: Proveri Backend Logove

```bash
# SSH na production server
ssh root@164.90.231.47
cd /opt/biozenapp

# Pull najnovije izmene (sa boljim logovanjem)
git pull origin main

# Rebuild backend
docker compose -f docker-compose.production.yml build --no-cache backend

# Restart backend
docker compose -f docker-compose.production.yml restart backend

# Proveri logove (pokušaj ponovo da kreiraš blog, pa proveri logove)
docker compose -f docker-compose.production.yml logs backend | tail -100
```

---

## Korak 2: Proveri Dužinu URL-a

URL koji pokušavaš da sačuvaš:
`https://cajzamrsavljenje.rs/wp-content/uploads/2025/11/1-Photoroom.png`

Dužina: ~70 karaktera (OK, nije preko 255)

---

## Korak 3: Proveri da Li Postoji Duplikat Slug-a

```bash
# Proveri postojeće slug-ove
docker compose -f docker-compose.production.yml exec postgres psql -U biozen -d biozenapp -c "SELECT slug, title FROM blog_posts ORDER BY created_at DESC LIMIT 10;"
```

---

## Korak 4: Proveri Admin Status

```bash
# Proveri da li je korisnik admin
docker compose -f docker-compose.production.yml exec postgres psql -U biozen -d biozenapp -c "SELECT email, role, is_active FROM users WHERE email = 'office@biozen.rs';"
```

---

## 🎯 Sve Odjednom - Copy-Paste

```bash
# SSH na production server
ssh root@164.90.231.47
cd /opt/biozenapp

# 1. Pull najnovije izmene
echo "=== PULL NAJNOVIJE IZMENE ===" && \
git pull origin main

# 2. Rebuild backend
echo "" && \
echo "=== REBUILD BACKEND ===" && \
docker compose -f docker-compose.production.yml build --no-cache backend

# 3. Restart backend
echo "" && \
echo "=== RESTART BACKEND ===" && \
docker compose -f docker-compose.production.yml restart backend

# 4. Sačekaj 10 sekundi
echo "" && \
echo "=== WAITING 10 SECONDS ===" && \
sleep 10

# 5. Proveri logove (POKUŠAJ PONOVO DA KREIRAŠ BLOG, PA PROVERI LOGOVE)
echo "" && \
echo "=== BACKEND LOGOVI (poslednjih 100 linija) ===" && \
docker compose -f docker-compose.production.yml logs backend | tail -100

# 6. Proveri admin status
echo "" && \
echo "=== ADMIN STATUS ===" && \
docker compose -f docker-compose.production.yml exec postgres psql -U biozen -d biozenapp -c "SELECT email, role, is_active FROM users WHERE email = 'office@biozen.rs';" 2>/dev/null

# 7. Proveri postojeće blogove
echo "" && \
echo "=== POSTOJEĆI BLOGOVI ===" && \
docker compose -f docker-compose.production.yml exec postgres psql -U biozen -d biozenapp -c "SELECT id, slug, title, status FROM blog_posts ORDER BY created_at DESC LIMIT 5;" 2>/dev/null
```

---

## 🐛 Najčešći Problemi

### Problem 1: Duplikat Slug-a

Ako već postoji blog sa istim slug-om, baza će baciti grešku. Rešenje: promeni naslov bloga.

### Problem 2: Featured Image URL Predugačak

Ako je URL preko 255 karaktera, baza će baciti grešku. Rešenje: povećaj `featured_image` kolonu na `TEXT` ili skrati URL.

### Problem 3: Admin Role Nije Promenjen

Ako role nije "ADMIN", endpoint će vratiti 403. Rešenje: promeni role u bazi.

---

## 📝 Šta Da Pošalješ

Kada pokreneš dijagnostiku i pokušaš ponovo da kreiraš blog, pošalji mi:
1. Output od `docker compose logs backend | tail -100` (posle pokušaja kreiranja bloga)
2. Output od admin status provere

