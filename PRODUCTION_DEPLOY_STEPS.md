# 🚀 Koraci za Production Deploy - Sve Odjednom

## ✅ Šta Si Već Uradio

- [x] Dodao `OPENAI_API_KEY` u `.env`
- [x] Dodao `MAIL_PASSWORD` u `.env`

---

## 📋 Šta Dalje - Korak po Korak

### Korak 1: Pull Najnovije Izmene sa Main

```bash
# SSH na production server
ssh root@your-production-ip

# Idi u production direktorijum
cd /opt/biozenapp

# Pull najnovije izmene
git pull origin main
```

---

### Korak 2: Rebuild Backend i Frontend

```bash
# Rebuild sa --no-cache (da koristi nove izmene)
docker compose -f docker-compose.production.yml build --no-cache backend frontend
```

**Ovo može potrajati 5-10 minuta** - strpljivo!

---

### Korak 3: Zaustavi Stare Containere

```bash
docker compose -f docker-compose.production.yml down
```

---

### Korak 4: Pokreni Nove Containere

```bash
docker compose -f docker-compose.production.yml up -d
```

---

### Korak 5: Proveri Status

```bash
docker compose -f docker-compose.production.yml ps
```

**Trebalo bi da vidiš:**
```
NAME                  STATUS
biozen-backend        Up
biozen-frontend       Up
```

---

### Korak 6: Proveri Backend Logove

```bash
docker compose -f docker-compose.production.yml logs backend | tail -50
```

**Traži:**
- `Started MiniAppApplication` - backend je uspešno startovao
- `HikariPool-1 - Start completed` - baza je povezana
- Ako vidiš greške, pročitaj ih

---

## 🗄️ Korak 7: Proveri Database Migracije

### Opcija A: Automatska Migracija (Hibernate)

Hibernate bi **trebalo automatski** da doda nove kolone kada se backend pokrene.

**Proveri da li su kolone dodate:**

```bash
# Konektuj se na production bazu
# (Zameni sa tvojim production database credentials)
docker exec -it biozen-postgres psql -U biozen -d biozenapp

# ILI ako koristiš managed database, konektuj se direktno:
# psql -h your-db-host -U biozen -d biozenapp
```

**U PostgreSQL prompt-u:**

```sql
-- Proveri da li postoji obim_struka u users tabeli
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'obim_struka';

-- Proveri da li postoje kolone u measurements tabeli
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'measurements' 
AND column_name IN ('obim_struka', 'promena_obim_struka');

-- Proveri da li postoji chat_messages tabela
\dt chat_messages

-- Izađi
\q
```

**Ako vidiš kolone/tabelu** - migracija je uspešna! ✅

**Ako ne vidiš** - koristi Opciju B (ručna migracija).

---

### Opcija B: Ručna Migracija (Ako Automatska Ne Radi)

```bash
# Konektuj se na bazu
docker exec -it biozen-postgres psql -U biozen -d biozenapp

# ILI ako koristiš managed database:
# psql -h your-db-host -U biozen -d biozenapp
```

**U PostgreSQL prompt-u, kopiraj i izvrši SQL skriptu:**

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

-- Proveri da li postoji chat_messages tabela
CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    role VARCHAR(50) NOT NULL,
    message VARCHAR(2000) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Izađi
\q
```

---

## ✅ Korak 8: Finalna Provera

### 8.1. Proveri da Li Backend Radi

```bash
# Proveri da li backend odgovara
curl http://localhost:8080/api/me

# Trebalo bi da vrati JSON sa "authenticated": false
```

### 8.2. Proveri da Li Frontend Radi

```bash
# Otvori u browseru
http://your-production-domain.com

# Trebalo bi da vidiš login stranicu
```

### 8.3. Testiraj Funkcionalnosti

1. **Login** - uloguj se kao korisnik
2. **Moji podaci** - unesi obim struka i sačuvaj
3. **Merenja** - dodaj novo merenje sa obimom struka
4. **Chat** - otvori chat i pošalji poruku (proveri da li radi)
5. **Blogovi** - proveri da li se blogovi prikazuju
6. **Footer** - klikni na "Uslovi korišćenja" i "Politika privatnosti"

---

## 🎯 Sve Odjednom (Copy-Paste)

```bash
# SSH na production server
ssh root@your-production-ip

# Sve korake odjednom
cd /opt/biozenapp && \
git pull origin main && \
docker compose -f docker-compose.production.yml build --no-cache backend frontend && \
docker compose -f docker-compose.production.yml down && \
docker compose -f docker-compose.production.yml up -d && \
echo "=== STATUS ===" && \
docker compose -f docker-compose.production.yml ps && \
echo "" && \
echo "=== BACKEND LOGOVI (poslednjih 30 linija) ===" && \
docker compose -f docker-compose.production.yml logs backend | tail -30
```

---

## 🐛 Troubleshooting

### Problem: Backend ne može da se poveže sa bazom

```bash
# Proveri environment variables
docker compose -f docker-compose.production.yml exec backend env | grep SPRING_DATASOURCE

# Proveri da li je baza dostupna
docker compose -f docker-compose.production.yml ps
```

### Problem: Chat ne radi (OpenAI greška)

```bash
# Proveri da li je OPENAI_API_KEY postavljen
docker compose -f docker-compose.production.yml exec backend env | grep OPENAI

# Proveri logove za OpenAI greške
docker compose -f docker-compose.production.yml logs backend | grep -i "openai\|chat"
```

### Problem: Email se ne šalje

```bash
# Proveri da li je MAIL_PASSWORD postavljen
docker compose -f docker-compose.production.yml exec backend env | grep MAIL

# Proveri logove za email greške
docker compose -f docker-compose.production.yml logs backend | grep -i "mail\|email"
```

### Problem: Database kolone nisu dodate

```bash
# Proveri da li Hibernate pokušava da doda kolone
docker compose -f docker-compose.production.yml logs backend | grep -i "hibernate\|ddl\|alter"

# Ako ne vidiš ništa, izvrši ručnu migraciju (vidi Korak 7, Opcija B)
```

---

## 📝 Checklist

- [ ] `OPENAI_API_KEY` je dodat u `.env`
- [ ] `MAIL_PASSWORD` je dodat u `.env`
- [ ] `git pull origin main` je izvršen
- [ ] Backend i frontend su rebuild-ovani
- [ ] Containeri su restart-ovani
- [ ] Backend logovi pokazuju "Started MiniAppApplication"
- [ ] Database kolone su dodate (automatski ili ručno)
- [ ] Chat radi (testirao si)
- [ ] Email radi (testirao si forgot password)
- [ ] Obim struka se čuva (testirao si)

---

## 🎉 Gotovo!

Kada sve proveri i testira, aplikacija je spremna za production! 🚀

