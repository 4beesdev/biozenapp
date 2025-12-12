# 📧 Kako da Dodaš Email Kredencijale u Production

Email kredencijali se koriste za slanje email-ova (reset lozinke, welcome email, itd.).

---

## 📋 Šta Treba da Dodaš

U `.env` fajl na production serveru treba da dodaš:

```
MAIL_PASSWORD=tvoja-email-lozinka-ovde
```

**Napomena:** Email username (`no-reply@biozen.rs`) i host (`mail.biozen.rs`) su već konfigurisani u `application.properties` i ne treba ih menjati.

---

## 🔑 Korak 1: SSH na Production Server

```bash
ssh root@your-production-ip
```

---

## 📁 Korak 2: Idi u Direktorijum Projekta

```bash
cd /opt/biozenapp
```

---

## ✏️ Korak 3: Dodaj MAIL_PASSWORD u .env Fajl

### Opcija A: Najjednostavnije (Dodaj na kraj fajla)

```bash
echo "MAIL_PASSWORD=tvoja-email-lozinka-ovde" >> .env
```

**VAŽNO:** Zameni `tvoja-email-lozinka-ovde` sa tvojom stvarnom email lozinkom za `no-reply@biozen.rs`.

### Opcija B: Otvori u Editoru (Ako Već Imaš .env)

```bash
nano .env
```

Dodaj liniju:
```
MAIL_PASSWORD=tvoja-email-lozinka-ovde
```

Zatim:
1. Pritisni `Ctrl + O` (Save)
2. Pritisni `Enter` (potvrdi)
3. Pritisni `Ctrl + X` (Exit)

---

## ✅ Korak 4: Proveri da Li Je Dodato

```bash
cat .env | grep MAIL_PASSWORD
```

**Trebalo bi da vidiš:**
```
MAIL_PASSWORD=tvoja-email-lozinka-ovde
```

---

## 🔍 Korak 5: Proveri Ceo .env Fajl

```bash
cat .env
```

**Trebalo bi da vidiš sve environment variables, uključujući:**
```
SPRING_DATASOURCE_URL=...
SPRING_DATASOURCE_USERNAME=...
SPRING_DATASOURCE_PASSWORD=...
JWT_SECRET=...
OPENAI_API_KEY=sk-tvoj-api-key-ovde
MAIL_PASSWORD=tvoja-email-lozinka-ovde
```

---

## ⚙️ Korak 6: Proveri da Li Docker Compose Učitava MAIL_PASSWORD

```bash
grep MAIL_PASSWORD docker-compose.production.yml
```

**Ako ne vidiš ništa**, treba da dodamo `MAIL_PASSWORD` u `docker-compose.production.yml`.

---

## 🔧 Korak 7: Dodaj MAIL_PASSWORD u docker-compose.production.yml (Ako Nije)

Ako `docker-compose.production.yml` ne učitava `MAIL_PASSWORD`, dodaj ga:

```bash
nano docker-compose.production.yml
```

Pronađi sekciju `backend:` → `environment:` i dodaj:

```yaml
backend:
  environment:
    SPRING_DATASOURCE_URL: ${SPRING_DATASOURCE_URL}
    SPRING_DATASOURCE_USERNAME: ${SPRING_DATASOURCE_USERNAME}
    SPRING_DATASOURCE_PASSWORD: ${SPRING_DATASOURCE_PASSWORD}
    APP_JWT_SECRET: ${JWT_SECRET}
    APP_JWT_TTLMILLIS: ${APP_JWT_TTLMILLIS:-604800000}
    OPENAI_API_KEY: ${OPENAI_API_KEY:-}
    MAIL_PASSWORD: ${MAIL_PASSWORD:-}  # DODAJ OVO
```

Zatim:
1. Pritisni `Ctrl + O` (Save)
2. Pritisni `Enter` (potvrdi)
3. Pritisni `Ctrl + X` (Exit)

---

## 🎯 Sve Odjednom (Copy-Paste)

Ako želiš da dodam i `MAIL_PASSWORD` i `OPENAI_API_KEY` odjednom:

```bash
cd /opt/biozenapp && \
echo "OPENAI_API_KEY=sk-tvoj-api-key-ovde" >> .env && \
echo "MAIL_PASSWORD=tvoja-email-lozinka-ovde" >> .env && \
cat .env | grep -E "OPENAI|MAIL"
```

**VAŽNO:** 
- Zameni `sk-tvoj-api-key-ovde` sa tvojim OpenAI API key-jem
- Zameni `tvoja-email-lozinka-ovde` sa tvojom email lozinkom

---

## 📝 Primer Kompletnog .env Fajla

```bash
# Backend Database
SPRING_DATASOURCE_URL=jdbc:postgresql://your-db-host:5432/biozenapp
SPRING_DATASOURCE_USERNAME=biozen
SPRING_DATASOURCE_PASSWORD=your-db-password

# JWT Secret
JWT_SECRET=your-jwt-secret-min-32-characters-long

# JWT TTL (opciono, default je 7 dana)
APP_JWT_TTLMILLIS=604800000

# OpenAI API Key
OPENAI_API_KEY=sk-tvoj-openai-api-key-ovde

# Email Password (za no-reply@biozen.rs)
MAIL_PASSWORD=tvoja-email-lozinka-ovde
```

---

## 🔍 Gde Se Email Kredencijali Koriste

Email kredencijali se koriste za:
- **Reset lozinke** - slanje linka za reset lozinke
- **Welcome email** - dobrodošlica novim korisnicima

Email postavke su već konfigurisane u `application.properties`:
- Host: `mail.biozen.rs`
- Port: `587`
- Username: `no-reply@biozen.rs`
- Password: `${MAIL_PASSWORD}` (iz .env fajla)

---

## ✅ Finalna Provera

```bash
# Proveri da li su sve varijable u .env
cat .env

# Proveri da li docker-compose učitava varijable
grep -E "OPENAI|MAIL" docker-compose.production.yml
```

---

## 🐛 Troubleshooting

### Problem: Email se ne šalje

```bash
# Proveri da li je MAIL_PASSWORD postavljen
docker compose -f docker-compose.production.yml exec backend env | grep MAIL

# Proveri logove za email greške
docker compose -f docker-compose.production.yml logs backend | grep -i "mail\|email"
```

### Problem: "Authentication failed" pri slanju email-a

- Proveri da li je `MAIL_PASSWORD` tačan
- Proveri da li email nalog `no-reply@biozen.rs` postoji
- Proveri da li je SMTP server `mail.biozen.rs` dostupan

---

## 📋 Checklist

- [ ] `MAIL_PASSWORD` je dodat u `.env` fajl
- [ ] `MAIL_PASSWORD` je dodat u `docker-compose.production.yml` (ako nije već)
- [ ] Lozinka je tačna za `no-reply@biozen.rs`
- [ ] Backend je rebuild-ovan i restart-ovan
- [ ] Testirao si slanje email-a (npr. forgot password)

