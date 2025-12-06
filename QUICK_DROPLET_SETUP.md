# 🚀 Brzi Setup na Droplet - 5 Minuta

## Korak 1: Kreiraj Droplet

1. Digital Ocean → Create → Droplets
2. Ubuntu 22.04, Basic $6/mesec
3. Create

## Korak 2: Poveži se i pokreni setup skriptu

```bash
ssh root@Tvoja_IP_Adresa
bash <(curl -s https://raw.githubusercontent.com/4beesdev/biozenapp/main/setup-droplet.sh)
```

**ILI** ručno:

```bash
ssh root@Tvoja_IP_Adresa
cd /opt
git clone https://github.com/4beesdev/biozenapp.git biozenapp
cd biozenapp
bash setup-droplet.sh
```

## Korak 3: Izmeni .env fajl

```bash
nano /opt/biozenapp/.env
```

Dodaj svoje vrednosti:

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://app-dd78834a-f1da-4757-9a71-793e8b2ab270-do-user-4315104-0.g.db.ondigitalocean.com:25060/defaultdb?sslmode=require
SPRING_DATASOURCE_USERNAME=db
SPRING_DATASOURCE_PASSWORD=AVNS_leKihZpiozTScIlVqkT
JWT_SECRET=$(openssl rand -base64 32)
REACT_APP_API_URL=http://Tvoja_IP_Adresa:8080
```

## Korak 4: Pokreni aplikaciju

```bash
cd /opt/biozenapp
docker compose -f docker-compose.production.yml up -d
```

## Korak 5: Proveri

```bash
# Status
docker compose -f docker-compose.production.yml ps

# Logovi
docker compose -f docker-compose.production.yml logs -f backend
```

## ✅ Gotovo!

Aplikacija je dostupna na: `http://Tvoja_IP_Adresa`

## 🔒 SSL (Opcionalno)

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d tvoja_domena.com
```

## 🔄 Deploy novih promena

```bash
cd /opt/biozenapp
git pull
docker compose -f docker-compose.production.yml build
docker compose -f docker-compose.production.yml up -d
```

