# ✅ Production Ready Checklist

## Status

- ✅ Backend je pokrenut
- ✅ Frontend je pokrenut
- ✅ Baza radi
- ✅ Sve tabele postoje
- ✅ Sve kolone postoje (obim_struka, promena_obim_struka)

---

## Finalni Testovi

### 1. Test Login

Otvori u browseru: `http://your-production-domain.com` ili `http://your-server-ip`

Pokušaj da se uloguješ sa postojećim korisnikom.

**Očekivano:** Login radi, preusmerava na dashboard.

---

### 2. Test Obim Struka

1. Uloguj se
2. Idi na "Moji podaci"
3. Unesi obim struka (npr. `85`)
4. Sačuvaj
5. Proveri da li je sačuvano (refresh stranice)

**Očekivano:** Obim struka se čuva i prikazuje.

---

### 3. Test Merenja

1. Idi na "Merenja"
2. Dodaj novo merenje:
   - Kilaza: `75`
   - Obim struka: `82`
   - Komentar: `Test`
3. Sačuvaj
4. Proveri da li se prikazuje u tabeli

**Očekivano:** Merenje se čuva, prikazuje se razlika u kilaži i obimu struka.

---

### 4. Test Chat

1. Idi na Chat
2. Pošalji poruku (npr. "Kako da smršam?")
3. Sačekaj odgovor

**Očekivano:** Chat radi, dobijaš odgovor od AI-a.

---

### 5. Test Blogovi

1. Idi na Blogovi tab
2. Proveri da li se prikazuju blogovi (ako postoje)

**Očekivano:** Blogovi se prikazuju (ako su objavljeni).

---

### 6. Test Admin Panel (Ako Si Admin)

1. Uloguj se kao admin
2. Idi na Admin Panel
3. Proveri:
   - Korisnici tabela
   - Blog sekcija
   - Statistike

**Očekivano:** Admin panel radi, vidiš korisnike i blogove.

---

## Provera Environment Variables

Proveri da li su sve environment variables setovane:

```bash
# SSH na production server
ssh root@your-production-ip
cd /opt/biozenapp

# Proveri .env fajl
cat .env

# Proveri da li su sve varijable setovane u container-u
docker compose -f docker-compose.production.yml exec backend env | grep -E "SPRING_DATASOURCE|JWT|OPENAI|MAIL"
```

**Trebalo bi da vidiš:**
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `APP_JWT_SECRET`
- `OPENAI_API_KEY`
- `MAIL_PASSWORD`

---

## Provera Logova

Proveri da li ima grešaka u logovima:

```bash
# Backend logovi
docker compose -f docker-compose.production.yml logs backend | grep -i "error\|exception\|failed" | tail -20

# Frontend logovi
docker compose -f docker-compose.production.yml logs frontend | grep -i "error\|exception\|failed" | tail -20

# Postgres logovi
docker compose -f docker-compose.production.yml logs postgres | grep -i "error\|exception\|failed" | tail -20
```

**Očekivano:** Nema grešaka (ili samo warning-ove koji nisu kritični).

---

## Provera Container Status

```bash
# Proveri status svih container-a
docker compose -f docker-compose.production.yml ps

# Proveri da li su svi healthy
docker compose -f docker-compose.production.yml ps | grep -i "healthy\|up"
```

**Očekivano:** Svi containeri su `Up` i `healthy` (ili `Up` bez grešaka).

---

## 🎯 Sve Odjednom - Copy-Paste

```bash
# SSH na production server
ssh root@your-production-ip
cd /opt/biozenapp

# 1. Proveri status container-a
echo "=== CONTAINER STATUS ===" && \
docker compose -f docker-compose.production.yml ps

# 2. Proveri environment variables
echo "" && \
echo "=== ENVIRONMENT VARIABLES ===" && \
docker compose -f docker-compose.production.yml exec backend env | grep -E "SPRING_DATASOURCE|JWT|OPENAI|MAIL" | head -10

# 3. Proveri greške u logovima
echo "" && \
echo "=== BACKEND ERRORS ===" && \
docker compose -f docker-compose.production.yml logs backend | grep -i "error\|exception\|failed" | tail -10 || echo "Nema grešaka"

# 4. Proveri da li backend odgovara
echo "" && \
echo "=== BACKEND API TEST ===" && \
curl -s http://localhost:8080/api/me | head -5

# 5. Proveri da li frontend odgovara
echo "" && \
echo "=== FRONTEND TEST ===" && \
curl -s http://localhost:80 | head -5
```

---

## ✅ Finalni Checklist

- [ ] Backend je pokrenut (`Started MiniAppApplication`)
- [ ] Frontend je pokrenut (vraća HTML)
- [ ] Baza radi (sve tabele i kolone postoje)
- [ ] Login radi
- [ ] Obim struka se čuva
- [ ] Merenja se čuvaju
- [ ] Chat radi
- [ ] Blogovi se prikazuju
- [ ] Admin panel radi (ako si admin)
- [ ] Nema kritičnih grešaka u logovima
- [ ] Svi containeri su `Up` i `healthy`

---

## 🎉 Gotovo!

Ako su svi testovi prošli, aplikacija je spremna za production! 🚀

---

## 📝 Napomene

1. **Password**: Ako još uvek koristiš `POSTGRES_PASSWORD=change-this-password`, promeni ga na sigurniji password.

2. **JWT Secret**: Ako još uvek koristiš default JWT secret, promeni ga na sigurniji secret (min 32 karaktera).

3. **Backup**: Napravi backup baze pre nego što napraviš veće izmene:
   ```bash
   docker compose -f docker-compose.production.yml exec postgres pg_dump -U biozen biozenapp > backup-$(date +%Y%m%d).sql
   ```

4. **Monitoring**: Razmotri dodavanje monitoring-a (npr. log rotation, health checks, itd.).

---

## 🐛 Ako Nešto Ne Radi

Ako nešto ne radi, proveri:
1. Logove (`docker compose -f docker-compose.production.yml logs <service>`)
2. Status container-a (`docker compose -f docker-compose.production.yml ps`)
3. Environment variables (`cat .env`)
4. Network connectivity (`curl http://localhost:8080/api/me`)

