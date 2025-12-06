# Deployment na Digital Ocean

## Opcija 1: Digital Ocean App Platform (Preporučeno)

### Korak 1: Priprema

1. Kreiraj Digital Ocean nalog na https://www.digitalocean.com
2. Instaliraj Digital Ocean CLI:
   ```bash
   brew install doctl
   doctl auth init
   ```

### Korak 2: Kreiranje App Platform aplikacije

1. Idi na Digital Ocean Dashboard → Apps → Create App
2. Poveži GitHub repozitorijum: `4beesdev/biozenapp`
3. Digital Ocean će automatski detektovati `.do/app.yaml` fajl
4. Dodaj environment variables:
   - `APP_JWT_SECRET` - generiši siguran secret (min 32 karaktera)
   - `POSTGRES_PASSWORD` - lozinka za bazu (ako koristiš custom)

### Korak 3: Deployment

Digital Ocean će automatski:
- Build-ovati Docker image-e
- Deploy-ovati aplikaciju
- Kreirati PostgreSQL bazu
- Povezati sve servise

## Opcija 2: Docker Compose na Droplet

### Korak 1: Kreiranje Droplet-a

1. Kreiraj novi Droplet na Digital Ocean
2. Izaberi Ubuntu 22.04
3. Izaberi plan (najmanje 2GB RAM)
4. Dodaj SSH key

### Korak 2: Setup na serveru

```bash
# SSH na server
ssh root@your-droplet-ip

# Instaliraj Docker i Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt-get install docker-compose-plugin -y

# Kloniraj repozitorijum
git clone https://github.com/4beesdev/biozenapp.git
cd biozenapp

# Kreiraj .env fajl
cat > .env << EOF
POSTGRES_PASSWORD=your-secure-password-here
JWT_SECRET=your-jwt-secret-min-32-chars
EOF

# Pokreni aplikaciju
docker compose up -d
```

### Korak 3: Nginx reverse proxy (opciono)

Ako želiš da koristiš domen, možeš dodati Nginx reverse proxy:

```bash
apt-get install nginx -y

# Konfiguriši Nginx
# (dodaj konfiguraciju za tvoj domen)
```

## Environment Variables

### Backend
- `SPRING_DATASOURCE_URL` - PostgreSQL connection string
- `SPRING_DATASOURCE_USERNAME` - Database username
- `SPRING_DATASOURCE_PASSWORD` - Database password
- `APP_JWT_SECRET` - JWT secret key (min 32 karaktera)
- `APP_JWT_TTLMILLIS` - JWT token TTL (default: 604800000 = 7 dana)

### Frontend
- `REACT_APP_API_URL` - Backend API URL (opciono, koristi proxy ako nije setovano)

## GitHub Secrets (za GitHub Actions)

Ako koristiš GitHub Actions za deployment, dodaj ove secrets u GitHub repozitorijum:

1. `DO_ACCESS_TOKEN` - Digital Ocean API token
2. `DO_REGISTRY_TOKEN` - Digital Ocean Container Registry token
3. `DO_REGISTRY_NAME` - Ime Container Registry-a

## Provera deployment-a

Nakon deployment-a, proveri:
- Backend: `http://your-domain/api/me` (trebalo bi da vraća JSON)
- Frontend: `http://your-domain` (trebalo bi da prikaže login stranicu)

## Troubleshooting

### Backend ne može da se poveže sa bazom
- Proveri da li je PostgreSQL servis pokrenut
- Proveri connection string u environment variables
- Proveri firewall settings

### Frontend ne može da pozove API
- Proveri nginx.conf proxy konfiguraciju
- Proveri da li backend radi na portu 8080
- Proveri CORS konfiguraciju

### Docker build greške
- Proveri da li su svi fajlovi commit-ovani
- Proveri .dockerignore fajlove
- Proveri Dockerfile sintaksu

