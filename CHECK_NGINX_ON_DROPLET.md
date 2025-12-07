# Provera Nginx na Droplet-u

## Korak 1: Proveri da li sistem Nginx radi

```bash
systemctl status nginx
```

## Korak 2: Ako Nginx radi, zaustavi ga

```bash
systemctl stop nginx
systemctl disable nginx
```

## Korak 3: Proveri da li nešto koristi port 80

```bash
ss -tlnp | grep :80
```

Ili:
```bash
lsof -i :80
```

## Korak 4: Proveri Docker container-e

```bash
docker ps | grep frontend
```

Trebalo bi da vidiš `biozen-frontend` container.

## Korak 5: Proveri frontend nginx.conf unutar containera

```bash
docker compose exec frontend cat /etc/nginx/conf.d/default.conf
```

## Korak 6: Testiraj frontend direktno

```bash
curl http://localhost
```

Trebalo bi da dobiješ HTML.

## Korak 7: Testiraj API kroz frontend

```bash
curl http://localhost/api/actuator/health
```

Trebalo bi da dobiješ backend response.

## Sve odjednom:

```bash
systemctl stop nginx
systemctl disable nginx
ss -tlnp | grep :80
docker ps | grep frontend
docker compose exec frontend cat /etc/nginx/conf.d/default.conf
```

