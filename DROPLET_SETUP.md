# Setup na Digital Ocean Droplet - Kompletan Vodič

## ✅ Prednosti Droplet-a

- ✅ **Potpuna kontrola** - root pristup, možeš sve da konfigurišeš
- ✅ **Jeftinije** - $6/mesec za osnovni droplet
- ✅ **Jednostavnije** - direktno environment variables, bez problema sa placeholder-ima
- ✅ **Fleksibilnost** - možeš koristiti bilo koji setup

## 📋 Korak 1: Kreiraj Droplet

1. **Digital Ocean Dashboard** → **Create** → **Droplets**
2. **Izaberi:**
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: Basic ($6/mesec, 1GB RAM, 1 vCPU)
   - **Region**: Najbliža tebi (npr. Frankfurt)
   - **Authentication**: SSH keys (preporučeno) ili Password
3. **Create Droplet**

## 📋 Korak 2: Setup Droplet-a

### 2.1 Poveži se na Droplet

```bash
ssh root@Tvoja_IP_Adresa
```

### 2.2 Instaliraj Docker i Docker Compose

```bash
# Update sistema
apt update && apt upgrade -y

# Instaliraj Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instaliraj Docker Compose
apt install docker-compose-plugin -y

# Proveri instalaciju
docker --version
docker compose version
```

### 2.3 Instaliraj Git

```bash
apt install git -y
```

## 📋 Korak 3: Kloniraj Repozitorijum

```bash
# Kreiraj direktorijum
mkdir -p /opt/biozenapp
cd /opt/biozenapp

# Kloniraj repo (koristi svoj token)
git clone https://github.com/4beesdev/biozenapp.git .

# Ili upload-uj fajlove preko SCP/SFTP
```

## 📋 Korak 4: Setup Environment Variables

### 4.1 Kreiraj .env fajl

```bash
cd /opt/biozenapp
nano .env
```

### 4.2 Dodaj sledeće (koristi svoje vrednosti):

```env
# Database (ako koristiš managed database)
SPRING_DATASOURCE_URL=jdbc:postgresql://host:port/database?sslmode=require
SPRING_DATASOURCE_USERNAME=username
SPRING_DATASOURCE_PASSWORD=password

# JWT Secret
JWT_SECRET=generisi_sa_openssl_rand_base64_32

# Ako koristiš lokalnu bazu (Docker Compose)
POSTGRES_PASSWORD=tvoj_bezbedan_password
```

### 4.3 Generiši JWT Secret

```bash
openssl rand -base64 32
```

Kopiraj rezultat u `.env` fajl kao `JWT_SECRET`.

## 📋 Korak 5: Prilagodi docker-compose.yml

Ako koristiš **managed database** (preporučeno), izmeni `docker-compose.yml`:

```yaml
services:
  backend:
    environment:
      SPRING_DATASOURCE_URL: ${SPRING_DATASOURCE_URL}
      SPRING_DATASOURCE_USERNAME: ${SPRING_DATASOURCE_USERNAME}
      SPRING_DATASOURCE_PASSWORD: ${SPRING_DATASOURCE_PASSWORD}
      APP_JWT_SECRET: ${JWT_SECRET}
      APP_JWT_TTLMILLIS: 604800000
    # Ukloni depends_on: postgres ako ne koristiš lokalnu bazu
```

Ako koristiš **lokalnu bazu** (Docker Compose), ostavi kako jeste.

## 📋 Korak 6: Pokreni Aplikaciju

```bash
cd /opt/biozenapp

# Build i pokreni
docker compose up -d

# Proveri status
docker compose ps

# Proveri logove
docker compose logs -f backend
docker compose logs -f frontend
```

## 📋 Korak 7: Setup Nginx (Reverse Proxy)

### 7.1 Instaliraj Nginx

```bash
apt install nginx -y
```

### 7.2 Konfiguriši Nginx

```bash
nano /etc/nginx/sites-available/biozenapp
```

Dodaj sledeću konfiguraciju:

```nginx
server {
    listen 80;
    server_name tvoja_domena.com;  # Ili IP adresa

    # Frontend
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 7.3 Aktiviraj konfiguraciju

```bash
ln -s /etc/nginx/sites-available/biozenapp /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default  # Ukloni default
nginx -t  # Proveri konfiguraciju
systemctl reload nginx
```

## 📋 Korak 8: Setup SSL (Let's Encrypt)

### 8.1 Instaliraj Certbot

```bash
apt install certbot python3-certbot-nginx -y
```

### 8.2 Generiši SSL sertifikat

```bash
certbot --nginx -d tvoja_domena.com
```

Certbot će automatski:
- Generisati SSL sertifikat
- Konfigurisati Nginx za HTTPS
- Setup automatski renewal

## 📋 Korak 9: Firewall

```bash
# Dozvoli SSH, HTTP, HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

## 📋 Korak 10: Auto-restart (Systemd Service)

Kreiraj systemd service za automatski restart:

```bash
nano /etc/systemd/system/biozenapp.service
```

Dodaj:

```ini
[Unit]
Description=BioZen App Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/biozenapp
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Aktiviraj:

```bash
systemctl daemon-reload
systemctl enable biozenapp
systemctl start biozenapp
```

## 🔄 Deploy Novih Promena

```bash
cd /opt/biozenapp
git pull
docker compose build
docker compose up -d
```

## 📊 Monitoring

```bash
# Status
docker compose ps

# Logovi
docker compose logs -f

# Resursi
docker stats
```

## 🎯 Prednosti ovog pristupa

- ✅ **Jednostavno** - direktno environment variables
- ✅ **Kontrola** - možeš sve da vidiš i promeniš
- ✅ **Jeftinije** - $6/mesec
- ✅ **Fleksibilnost** - možeš dodati bilo šta

## ⚠️ Napomene

- **Backup baze**: Ako koristiš lokalnu bazu, setup backup skriptu
- **Monitoring**: Razmotri dodavanje monitoring alata (npr. Uptime Robot)
- **Updates**: Redovno update-uj sistem (`apt update && apt upgrade`)

