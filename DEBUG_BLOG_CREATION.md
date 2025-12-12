# 🐛 Debug Kreiranja Blog-a (500 Error)

## Problem

500 Internal Server Error pri kreiranju bloga.

---

## Korak 1: Proveri Backend Logove

```bash
# SSH na production server
ssh root@164.90.231.47
cd /opt/biozenapp

# Proveri backend logove za greške
docker compose -f docker-compose.production.yml logs backend | grep -i "error\|exception\|failed" | tail -50

# ILI sve logove poslednjih 100 linija
docker compose -f docker-compose.production.yml logs backend --tail=100
```

---

## Korak 2: Proveri Blog Endpoint

```bash
# Proveri da li blog endpoint postoji
docker compose -f docker-compose.production.yml logs backend | grep -i "blog\|AdminBlogController" | tail -20
```

---

## Korak 3: Proveri Database Tabelu

```bash
# Proveri da li blog_posts tabela postoji
docker compose -f docker-compose.production.yml exec postgres psql -U biozen -d biozenapp -c "\d blog_posts"
```

---

## Korak 4: Proveri Admin Authentication

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

# 1. Proveri backend logove
echo "=== BACKEND LOGOVI (greške) ===" && \
docker compose -f docker-compose.production.yml logs backend | grep -i "error\|exception\|failed" | tail -50

# 2. Proveri blog endpoint
echo "" && \
echo "=== BLOG ENDPOINT LOGOVI ===" && \
docker compose -f docker-compose.production.yml logs backend | grep -i "blog\|AdminBlogController" | tail -20

# 3. Proveri database tabelu
echo "" && \
echo "=== BLOG_POSTS TABELA ===" && \
docker compose -f docker-compose.production.yml exec postgres psql -U biozen -d biozenapp -c "\d blog_posts" 2>/dev/null

# 4. Proveri admin status
echo "" && \
echo "=== ADMIN STATUS ===" && \
docker compose -f docker-compose.production.yml exec postgres psql -U biozen -d biozenapp -c "SELECT email, role, is_active FROM users WHERE email = 'office@biozen.rs';" 2>/dev/null
```

---

## 🐛 Najčešći Problemi

### Problem 1: Database Tabela Ne Postoji

Ako `blog_posts` tabela ne postoji, Hibernate bi trebalo automatski da je kreira. Ako ne, izvrši:

```sql
CREATE TABLE IF NOT EXISTS blog_posts (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    excerpt TEXT,
    featured_image VARCHAR(500),
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Problem 2: Admin Role Nije Promenjen

Ako role nije "ADMIN", promeni ga:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'office@biozen.rs';
```

### Problem 3: Backend Greška

Proveri backend logove za specifičnu grešku (NullPointerException, SQLException, itd.).

---

## 📝 Šta Da Pošalješ

Kada pokreneš dijagnostiku, pošalji mi:
1. Output od `docker compose logs backend | grep -i "error\|exception" | tail -50`
2. Output od `\d blog_posts` (ako tabela postoji)

