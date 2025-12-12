# 🔧 Popravka Limita za Blog Excerpt

## Problem

`excerpt` kolona ima limit od 500 karaktera. Ako uneseš excerpt duži od 500 karaktera, baza će baciti grešku.

## Rešenje

Promenio sam `excerpt` kolonu sa `VARCHAR(500)` na `TEXT` (bez limita).

Takođe, povećao sam `featured_image` limit sa 255 na 1000 karaktera.

---

## Korak 1: Pull Najnovije Izmene

```bash
# SSH na production server
ssh root@164.90.231.47
cd /opt/biozenapp

# Pull najnovije izmene
git pull origin main
```

---

## Korak 2: Rebuild Backend

```bash
# Rebuild backend
docker compose -f docker-compose.production.yml build --no-cache backend

# Restart backend (Hibernate će automatski ažurirati kolone)
docker compose -f docker-compose.production.yml restart backend

# Sačekaj 10 sekundi
sleep 10
```

---

## Korak 3: Proveri da Li Su Kolone Ažurirane

```bash
# Proveri strukturu tabele
docker compose -f docker-compose.production.yml exec postgres psql -U biozen -d biozenapp -c "\d blog_posts"
```

**Trebalo bi da vidiš:**
- `excerpt` kolona: `text` (umesto `character varying(500)`)
- `featured_image` kolona: `character varying(1000)` (umesto `character varying(255)`)

---

## Korak 4: Ako Hibernate Ne Ažurira Automatski

Ako Hibernate ne ažurira automatski, izvrši ručnu migraciju:

```bash
# Konektuj se na bazu
docker compose -f docker-compose.production.yml exec postgres psql -U biozen -d biozenapp
```

U PostgreSQL prompt-u:

```sql
-- Promeni excerpt kolonu u TEXT
ALTER TABLE blog_posts ALTER COLUMN excerpt TYPE TEXT;

-- Promeni featured_image kolonu u VARCHAR(1000)
ALTER TABLE blog_posts ALTER COLUMN featured_image TYPE VARCHAR(1000);

-- Proveri
\d blog_posts

-- Izađi
\q
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

# 5. Proveri strukturu tabele
echo "" && \
echo "=== STRUKTURA TABELE ===" && \
docker compose -f docker-compose.production.yml exec postgres psql -U biozen -d biozenapp -c "\d blog_posts" 2>/dev/null

# 6. Ako excerpt nije TEXT, izvrši ručnu migraciju
echo "" && \
echo "=== RUČNA MIGRACIJA (ako je potrebno) ===" && \
docker compose -f docker-compose.production.yml exec postgres psql -U biozen -d biozenapp -c "
ALTER TABLE blog_posts ALTER COLUMN excerpt TYPE TEXT;
ALTER TABLE blog_posts ALTER COLUMN featured_image TYPE VARCHAR(1000);
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'blog_posts' 
AND column_name IN ('excerpt', 'featured_image');
" 2>/dev/null
```

---

## ✅ Provera

Nakon migracije, proveri:

```bash
# Proveri strukturu tabele
docker compose -f docker-compose.production.yml exec postgres psql -U biozen -d biozenapp -c "\d blog_posts"
```

**Trebalo bi da vidiš:**
- `excerpt | text`
- `featured_image | character varying(1000)`

---

## 🎉 Gotovo!

Nakon migracije, možeš da kreiraš blog sa dužim excerpt-om i featured_image URL-om!

