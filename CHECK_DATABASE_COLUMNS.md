# ✅ Provera Database Kolona

## Status Backend-a

- ✅ `Started MiniAppApplication` - backend je pokrenut
- ✅ Hibernate je izvršio ALTER TABLE upite (za blog_posts i chat_messages)
- ✅ Tomcat je pokrenut na portu 8080
- ✅ JwtAuthFilter radi

---

## Provera Kolona

Proveri da li su sve kolone dodate:

```bash
# SSH na production server
ssh root@your-production-ip
cd /opt/biozenapp

# 1. Proveri users tabelu
echo "=== USERS TABELA ===" && \
docker compose -f docker-compose.production.yml exec postgres psql -U biozen -d biozenapp -c "\d users"

# 2. Proveri measurements tabelu
echo "" && \
echo "=== MEASUREMENTS TABELA ===" && \
docker compose -f docker-compose.production.yml exec postgres psql -U biozen -d biozenapp -c "\d measurements"
```

---

## Šta Tražimo

### users tabela treba da ima:
- `id`
- `email`
- `password_hash`
- `ime`
- `prezime`
- `pol`
- `starost`
- `kilaza`
- `zeljena_kilaza`
- **`obim_struka`** ← OVO TRAŽIMO

### measurements tabela treba da ima:
- `id`
- `user_id`
- `datum`
- `kilaza`
- `promena`
- **`obim_struka`** ← OVO TRAŽIMO
- **`promena_obim_struka`** ← OVO TRAŽIMO
- `komentar`

---

## Ako Kolone Ne Postoje

Ako `obim_struka` kolone ne postoje, Hibernate bi ih trebalo automatski da doda pri sledećem restart-u. Ako ne, izvrši ručnu migraciju:

```bash
# Konektuj se na bazu
docker compose -f docker-compose.production.yml exec postgres psql -U biozen -d biozenapp
```

U PostgreSQL prompt-u, izvrši:

```sql
-- Dodaj obimStruka u tabelu users (ako ne postoji)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'obim_struka'
    ) THEN
        ALTER TABLE users ADD COLUMN obim_struka DOUBLE PRECISION;
        RAISE NOTICE 'Kolona obim_struka je dodata u tabelu users';
    ELSE
        RAISE NOTICE 'Kolona obim_struka već postoji u tabeli users';
    END IF;
END $$;

-- Dodaj obimStruka u tabelu measurements (ako ne postoji)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'measurements' 
        AND column_name = 'obim_struka'
    ) THEN
        ALTER TABLE measurements ADD COLUMN obim_struka DOUBLE PRECISION;
        RAISE NOTICE 'Kolona obim_struka je dodata u tabelu measurements';
    ELSE
        RAISE NOTICE 'Kolona obim_struka već postoji u tabeli measurements';
    END IF;
END $$;

-- Dodaj promenaObimStruka u tabelu measurements (ako ne postoji)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'measurements' 
        AND column_name = 'promena_obim_struka'
    ) THEN
        ALTER TABLE measurements ADD COLUMN promena_obim_struka DOUBLE PRECISION;
        RAISE NOTICE 'Kolona promena_obim_struka je dodata u tabelu measurements';
    ELSE
        RAISE NOTICE 'Kolona promena_obim_struka već postoji u tabeli measurements';
    END IF;
END $$;

-- Izađi
\q
```

---

## 🎯 Sve Odjednom - Copy-Paste

```bash
# SSH na production server
ssh root@your-production-ip
cd /opt/biozenapp

# 1. Proveri users tabelu
echo "=== USERS TABELA ===" && \
docker compose -f docker-compose.production.yml exec postgres psql -U biozen -d biozenapp -c "\d users" 2>/dev/null

# 2. Proveri measurements tabelu
echo "" && \
echo "=== MEASUREMENTS TABELA ===" && \
docker compose -f docker-compose.production.yml exec postgres psql -U biozen -d biozenapp -c "\d measurements" 2>/dev/null

# 3. Proveri da li obim_struka postoji u users
echo "" && \
echo "=== PROVERA obim_struka u users ===" && \
docker compose -f docker-compose.production.yml exec postgres psql -U biozen -d biozenapp -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'obim_struka';" 2>/dev/null

# 4. Proveri da li obim_struka postoji u measurements
echo "" && \
echo "=== PROVERA obim_struka u measurements ===" && \
docker compose -f docker-compose.production.yml exec postgres psql -U biozen -d biozenapp -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'measurements' AND column_name IN ('obim_struka', 'promena_obim_struka');" 2>/dev/null
```

---

## ✅ Checklist

- [ ] Backend je pokrenut (`Started MiniAppApplication`)
- [ ] `users` tabela ima `obim_struka` kolonu
- [ ] `measurements` tabela ima `obim_struka` kolonu
- [ ] `measurements` tabela ima `promena_obim_struka` kolonu
- [ ] `chat_messages` tabela postoji
- [ ] `blog_posts` tabela postoji

---

## 🎉 Gotovo!

Kada sve proveri, aplikacija je spremna za production! 🚀

