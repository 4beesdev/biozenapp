#!/bin/bash

# Setup skripta za Digital Ocean Droplet
# Koristi: bash setup-droplet.sh

set -e

echo "🚀 BioZen App - Droplet Setup"
echo "=============================="
echo ""

# Proveri da li je root
if [ "$EUID" -ne 0 ]; then 
  echo "❌ Molim te pokreni kao root (sudo bash setup-droplet.sh)"
  exit 1
fi

# 1. Update sistema
echo "📦 Update sistema..."
apt update && apt upgrade -y

# 2. Instaliraj Docker
echo "🐳 Instaliranje Docker-a..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
else
    echo "   Docker već instaliran"
fi

# 3. Instaliraj Docker Compose
echo "🔧 Instaliranje Docker Compose..."
if ! command -v docker compose &> /dev/null; then
    apt install docker-compose-plugin -y
else
    echo "   Docker Compose već instaliran"
fi

# 4. Instaliraj Git
echo "📥 Instaliranje Git-a..."
if ! command -v git &> /dev/null; then
    apt install git -y
else
    echo "   Git već instaliran"
fi

# 5. Instaliraj Nginx
echo "🌐 Instaliranje Nginx-a..."
if ! command -v nginx &> /dev/null; then
    apt install nginx -y
else
    echo "   Nginx već instaliran"
fi

# 6. Kreiraj direktorijum
echo "📁 Kreiranje direktorijuma..."
mkdir -p /opt/biozenapp
cd /opt/biozenapp

# 7. Proveri da li repo već postoji
if [ -d ".git" ]; then
    echo "📥 Pull najnovijih promena..."
    git pull
else
    echo "📥 Kloniranje repozitorijuma..."
    echo "   ⚠️  Molim te ručno kloniraj repo:"
    echo "   cd /opt/biozenapp"
    echo "   git clone https://github.com/4beesdev/biozenapp.git ."
fi

# 8. Proveri .env fajl
if [ ! -f ".env" ]; then
    echo "📝 Kreiranje .env fajla..."
    cat > .env << 'EOF'
# Database Connection (Managed Database)
SPRING_DATASOURCE_URL=jdbc:postgresql://host:port/database?sslmode=require
SPRING_DATASOURCE_USERNAME=username
SPRING_DATASOURCE_PASSWORD=password

# JWT Secret (generiši sa: openssl rand -base64 32)
JWT_SECRET=change-this-secret-key-minimum-32-characters-long

# Frontend API URL
REACT_APP_API_URL=http://localhost:8080
EOF
    echo "   ✅ .env fajl kreiran - MOLIM TE IZMENI GA SA PRAVIM VREDNOSTIMA!"
    echo "   nano /opt/biozenapp/.env"
else
    echo "   ✅ .env fajl već postoji"
fi

# 9. Setup Nginx
echo "🌐 Konfigurisanje Nginx-a..."
cat > /etc/nginx/sites-available/biozenapp << 'EOF'
server {
    listen 80;
    server_name _;  # Zameni sa tvojom domenom

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
EOF

# Aktiviraj Nginx konfiguraciju
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    rm /etc/nginx/sites-enabled/default
fi
ln -sf /etc/nginx/sites-available/biozenapp /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# 10. Setup Firewall
echo "🔥 Konfigurisanje Firewall-a..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# 11. Setup Systemd Service
echo "⚙️  Kreiranje Systemd servisa..."
cat > /etc/systemd/system/biozenapp.service << 'EOF'
[Unit]
Description=BioZen App Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/biozenapp
ExecStart=/usr/bin/docker compose -f docker-compose.production.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.production.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable biozenapp

echo ""
echo "✅ Setup završen!"
echo ""
echo "📋 Sledeći koraci:"
echo "1. Izmeni .env fajl sa pravim vrednostima:"
echo "   nano /opt/biozenapp/.env"
echo ""
echo "2. Pokreni aplikaciju:"
echo "   cd /opt/biozenapp"
echo "   docker compose -f docker-compose.production.yml up -d"
echo ""
echo "3. Proveri status:"
echo "   docker compose -f docker-compose.production.yml ps"
echo ""
echo "4. Proveri logove:"
echo "   docker compose -f docker-compose.production.yml logs -f"
echo ""
echo "5. Za SSL sertifikat (Let's Encrypt):"
echo "   apt install certbot python3-certbot-nginx -y"
echo "   certbot --nginx -d tvoja_domena.com"
echo ""

