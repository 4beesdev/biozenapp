# 🚀 Migracija sa Dev na Production

Ovaj vodič objašnjava kako da migrirate sve izmene sa `dev` branch-a na production (`main` branch).

## 📋 Pregled Izmena

### Backend Izmene:
- ✅ Dodato polje `obimStruka` u `User` i `Measurement` entitete
- ✅ Dodat `ChatController` sa OpenAI GPT-3.5 Turbo integracijom
- ✅ Dodat `ChatMessage` entitet i repository
- ✅ Ažuriran `AdminController` sa chat count kolonom
- ✅ Ažuriran `MeController` da prihvata `obimStruka`
- ✅ Ažuriran `MeasurementController` da obrađuje `obimStruka`
- ✅ Dodat `FileUploadController` za blog slike
- ✅ Dodat `AdminBlogController` za blog management
- ✅ Ažuriran `SecurityConfig` za nove endpoint-e

### Frontend Izmene:
- ✅ Dodat obim struka u formu "Moji podaci"
- ✅ Dodat obim struka u formu "Merenja"
- ✅ Dodat chat funkcionalnost sa AI asistentom
- ✅ Dodat blog sekcija za korisnike
- ✅ Dodat footer sa "Uslovi korišćenja" i "Politika privatnosti"
- ✅ Dodat progress bar za kilažu
- ✅ Poboljšan UI/UX (notifikacije, ikone, responsive)

### Database Migracije:
- ✅ Dodati kolone: `users.obim_struka`, `measurements.obim_struka`, `measurements.promena_obim_struka`
- ✅ Kreirana tabela `chat_messages`

### Konfiguracija:
- ✅ Dodat `OPENAI_API_KEY` environment variable
- ✅ Dodat `spring-boot-starter-webflux` dependency (za WebClient)
- ✅ Dodat OpenAI Java client dependency

---

## 🔄 Korak 1: Merge Dev u Main (Lokalno)

```bash
# 1. Idi u direktorijum projekta
cd /Users/andrejdzakovic/Dropbox/BioZen/biozenapp

# 2. Proveri da si na dev branch-u i da su sve izmene commit-ovane
git status
# Trebalo bi da vidiš: "nothing to commit, working tree clean"

# 3. Prebaci se na main branch
git checkout main

# 4. Pull najnovije izmene sa main (ako postoje)
git pull origin main

# 5. Merge dev u main
git merge dev

# 6. Ako nema konflikata, push na main
git push origin main
```

**Ako ima konflikata:**
```bash
# Reši konflikte ručno, zatim:
git add .
git commit -m "Resolve merge conflicts from dev to main"
git push origin main
```

---

## 🗄️ Korak 2: Database Migracije na Production Serveru

### Opcija A: Automatska Migracija (Preporučeno)

Hibernate će automatski dodati kolone kada se backend pokrene sa `spring.jpa.hibernate.ddl-auto=update`.

### Opcija B: Ručna Migracija (Ako Opcija A ne radi)

```bash
# 1. SSH na production server
ssh root@your-production-ip

# 2. Idi u direktorijum projekta
cd /opt/biozenapp  # ili gde god je tvoj production direktorijum

# 3. Pull najnovije izmene
git pull origin main

# 4. Konektuj se na production bazu
# (Zameni sa tvojim production database credentials)
docker exec -it biozen-postgres psql -U biozen -d biozenapp

# 5. U PostgreSQL prompt-u, izvrši SQL skriptu:
\i database_migration_add_obim_struka.sql

# ILI kopiraj sadržaj database_migration_add_obim_struka.sql i izvrši direktno:
```

SQL skripta je sigurna - proverava da li kolone već postoje pre dodavanja.

---

## ⚙️ Korak 3: Ažuriranje Environment Variables na Production

### 3.1. Dodaj OPENAI_API_KEY

```bash
# SSH na production server
ssh root@your-production-ip

# Idi u direktorijum projekta
cd /opt/biozenapp

# Uredi .env fajl
nano .env
# ILI
vi .env
```

Dodaj u `.env` fajl:
```bash
OPENAI_API_KEY=sk-tvoj-openai-api-key-ovde
```

**VAŽNO:** Proveri da li `docker-compose.production.yml` učitava `OPENAI_API_KEY`:

```yaml
backend:
  environment:
    OPENAI_API_KEY: ${OPENAI_API_KEY:-}
    # ... ostale varijable
```

Ako ne učitava, dodaj ga u `docker-compose.production.yml`:

```yaml
backend:
  environment:
    SPRING_DATASOURCE_URL: ${SPRING_DATASOURCE_URL}
    SPRING_DATASOURCE_USERNAME: ${SPRING_DATASOURCE_USERNAME}
    SPRING_DATASOURCE_PASSWORD: ${SPRING_DATASOURCE_PASSWORD}
    APP_JWT_SECRET: ${JWT_SECRET}
    APP_JWT_TTLMILLIS: ${APP_JWT_TTLMILLIS:-604800000}
    OPENAI_API_KEY: ${OPENAI_API_KEY:-}  # DODAJ OVO
```

---

## 🏗️ Korak 4: Rebuild i Deploy na Production

```bash
# 1. SSH na production server
ssh root@your-production-ip

# 2. Idi u direktorijum projekta
cd /opt/biozenapp

# 3. Pull najnovije izmene sa main branch-a
git pull origin main

# 4. Rebuild backend i frontend (VAŽNO: --no-cache za čist build)
docker compose -f docker-compose.production.yml build --no-cache backend frontend

# 5. Zaustavi postojeće containere
docker compose -f docker-compose.production.yml down

# 6. Pokreni nove containere
docker compose -f docker-compose.production.yml up -d

# 7. Proveri status
docker compose -f docker-compose.production.yml ps

# 8. Proveri logove
docker compose -f docker-compose.production.yml logs -f backend
```

**Sve odjednom (Copy-Paste):**
```bash
cd /opt/biozenapp && \
git pull origin main && \
docker compose -f docker-compose.production.yml build --no-cache backend frontend && \
docker compose -f docker-compose.production.yml down && \
docker compose -f docker-compose.production.yml up -d && \
docker compose -f docker-compose.production.yml logs -f backend
```

---

## ✅ Korak 5: Provera da Sve Radi

### 5.1. Proveri Backend

```bash
# Proveri da li backend radi
curl http://localhost:8080/api/me
# Trebalo bi da vrati JSON sa "authenticated": false (jer nema tokena)

# Proveri logove
docker compose -f docker-compose.production.yml logs backend | tail -50
# Trebalo bi da vidiš: "Started MiniAppApplication"
```

### 5.2. Proveri Frontend

```bash
# Otvori u browseru
http://your-production-domain.com
# Trebalo bi da vidiš login stranicu
```

### 5.3. Proveri Database Migracije

```bash
# Konektuj se na bazu
docker exec -it biozen-postgres psql -U biozen -d biozenapp

# Proveri da li postoje nove kolone
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'obim_struka';

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'measurements' 
AND column_name IN ('obim_struka', 'promena_obim_struka');

# Proveri da li postoji tabela chat_messages
\dt chat_messages

# Izađi
\q
```

### 5.4. Testiraj Funkcionalnosti

1. **Login** - uloguj se kao korisnik
2. **Moji podaci** - unesi obim struka i sačuvaj
3. **Merenja** - dodaj novo merenje sa obimom struka
4. **Chat** - otvori chat i pošalji poruku
5. **Blogovi** - proveri da li se blogovi prikazuju
6. **Footer** - klikni na "Uslovi korišćenja" i "Politika privatnosti"

---

## 🐛 Troubleshooting

### Problem: Backend ne može da se poveže sa bazom

```bash
# Proveri environment varijable
docker compose -f docker-compose.production.yml exec backend env | grep SPRING_DATASOURCE

# Proveri da li je baza pokrenuta
docker compose -f docker-compose.production.yml ps

# Proveri logove
docker compose -f docker-compose.production.yml logs backend | grep -i "database\|connection\|error"
```

### Problem: Chat ne radi (OpenAI API greška)

```bash
# Proveri da li je OPENAI_API_KEY postavljen
docker compose -f docker-compose.production.yml exec backend env | grep OPENAI

# Proveri logove za OpenAI greške
docker compose -f docker-compose.production.yml logs backend | grep -i "openai\|chat"
```

### Problem: Database kolone nisu dodate

```bash
# Ručno izvrši SQL migraciju (vidi Korak 2, Opcija B)
# ILI proveri da li je Hibernate ddl-auto=update u application.properties
docker compose -f docker-compose.production.yml exec backend cat /app/application.properties | grep ddl-auto
```

### Problem: Frontend ne prikazuje nove funkcionalnosti

```bash
# Hard refresh u browseru (Ctrl+Shift+R ili Cmd+Shift+R)
# ILI obriši browser cache

# Proveri da li je frontend rebuild-ovan
docker compose -f docker-compose.production.yml logs frontend | tail -50
```

---

## 📝 Checklist Pre Deploy-a

- [ ] Sve izmene su commit-ovane na `dev` branch
- [ ] `dev` je merge-ovan u `main` lokalno
- [ ] `main` je push-ovan na GitHub
- [ ] `OPENAI_API_KEY` je dodat u production `.env` fajl
- [ ] `docker-compose.production.yml` učitava `OPENAI_API_KEY`
- [ ] Database migracije su pripremljene (SQL skripta)
- [ ] Backup production baze (opciono, ali preporučeno)

---

## 🎯 Finalni Koraci

Nakon uspešnog deploy-a:

1. **Testiraj sve funkcionalnosti** (vidi Korak 5.4)
2. **Proveri logove** da nema grešaka
3. **Monitoruj aplikaciju** prvih nekoliko sati
4. **Backup baze** nakon uspešnog deploy-a

---

## 📞 Podrška

Ako imaš problema, proveri:
- `CHECK_AFTER_DEPLOY.md` - provera deployment-a
- `DATABASE_MIGRATION_INSTRUCTIONS.md` - detaljne instrukcije za migraciju
- `CORS_FINAL_FIX.md` - ako imaš CORS probleme

