# 🚀 Kako da Pokreneš Aplikaciju na Digital Ocean Droplet

## Korak 1: Kreiraj Droplet (5 minuta)

### 1.1 Otvori Digital Ocean Dashboard
- Idi na: https://cloud.digitalocean.com
- Uloguj se

### 1.2 Kreiraj Novi Droplet
1. Klikni **"Create"** (gornji desni ugao) → **"Droplets"**
2. **Izaberi opcije:**
   - **Image**: Ubuntu 22.04 (LTS) x64
   - **Plan**: 
     - **Basic** → **Regular** → **$6/mesec** (1GB RAM, 1 vCPU, 25GB SSD)
   - **Region**: Izaberi najbližu tebi (npr. Frankfurt, Amsterdam)
   - **Authentication**: 
     - **SSH keys** (preporučeno - ako imaš) ILI
     - **Password** (generiši jak password)
3. **Droplet hostname**: `biozen-app` (ili bilo šta)
4. Klikni **"Create Droplet"**

### 1.3 Sačekaj da se Droplet pokrene
- Status će biti "New" → "Active" (1-2 minuta)
- Kopiraj **IP adresu** (npr. `157.230.123.45`)

## Korak 2: Poveži se na Droplet (2 minuta)

### 2.1 Otvori Terminal na svom računaru

**Mac/Linux:**
```bash
ssh root@Tvoja_IP_Adresa
```

**Windows:**
- Koristi **PuTTY** ili **Windows Terminal**
- Host: `Tvoja_IP_Adresa`
- Port: `22`
- Username: `root`
- Password: (password koji si setovao)

### 2.2 Prvi put kada se povežeš
- Ako te pita da potvrdiš fingerprint, ukucaj `yes`
- Ako si koristio password, unesi ga

## Korak 3: Setup Droplet-a (10 minuta)

### 3.1 Pokreni Setup Skriptu

**Opcija A: Direktno sa GitHub-a (najlakše)**
```bash
cd /opt
git clone https://github.com/4beesdev/biozenapp.git biozenapp
cd biozenapp
bash setup-droplet.sh
```

**Opcija B: Ručno (ako git ne radi)**
```bash
# 1. Update sistema
apt update && apt upgrade -y

# 2. Instaliraj Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# 3. Instaliraj Docker Compose
apt install docker-compose-plugin -y

# 4. Instaliraj Git
apt install git -y

# 5. Instaliraj Nginx
apt install nginx -y

# 6. Kloniraj repo
cd /opt
git clone https://github.com/4beesdev/biozenapp.git biozenapp
cd biozenapp
```

### 3.2 Setup će automatski:
- ✅ Instalirati Docker i Docker Compose
- ✅ Instalirati Nginx
- ✅ Konfigurisati firewall
- ✅ Kreirati systemd service
- ✅ Kreirati `.env` fajl template

## Korak 4: Konfiguriši Environment Variables (5 minuta)

### 4.1 Otvori .env fajl
```bash
nano /opt/biozenapp/.env
```

### 4.2 Dodaj svoje vrednosti

**Za Managed Database (preporučeno):**
```env
# Database Connection
SPRING_DATASOURCE_URL=jdbc:postgresql://app-dd78834a-f1da-4757-9a71-793e8b2ab270-do-user-4315104-0.g.db.ondigitalocean.com:25060/defaultdb?sslmode=require
SPRING_DATASOURCE_USERNAME=db
SPRING_DATASOURCE_PASSWORD=AVNS_leKihZpiozTScIlVqkT

# JWT Secret (generiši novi)
JWT_SECRET=generisi_sa_openssl_rand_base64_32

# Frontend API URL
REACT_APP_API_URL=http://Tvoja_IP_Adresa:8080
```

**Za generisanje JWT Secret:**
```bash
openssl rand -base64 32
```
Kopiraj rezultat i stavi ga kao `JWT_SECRET` u `.env` fajl.

### 4.3 Sačuvaj fajl
- Pritisni `Ctrl + X`
- Pritisni `Y` (yes)
- Pritisni `Enter`

## Korak 5: Pokreni Aplikaciju (2 minuta)

### 5.1 Build i pokreni
```bash
cd /opt/biozenapp
docker compose -f docker-compose.production.yml up -d
```

### 5.2 Proveri status
```bash
docker compose -f docker-compose.production.yml ps
```

Trebalo bi da vidiš:
```
NAME                STATUS
biozen-backend      Up
biozen-frontend     Up
```

### 5.3 Proveri logove
```bash
# Backend logovi
docker compose -f docker-compose.production.yml logs -f backend

# Frontend logovi
docker compose -f docker-compose.production.yml logs -f frontend
```

**Ako vidiš greške:**
- Proveri `.env` fajl - da li su sve vrednosti ispravne
- Proveri da li je database dostupna
- Proveri da li je JWT_SECRET setovan

## Korak 6: Testiraj Aplikaciju (1 minuta)

### 6.1 Otvori u browseru
```
http://Tvoja_IP_Adresa
```

### 6.2 Trebalo bi da vidiš:
- ✅ Login stranicu
- ✅ BioZen logo
- ✅ Formu za login/register

### 6.3 Testiraj funkcionalnost
- Registruj novog korisnika
- Uloguj se
- Proveri da li radi dashboard

## Korak 7: Setup SSL (Opcionalno, 5 minuta)

### 7.1 Ako imaš domenu
```bash
# Instaliraj Certbot
apt install certbot python3-certbot-nginx -y

# Generiši SSL sertifikat
certbot --nginx -d tvoja_domena.com
```

### 7.2 Ako nemaš domenu
- Možeš koristiti IP adresu (ali bez SSL)
- Ili kupi domenu (npr. na Namecheap, GoDaddy)

## 🔄 Deploy Novih Promena

Kada push-uješ nove promene na GitHub:

```bash
cd /opt/biozenapp
git pull
docker compose -f docker-compose.production.yml build
docker compose -f docker-compose.production.yml up -d
```

## 📊 Monitoring

### Proveri status
```bash
docker compose -f docker-compose.production.yml ps
```

### Proveri logove
```bash
docker compose -f docker-compose.production.yml logs -f
```

### Proveri resurse
```bash
docker stats
```

### Restart aplikacije
```bash
docker compose -f docker-compose.production.yml restart
```

### Stop aplikacije
```bash
docker compose -f docker-compose.production.yml down
```

### Start aplikacije
```bash
docker compose -f docker-compose.production.yml up -d
```

## ⚠️ Česti Problemi

### Problem: "Cannot connect to database"
**Rešenje:**
- Proveri da li su database credentials ispravni u `.env` fajlu
- Proveri da li je database dostupna (možeš testirati sa `psql`)

### Problem: "Backend ne startuje"
**Rešenje:**
```bash
# Proveri logove
docker compose -f docker-compose.production.yml logs backend

# Proveri da li je JWT_SECRET setovan
cat /opt/biozenapp/.env | grep JWT_SECRET
```

### Problem: "Frontend ne prikazuje"
**Rešenje:**
- Proveri da li frontend container radi: `docker compose ps`
- Proveri Nginx: `systemctl status nginx`
- Proveri firewall: `ufw status`

## ✅ Gotovo!

Aplikacija bi sada trebalo da radi na: `http://Tvoja_IP_Adresa`

## 📝 Napomene

- **Backup**: Razmotri setup backup-a za bazu podataka
- **Monitoring**: Razmotri dodavanje monitoring alata
- **Updates**: Redovno update-uj sistem (`apt update && apt upgrade`)

