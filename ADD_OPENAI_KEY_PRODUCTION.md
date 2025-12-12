# 🔑 Kako da Dodaš OPENAI_API_KEY u Production .env Fajl

## Korak 1: SSH na Production Server

```bash
ssh root@your-production-ip
```

**Zameni `your-production-ip` sa tvojom stvarnom IP adresom ili domenom.**

---

## Korak 2: Idi u Direktorijum Projekta

```bash
cd /opt/biozenapp
```

**Napomena:** Ako je tvoj production direktorijum negde drugde, zameni sa pravim putem.

---

## Korak 3: Proveri da Li Postoji .env Fajl

```bash
ls -la .env
```

**Ako vidiš fajl**, nastavi sa Korakom 4.
**Ako vidiš "No such file or directory"**, kreiraj fajl sa Korakom 3a.

### Korak 3a: Kreiraj .env Fajl (Ako Ne Postoji)

```bash
touch .env
```

---

## Korak 4: Otvori .env Fajl sa Nano Editorom

```bash
nano .env
```

**Šta će se desiti:**
- Otvoriće se editor u terminalu
- Videćeš sadržaj fajla (ako postoji) ili prazan fajl

---

## Korak 5: Dodaj OPENAI_API_KEY

### Ako je fajl prazan:
Unesi sledeće (zameni `sk-tvoj-api-key-ovde` sa tvojim stvarnim OpenAI API key-jem):

```
OPENAI_API_KEY=sk-tvoj-api-key-ovde
```

### Ako fajl već ima sadržaj:
Pomeri se na kraj fajla (koristi strelice na tastaturi) i dodaj novu liniju:

```
OPENAI_API_KEY=sk-tvoj-api-key-ovde
```

**VAŽNO:** 
- Ne dodavaj razmake oko `=`
- Ne dodavaj navodnike
- API key počinje sa `sk-`

---

## Korak 6: Sačuvaj i Izađi iz Editora

**U Nano editoru:**

1. Pritisni `Ctrl + O` (za Save/Write)
2. Pritisni `Enter` (da potvrdiš ime fajla)
3. Pritisni `Ctrl + X` (za Exit)

**Alternativa - Ako koristiš Vi editor:**

Ako si slučajno otvorio sa `vi .env` umesto `nano .env`:

1. Pritisni `i` (za Insert mode)
2. Dodaj liniju: `OPENAI_API_KEY=sk-tvoj-api-key-ovde`
3. Pritisni `Esc` (za izlaz iz Insert mode)
4. Unesi `:wq` i pritisni `Enter` (za Write i Quit)

---

## Korak 7: Proveri da Li Je Dodato

```bash
cat .env | grep OPENAI_API_KEY
```

**Trebalo bi da vidiš:**
```
OPENAI_API_KEY=sk-tvoj-api-key-ovde
```

---

## Korak 8: Proveri Ceo .env Fajl (Opciono)

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
```

---

## 🎯 Sve Odjednom (Copy-Paste)

Ako želiš da dodam direktno bez otvaranja editora:

```bash
cd /opt/biozenapp && \
echo "OPENAI_API_KEY=sk-tvoj-api-key-ovde" >> .env && \
cat .env | grep OPENAI_API_KEY
```

**VAŽNO:** 
- Zameni `sk-tvoj-api-key-ovde` sa tvojim stvarnim API key-jem
- Ova komanda **dodaje** na kraj fajla (ne zamenjuje postojeći ako već postoji)

---

## ✅ Finalna Provera

```bash
# Proveri da li je OPENAI_API_KEY u fajlu
grep OPENAI_API_KEY .env

# Proveri da li docker-compose.production.yml učitava ovu varijablu
grep OPENAI_API_KEY docker-compose.production.yml
```

**Trebalo bi da vidiš:**
- U `.env`: `OPENAI_API_KEY=sk-tvoj-api-key-ovde`
- U `docker-compose.production.yml`: `OPENAI_API_KEY: ${OPENAI_API_KEY:-}`

---

## 🐛 Troubleshooting

### Problem: "Permission denied" pri čuvanju

```bash
# Proveri permisije
ls -la .env

# Ako treba, promeni vlasnika
chown root:root .env
chmod 600 .env
```

### Problem: Fajl je prazan nakon čuvanja

```bash
# Proveri da li je fajl zaista sačuvan
cat .env

# Ako je prazan, probaj ponovo sa nano
nano .env
```

### Problem: Ne znam gde je production direktorijum

```bash
# Pronađi gde je docker-compose.production.yml
find / -name "docker-compose.production.yml" 2>/dev/null

# ILI proveri gde su Docker containeri
docker ps

# ILI proveri gde je git repozitorijum
find / -name ".git" -type d 2>/dev/null | grep biozen
```

---

## 📝 Primer Kompletnog .env Fajla

Ako želiš da vidiš kako bi trebao da izgleda kompletan .env fajl:

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
```

---

## 🎯 Najjednostavniji Način (Ako Već Imaš .env)

```bash
# 1. SSH na server
ssh root@your-production-ip

# 2. Idi u direktorijum
cd /opt/biozenapp

# 3. Dodaj OPENAI_API_KEY (zameni sa tvojim key-jem)
echo "OPENAI_API_KEY=sk-tvoj-api-key-ovde" >> .env

# 4. Proveri
cat .env | grep OPENAI
```

**To je to!** Nema potrebe za editorom ako samo dodaješ jednu liniju.

