# Quick Start - Digital Ocean Deployment

## Brzi vodič za deployment

### 1. Digital Ocean App Platform (Najlakše)

1. **Kreiraj Digital Ocean nalog** na https://www.digitalocean.com

2. **Kreiraj App Platform aplikaciju:**
   - Idi na Dashboard → Apps → Create App
   - Izaberi "GitHub" kao izvor
   - Poveži repozitorijum: `4beesdev/biozenapp`
   - Digital Ocean će automatski detektovati `.do/app.yaml`

3. **Dodaj Environment Variables:**
   - `APP_JWT_SECRET` - generiši siguran secret (min 32 karaktera)
     ```bash
     # Možeš generisati sa:
     openssl rand -base64 32
     ```

4. **Deploy:**
   - Digital Ocean će automatski build-ovati i deploy-ovati aplikaciju
   - Baza će biti automatski kreirana

### 2. Docker Compose na Droplet (Više kontrole)

```bash
# 1. Kreiraj Droplet na Digital Ocean (Ubuntu 22.04, min 2GB RAM)

# 2. SSH na server
ssh root@your-droplet-ip

# 3. Instaliraj Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt-get install docker-compose-plugin -y

# 4. Kloniraj repozitorijum
git clone https://github.com/4beesdev/biozenapp.git
cd biozenapp

# 5. Kreiraj .env fajl
cat > .env << EOF
POSTGRES_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
EOF

# 6. Pokreni aplikaciju
docker compose up -d

# 7. Proveri status
docker compose ps
```

### 3. Lokalno testiranje Docker-a

```bash
# Kloniraj repozitorijum
git clone https://github.com/4beesdev/biozenapp.git
cd biozenapp

# Kreiraj .env fajl
cp .env.example .env
# Uredi .env i dodaj svoje vrednosti

# Pokreni
docker compose up -d

# Aplikacija će biti dostupna na:
# Frontend: http://localhost
# Backend: http://localhost:8080
```

## Provera da li radi

- **Frontend**: Otvori http://your-domain u browseru
- **Backend API**: `curl http://your-domain/api/me` (trebalo bi da zahteva autentifikaciju)

## Troubleshooting

### Logovi
```bash
# Docker Compose logovi
docker compose logs -f

# Backend logovi
docker compose logs -f backend

# Frontend logovi
docker compose logs -f frontend

# Database logovi
docker compose logs -f postgres
```

### Restart servisa
```bash
docker compose restart backend
docker compose restart frontend
```

### Brisanje i ponovno kreiranje
```bash
docker compose down -v  # -v briše i volume-ove (bazu)
docker compose up -d --build
```

