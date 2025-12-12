# ✅ Provera Cloudflare Setup-a

## Server IP Adresa

**Javna IP adresa servera:** `164.90.231.47`

---

## Korak 1: Proveri da Li Server Odgovara Direktno

```bash
# Test direktno sa IP adresom (bez Cloudflare)
curl -v http://164.90.231.47

# Trebalo bi da vidiš HTML (login stranica)
```

**Ako ovo radi, server je u redu, problem je u Cloudflare konfiguraciji.**

---

## Korak 2: Proveri Cloudflare DNS Settings

### 2.1. Otvori Cloudflare Dashboard

1. Idi na: https://dash.cloudflare.com
2. Izaberi domen `biozen.rs` ili `app.biozen.rs`
3. Idi na **DNS** u levom meniju

### 2.2. Proveri A Record

Treba da postoji A record:
- **Name**: `app` ili `app.biozen.rs`
- **IPv4 address**: `164.90.231.47` ← **OVO TREBA DA BUDE TAČNO!**
- **Proxy status**: **"Proxied"** (orange cloud) ← **OVO TREBA DA BUDE PROXIED!**

**Ako IP adresa nije tačna, promeni je na `164.90.231.47`.**

---

## Korak 3: Proveri Cloudflare SSL/TLS Mode

### 3.1. Otvori SSL/TLS Settings

1. Idi na **SSL/TLS** u Cloudflare Dashboard-u
2. Proveri **SSL/TLS encryption mode**

### 3.2. Postavi na "Flexible"

**Trenutno stanje:**
- Ako je **"Flexible"** → ✅ OK (Cloudflare koristi HTTP za komunikaciju sa origin serverom)
- Ako je **"Full"** → ❌ Problem (Cloudflare pokušava HTTPS, ali server nema SSL)
- Ako je **"Full (strict)"** → ❌ Problem (Cloudflare zahteva validan SSL sertifikat)

**Rešenje:**
- Postavi na **"Flexible"** (najlakše rešenje)

---

## Korak 4: Proveri Firewall na Serveru

```bash
# SSH na production server
ssh root@164.90.231.47
cd /opt/biozenapp

# Proveri firewall status
sudo ufw status

# Ako je firewall aktivan, dozvoli port 80
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Proveri da li frontend radi
docker compose -f docker-compose.production.yml ps frontend
```

---

## Korak 5: Test Direktno (Bez Cloudflare)

### 5.1. Test sa IP Adresom

Otvori u browseru: `http://164.90.231.47`

**Očekivano:** Trebalo bi da vidiš login stranicu.

### 5.2. Test sa Domenom (Kroz Cloudflare)

Otvori u browseru: `http://app.biozen.rs` ili `https://app.biozen.rs`

**Očekivano:** Trebalo bi da vidiš login stranicu (nakon što popraviš Cloudflare settings).

---

## 🎯 Sve Odjednom - Copy-Paste

```bash
# SSH na production server
ssh root@164.90.231.47
cd /opt/biozenapp

# 1. Proveri da li frontend radi
echo "=== FRONTEND STATUS ===" && \
docker compose -f docker-compose.production.yml ps frontend

# 2. Test lokalno
echo "" && \
echo "=== LOCAL TEST ===" && \
curl -s http://localhost:80 | head -10

# 3. Test sa javnom IP
echo "" && \
echo "=== PUBLIC IP TEST ===" && \
curl -s http://164.90.231.47 | head -10

# 4. Proveri firewall
echo "" && \
echo "=== FIREWALL STATUS ===" && \
sudo ufw status

# 5. Proveri port 80
echo "" && \
echo "=== PORT 80 CHECK ===" && \
sudo lsof -i :80 || sudo netstat -tulpn | grep :80
```

---

## ✅ Checklist

- [ ] Server odgovara na `http://164.90.231.47` direktno (bez Cloudflare)
- [ ] Cloudflare DNS A record za `app.biozen.rs` pokazuje na `164.90.231.47`
- [ ] Proxy status je **"Proxied"** (orange cloud)
- [ ] SSL/TLS mode je postavljen na **"Flexible"**
- [ ] Firewall na serveru dozvoljava port 80
- [ ] Frontend container radi (`docker compose ps frontend`)

---

## 🐛 Troubleshooting

### Problem: "Server ne odgovara na `http://164.90.231.47`"

```bash
# Proveri da li frontend container radi
docker compose -f docker-compose.production.yml ps frontend

# Ako ne radi, restart
docker compose -f docker-compose.production.yml restart frontend

# Proveri logove
docker compose -f docker-compose.production.yml logs frontend | tail -20
```

### Problem: "Cloudflare i dalje pokazuje Error 521"

1. Proveri da li je DNS A record tačan (`164.90.231.47`)
2. Proveri da li je Proxy status "Proxied"
3. Proveri da li je SSL/TLS mode "Flexible"
4. Sačekaj 5-10 minuta (DNS propagacija)
5. Pokušaj da "Pause Cloudflare on Site" i testiraj direktno

### Problem: "Firewall blokira zahteve"

```bash
# Dozvoli port 80
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Proveri status
sudo ufw status
```

---

## 📝 Napomene

1. **Javna IP adresa**: `164.90.231.47` - ovo je IP adresa tvog Droplet-a
2. **Cloudflare DNS**: Treba da pokazuje na `164.90.231.47`
3. **SSL/TLS Mode**: Treba da bude "Flexible" (najlakše rešenje)
4. **Proxy Status**: Treba da bude "Proxied" (orange cloud)

---

## 🎉 Gotovo!

Nakon što:
1. Postaviš DNS A record na `164.90.231.47`
2. Postaviš SSL/TLS mode na "Flexible"
3. Sačekaš 2-3 minuta

Trebalo bi da radi! 🚀

