# 🔑 Kako da Pronađeš Lozinku za Production Bazu

## Opcija 1: Digital Ocean Dashboard (Najlakše)

### Korak 1: Otvori Digital Ocean Dashboard

1. Idi na: https://cloud.digitalocean.com
2. Uloguj se

### Korak 2: Pronađi Bazu

1. Klikni na **Databases** u levom meniju
2. Trebalo bi da vidiš listu baza - traži production bazu:
   - Može biti imenovana kao `biozen-db`, `production-db`, ili nešto slično
   - ILI ako koristiš App Platform, idi na **Apps** → Tvoja aplikacija → **Components** → **Database**

### Korak 3: Otvori Connection Details

1. Klikni na bazu
2. Idi na **Connection Details** tab
3. Tu ćeš videti:
   - **Host**
   - **Port**
   - **Database**
   - **Username**
   - **Password** ← **OVO JE ONO ŠTO TRAŽIŠ!**
   - **SSL Mode**

### Korak 4: Kopiraj Password

1. Klikni na **Show** pored Password polja
2. Kopiraj password

---

## Opcija 2: Proveri na Production Serveru

Možda je password već setovan u `.env` fajlu na serveru:

```bash
# SSH na production server
ssh root@your-production-ip

# Idi u direktorijum
cd /opt/biozenapp

# Proveri .env fajl
cat .env | grep SPRING_DATASOURCE_PASSWORD

# ILI proveri sve database varijable
cat .env | grep -i database
```

**Ako vidiš password u `.env` fajlu, to je to!**

---

## Opcija 3: Proveri Connection String

Ako imaš `DATABASE_URL` ili `SPRING_DATASOURCE_URL` u `.env` fajlu, password je deo connection string-a:

```bash
cd /opt/biozenapp
cat .env | grep DATABASE_URL
```

**Format connection string-a:**
```
postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE
```

**Primer:**
```
postgresql://biozen:mypassword123@db.example.com:25060/biozenapp
```

U ovom primeru, password je: `mypassword123`

---

## Opcija 4: Resetuj Password (Ako Ne Možeš da Ga Pronađeš)

Ako ne možeš da pronađeš password, možeš ga resetovati:

1. Idi na Digital Ocean Dashboard → **Databases** → Tvoja baza
2. Klikni na **Settings** tab
3. Scroll do **Database Credentials**
4. Klikni **Reset Password**
5. Unesi novi password
6. **Zapamti ga!**

---

## ✅ Nakon Što Pronađeš Password

Dodaj ga u `.env` fajl na production serveru:

```bash
cd /opt/biozenapp

# Proveri da li već postoji
cat .env | grep SPRING_DATASOURCE_PASSWORD

# Ako ne postoji, dodaj ga
echo "SPRING_DATASOURCE_PASSWORD=tvoj-password-ovde" >> .env

# Proveri
cat .env | grep SPRING_DATASOURCE
```

**Zameni `tvoj-password-ovde` sa stvarnim password-om koji si kopirao iz Digital Ocean Dashboard-a.**

---

## 🎯 Sve Odjednom - Copy-Paste Komande

```bash
# SSH na production server
ssh root@your-production-ip

# Idi u direktorijum
cd /opt/biozenapp

# Proveri da li već postoji password u .env
echo "=== PROVERA POSTOJEĆEG PASSWORD-A ===" && \
cat .env | grep -i "SPRING_DATASOURCE_PASSWORD\|DATABASE_URL" || echo "Password nije u .env fajlu"

# Ako ne postoji, dodaj ga (ZAMENI sa tvojim stvarnim password-om iz Digital Ocean)
# echo "SPRING_DATASOURCE_PASSWORD=tvoj-password-ovde" >> .env

# Proveri sve database varijable
echo "" && \
echo "=== SVE DATABASE VARIJABLE ===" && \
cat .env | grep -i "database\|postgres" || echo "Nema database varijabli"
```

---

## ⚠️ VAŽNO

**Password je osetljiv podatak!**
- Ne deli ga javno
- Ne commit-uj ga u git
- Ne šalji ga preko email-a
- Koristi ga samo u `.env` fajlu na serveru

---

## 📝 Primer .env Fajla

Tvoj `.env` fajl na production serveru treba da ima:

```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://host:port/database
SPRING_DATASOURCE_USERNAME=biozen
SPRING_DATASOURCE_PASSWORD=tvoj-password-ovde
JWT_SECRET=tvoj-jwt-secret
OPENAI_API_KEY=sk-tvoj-openai-key
MAIL_PASSWORD=tvoja-email-lozinka
REACT_APP_API_URL=https://biozen.rs
```

**Zameni sve `tvoj-...-ovde` sa stvarnim vrednostima!**

