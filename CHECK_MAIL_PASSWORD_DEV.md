# 🔍 Kako da Proveriš MAIL_PASSWORD na Dev Serveru

## 📋 Gde Se Može Naći MAIL_PASSWORD

Email lozinka se može naći na nekoliko mesta na dev serveru:

---

## 🔍 Metoda 1: Proveri .env Fajl na Dev Serveru

```bash
# SSH na dev server
ssh root@164.90.231.47

# Idi u dev direktorijum
cd /opt/biozenapp-dev

# Proveri da li postoji .env fajl
ls -la .env

# Proveri da li MAIL_PASSWORD postoji u .env
cat .env | grep MAIL_PASSWORD
```

**Ako vidiš:**
```
MAIL_PASSWORD=tvoja-lozinka-ovde
```
**To je tvoja email lozinka!**

---

## 🔍 Metoda 2: Proveri Environment Variables u Backend Container-u

```bash
# SSH na dev server
ssh root@164.90.231.47

# Idi u dev direktorijum
cd /opt/biozenapp-dev

# Proveri environment variables u backend container-u
docker compose -f docker-compose.dev.yml exec backend-dev env | grep MAIL
```

**Ako vidiš:**
```
MAIL_PASSWORD=tvoja-lozinka-ovde
```
**To je tvoja email lozinka!**

---

## 🔍 Metoda 3: Proveri Default Vrednost

Ako `MAIL_PASSWORD` nije setovan, koristi se default vrednost iz `application.properties`:

```
kr4vAzivazdrava
```

**Proveri da li se koristi default:**

```bash
# SSH na dev server
ssh root@164.90.231.47
cd /opt/biozenapp-dev

# Proveri da li MAIL_PASSWORD postoji u .env
cat .env | grep MAIL_PASSWORD

# Ako ne postoji, proveri da li backend koristi default
docker compose -f docker-compose.dev.yml logs backend-dev | grep -i "mail\|email" | head -20
```

---

## 🔍 Metoda 4: Proveri Ceo .env Fajl

```bash
# SSH na dev server
ssh root@164.90.231.47
cd /opt/biozenapp-dev

# Proveri ceo .env fajl
cat .env
```

**Traži liniju koja počinje sa `MAIL_PASSWORD=`**

---

## 🔍 Metoda 5: Proveri Backend Logove

```bash
# SSH na dev server
ssh root@164.90.231.47
cd /opt/biozenapp-dev

# Proveri logove za email greške (možda vidiš lozinku u greškama)
docker compose -f docker-compose.dev.yml logs backend-dev | grep -i "password\|auth" | tail -20
```

---

## 🎯 Sve Odjednom (Copy-Paste)

```bash
ssh root@164.90.231.47 && \
cd /opt/biozenapp-dev && \
echo "=== PROVERA .env FAJLA ===" && \
cat .env 2>/dev/null | grep MAIL_PASSWORD || echo "MAIL_PASSWORD nije u .env" && \
echo "" && \
echo "=== PROVERA ENVIRONMENT VARIABLES ===" && \
docker compose -f docker-compose.dev.yml exec backend-dev env 2>/dev/null | grep MAIL || echo "MAIL_PASSWORD nije setovan u container-u" && \
echo "" && \
echo "=== DEFAULT VREDNOST ===" && \
echo "Ako nije setovan, koristi se: kr4vAzivazdrava"
```

---

## 📝 Ako Ne Možeš da Nađeš Lozinku

Ako ne možeš da nađeš lozinku na dev serveru, imaš nekoliko opcija:

### Opcija 1: Koristi Default Vrednost

Ako na dev serveru nije setovan `MAIL_PASSWORD`, koristi se default: `kr4vAzivazdrava`

Dodaj u production `.env`:
```
MAIL_PASSWORD=kr4vAzivazdrava
```

### Opcija 2: Resetuj Email Lozinku

Ako ne znaš lozinku, možeš da je resetuješ u email hosting panelu (gde god je `no-reply@biozen.rs` hostovan).

### Opcija 3: Proveri Email Hosting Panel

Ako koristiš neki email hosting servis (npr. cPanel, Plesk, itd.), možeš da proveriš lozinku tamo.

---

## ✅ Finalna Provera

Nakon što nađeš lozinku, proveri da li radi na dev:

```bash
# Testiraj slanje email-a (npr. forgot password)
# Otvori aplikaciju na dev.biozen.rs
# Klikni "Zaboravili ste lozinku?"
# Unesi email
# Proveri da li je email stigao
```

---

## 🔐 Sigurnost

**VAŽNO:** 
- Ne deli email lozinku javno
- Ne commit-uj `.env` fajl u git (trebalo bi da je u `.gitignore`)
- Koristi različite lozinke za dev i production (preporučeno)

