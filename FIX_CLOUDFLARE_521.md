# 🔧 Rešavanje Cloudflare Error 521

## Status

✅ **Frontend container radi** - Nginx je pokrenut i odgovara sa statusom 200
✅ **Backend verovatno radi** - treba proveriti

❌ **Problem je u Cloudflare konfiguraciji** - Cloudflare ne može da se poveže sa origin serverom

---

## Rešenje 1: Proveri Cloudflare SSL/TLS Mode

### Korak 1: Otvori Cloudflare Dashboard

1. Idi na: https://dash.cloudflare.com
2. Izaberi domen `biozen.rs` ili `app.biozen.rs`
3. Idi na **SSL/TLS** u levom meniju

### Korak 2: Proveri SSL/TLS Mode

**Trenutno stanje:**
- Ako je **"Flexible"** → Cloudflare koristi HTTP za komunikaciju sa origin serverom
- Ako je **"Full"** → Cloudflare koristi HTTPS za komunikaciju sa origin serverom
- Ako je **"Full (strict)"** → Cloudflare zahteva validan SSL sertifikat na origin serveru

**Rešenje:**
- Postavi na **"Flexible"** (najlakše rešenje - ne zahteva SSL na origin serveru)
- ILI postavi na **"Full"** (ako imaš SSL sertifikat na origin serveru)

---

## Rešenje 2: Proveri DNS Settings

### Korak 1: Proveri DNS Records

1. Idi na **DNS** u Cloudflare Dashboard-u
2. Proveri A record za `app.biozen.rs`:
   - **Name**: `app` ili `app.biozen.rs`
   - **IPv4 address**: Treba da bude IP adresa tvog Droplet-a
   - **Proxy status**: Treba da bude **"Proxied"** (orange cloud)

### Korak 2: Proveri da Li Je IP Tačan

```bash
# SSH na production server
ssh root@your-production-ip

# Proveri IP adresu servera
hostname -I
# ILI
ip addr show | grep "inet " | grep -v 127.0.0.1
```

**Proveri da li se IP poklapa sa IP-om u Cloudflare DNS record-u.**

---

## Rešenje 3: Proveri Origin Server IP

Cloudflare mora da može da pristupi origin serveru na portu 80 (ili 443 ako koristiš HTTPS).

```bash
# SSH na production server
ssh root@your-production-ip

# Proveri da li frontend sluša na portu 80
sudo lsof -i :80
# ILI
sudo netstat -tulpn | grep :80

# Test lokalno
curl -v http://localhost:80
```

---

## Rešenje 4: Proveri Firewall

```bash
# SSH na production server
ssh root@your-production-ip

# Proveri firewall status
sudo ufw status

# Ako je firewall aktivan, dozvoli port 80
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Proveri iptables
sudo iptables -L -n | grep 80
```

---

## Rešenje 5: Test Bez Cloudflare (Direktno)

Testiraj da li server radi direktno (bez Cloudflare):

```bash
# Na serveru, proveri IP adresu
hostname -I

# Otvori u browseru direktno sa IP adresom:
# http://your-server-ip
```

**Ako radi direktno sa IP adresom, problem je definitivno u Cloudflare konfiguraciji.**

---

## Rešenje 6: Proveri Cloudflare Origin Certificates

Ako koristiš "Full" ili "Full (strict)" SSL mode:

1. Idi na **SSL/TLS** → **Origin Server**
2. Proveri da li imaš Origin Certificate instaliran na serveru
3. Ako nemaš, možeš:
   - Postaviti SSL/TLS mode na **"Flexible"** (najlakše)
   - ILI kreirati Origin Certificate u Cloudflare i instalirati ga na serveru

---

## 🎯 Sve Odjednom - Copy-Paste

```bash
# SSH na production server
ssh root@your-production-ip

# 1. Proveri IP adresu
echo "=== SERVER IP ===" && \
hostname -I

# 2. Proveri port 80
echo "" && \
echo "=== PORT 80 CHECK ===" && \
sudo lsof -i :80 || sudo netstat -tulpn | grep :80

# 3. Test lokalno
echo "" && \
echo "=== LOCAL TEST ===" && \
curl -v http://localhost:80 2>&1 | head -20

# 4. Proveri firewall
echo "" && \
echo "=== FIREWALL STATUS ===" && \
sudo ufw status

# 5. Proveri container status
echo "" && \
echo "=== CONTAINER STATUS ===" && \
cd /opt/biozenapp && \
docker compose -f docker-compose.production.yml ps
```

---

## ✅ Checklist za Cloudflare

- [ ] SSL/TLS mode je postavljen na **"Flexible"** (najlakše) ili **"Full"**
- [ ] DNS A record za `app.biozen.rs` pokazuje na pravi IP adresu servera
- [ ] Proxy status je **"Proxied"** (orange cloud)
- [ ] Firewall na serveru dozvoljava port 80
- [ ] Server odgovara na `http://your-server-ip` direktno (bez Cloudflare)

---

## 🐛 Troubleshooting

### Problem: "SSL/TLS mode je već na Flexible, ali i dalje ne radi"

1. Proveri da li je DNS record tačan
2. Proveri da li je Proxy status "Proxied"
3. Sačekaj 5-10 minuta (DNS propagacija)
4. Pokušaj da "Pause Cloudflare on Site" i testiraj direktno

### Problem: "Server radi direktno, ali ne kroz Cloudflare"

1. Proveri SSL/TLS mode (treba da bude "Flexible")
2. Proveri da li firewall blokira Cloudflare IP-ove
3. Proveri da li je Proxy status "Proxied"

---

## 📝 Napomene

1. **Cloudflare Error 521** obično znači da Cloudflare ne može da se poveže sa origin serverom
2. **Najčešći uzrok**: SSL/TLS mode nije pravilno postavljen
3. **Rešenje**: Postavi SSL/TLS mode na **"Flexible"** (najlakše)

---

## 🎉 Gotovo!

Nakon što promeniš SSL/TLS mode na "Flexible" u Cloudflare Dashboard-u, sačekaj 2-3 minuta i probaj ponovo. Trebalo bi da radi!

