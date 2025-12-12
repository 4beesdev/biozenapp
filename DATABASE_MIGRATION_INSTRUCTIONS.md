# 📋 Instrukcije za Ažuriranje Baze Podataka

## Opcija 1: Automatsko Ažuriranje (Preporučeno - Probaj Prvo)

Spring Boot sa `spring.jpa.hibernate.ddl-auto=update` bi **trebalo automatski** da doda nove kolone kada se backend pokrene.

### Korak 1: Restart Backend-a

```bash
# Idi u direktorijum projekta
cd /opt/biozenapp-dev

# Restart backend container-a
docker compose -f docker-compose.dev.yml restart backend-dev

# Proveri logove da vidiš da li je sve u redu
docker compose -f docker-compose.dev.yml logs backend-dev | tail -50
```

### Korak 2: Proveri da li su kolone dodate

Ako vidiš u logovima da je backend uspešno startovao, kolone su verovatno dodate. Proveri:

```bash
# Konektuj se na bazu kroz Docker container
docker exec -it biozen-postgres-dev psql -U biozen -d biozenapp_dev

# U PostgreSQL prompt-u, izvrši:
\dt                    # Prikaži sve tabele
\d users               # Prikaži strukturu tabele users
\d measurements        # Prikaži strukturu tabele measurements

# Proveri da li postoje kolone:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'obim_struka';

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'measurements' AND column_name IN ('obim_struka', 'promena_obim_struka');

# Ako vidiš kolone, izađi:
\q
```

---

## Opcija 2: Ručno Dodavanje Kolona (Ako Opcija 1 Ne Radi)

### Korak 1: Kopiraj SQL Skriptu na Server

```bash
# Idi u direktorijum projekta
cd /opt/biozenapp-dev

# Proveri da li postoji SQL fajl (trebalo bi da postoji u root direktorijumu)
ls -la database_migration_add_obim_struka.sql
```

Ako fajl ne postoji, kreiraj ga:

```bash
# Kreiraj SQL fajl
cat > database_migration_add_obim_struka.sql << 'EOF'
-- SQL skripta za dodavanje kolona obimStruka
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'obim_struka'
    ) THEN
        ALTER TABLE users ADD COLUMN obim_struka DOUBLE PRECISION;
        RAISE NOTICE 'Kolona obim_struka je dodata u tabelu users';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'measurements' AND column_name = 'obim_struka'
    ) THEN
        ALTER TABLE measurements ADD COLUMN obim_struka DOUBLE PRECISION;
        RAISE NOTICE 'Kolona obim_struka je dodata u tabelu measurements';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'measurements' AND column_name = 'promena_obim_struka'
    ) THEN
        ALTER TABLE measurements ADD COLUMN promena_obim_struka DOUBLE PRECISION;
        RAISE NOTICE 'Kolona promena_obim_struka je dodata u tabelu measurements';
    END IF;
END $$;
EOF
```

### Korak 2: Izvrši SQL Skriptu

```bash
# Kopiraj SQL fajl u Docker container
docker cp database_migration_add_obim_struka.sql biozen-postgres-dev:/tmp/migration.sql

# Izvrši SQL skriptu
docker exec -it biozen-postgres-dev psql -U biozen -d biozenapp_dev -f /tmp/migration.sql
```

**Ili direktno kroz psql:**

```bash
# Konektuj se na bazu
docker exec -it biozen-postgres-dev psql -U biozen -d biozenapp_dev

# U PostgreSQL prompt-u, kopiraj i nalepi ove komande (jednu po jednu):

-- Dodaj obim_struka u users
ALTER TABLE users ADD COLUMN IF NOT EXISTS obim_struka DOUBLE PRECISION;

-- Dodaj obim_struka u measurements
ALTER TABLE measurements ADD COLUMN IF NOT EXISTS obim_struka DOUBLE PRECISION;

-- Dodaj promena_obim_struka u measurements
ALTER TABLE measurements ADD COLUMN IF NOT EXISTS promena_obim_struka DOUBLE PRECISION;

-- Proveri da li su dodate
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE (table_name = 'users' AND column_name = 'obim_struka')
   OR (table_name = 'measurements' AND column_name IN ('obim_struka', 'promena_obim_struka'));

-- Izađi
\q
```

---

## Provera da li je Sve U Redu

### 1. Proveri Backend Logove

```bash
docker compose -f docker-compose.dev.yml logs backend-dev | grep -i "error\|exception\|started"
```

Trebalo bi da vidiš:
- ✅ `Started MiniAppApplication`
- ✅ Nema grešaka o nedostajućim kolonama

### 2. Testiraj API

```bash
# Testiraj da li backend radi
curl http://localhost:8082/api/actuator/health

# Trebalo bi da dobiješ: {"status":"UP"}
```

### 3. Testiraj u Browser-u

Otvori `http://dev.biozen.rs` i:
- Uloguj se
- Idi na "Moji podaci" - trebalo bi da vidiš polje "Obim struka"
- Idi na "Merenja" - trebalo bi da vidiš kolone za obim struka

---

## Ako Imaš Problema

### Problem: "Column already exists"

To je OK! To znači da su kolone već dodate. Možeš nastaviti.

### Problem: "Permission denied"

```bash
# Proveri da li si root
whoami

# Ako nisi root, koristi sudo
sudo docker exec -it biozen-postgres-dev psql -U biozen -d biozenapp_dev
```

### Problem: "Container not found"

```bash
# Proveri da li je container pokrenut
docker ps | grep postgres

# Ako nije, pokreni ga
docker compose -f docker-compose.dev.yml up -d postgres-dev
```

---

## ✅ Finalna Provera

Nakon što si izvršio migraciju, proveri:

```bash
# 1. Proveri da li su kolone dodate
docker exec -it biozen-postgres-dev psql -U biozen -d biozenapp_dev -c "
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE (table_name = 'users' AND column_name = 'obim_struka')
   OR (table_name = 'measurements' AND column_name IN ('obim_struka', 'promena_obim_struka'))
ORDER BY table_name, column_name;
"

# Trebalo bi da vidiš 3 reda:
# users | obim_struka | double precision
# measurements | obim_struka | double precision
# measurements | promena_obim_struka | double precision
```

Ako vidiš sve 3 kolone, **migracija je uspešna!** 🎉

