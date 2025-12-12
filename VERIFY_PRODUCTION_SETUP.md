# ✅ Provera Production Setup-a

## Status Container-a

Svi containeri su pokrenuti:
- ✅ `biozen-postgres` - Healthy
- ✅ `biozen-backend` - Up (health: starting)
- ✅ `biozen-frontend` - Up na portu 80

---

## Korak 1: Proveri Backend Logove

```bash
# SSH na production server
ssh root@your-production-ip
cd /opt/biozenapp

# Proveri backend logove
docker compose -f docker-compose.production.yml logs backend | tail -50
```

**Traži:**
- `HikariPool-1 - Start completed` ✅ - uspešna konekcija na bazu
- `Started MiniAppApplication` ✅ - backend je pokrenut
- `Exception` ili `Error` ❌ - ako vidiš greške

---

## Korak 2: Proveri da Li Backend Radi

```bash
# Proveri da li backend odgovara
curl http://localhost:8080/api/me

# Trebalo bi da vrati JSON (čak i ako nisi ulogovan)
# Primer: {"authenticated":false} ili {"message":"Niste autentifikovani"}
```

---

## Korak 3: Proveri Frontend

```bash
# Proveri da li frontend radi
curl http://localhost:80

# Trebalo bi da vrati HTML (login stranica)
```

---

## Korak 4: Proveri Bazu

```bash
# Konektuj se na bazu
docker compose -f docker-compose.production.yml exec postgres psql -U biozen -d biozenapp

# U PostgreSQL prompt-u:
# \l  (lista baza)
# \dt  (lista tabela)
# \q  (izlaz)
```

---

## Korak 5: Proveri da Li Hibernate Kreira Tabele

```bash
# Proveri backend logove za Hibernate poruke
docker compose -f docker-compose.production.yml logs backend | grep -i "hibernate\|ddl\|create\|alter"

# Trebalo bi da vidiš SQL upite za kreiranje tabela (ako je prvi put)
```

---

## 🎯 Sve Odjednom - Copy-Paste

```bash
# SSH na production server
ssh root@your-production-ip
cd /opt/biozenapp

# 1. Proveri backend logove
echo "=== BACKEND LOGOVI ===" && \
docker compose -f docker-compose.production.yml logs backend | tail -50

# 2. Proveri da li backend radi
echo "" && \
echo "=== BACKEND API TEST ===" && \
curl -s http://localhost:8080/api/me | head -5 || echo "Backend ne odgovara"

# 3. Proveri frontend
echo "" && \
echo "=== FRONTEND TEST ===" && \
curl -s http://localhost:80 | head -10 || echo "Frontend ne odgovara"

# 4. Proveri bazu
echo "" && \
echo "=== DATABASE TEST ===" && \
docker compose -f docker-compose.production.yml exec postgres psql -U biozen -d biozenapp -c "\dt" 2>/dev/null | head -20 || echo "Ne može da se konektuje na bazu"

# 5. Proveri Hibernate
echo "" && \
echo "=== HIBERNATE LOGOVI ===" && \
docker compose -f docker-compose.production.yml logs backend | grep -i "hibernate\|ddl\|create\|alter" | tail -10 || echo "Nema Hibernate logova"
```

---

## ✅ Checklist

- [ ] Backend logovi pokazuju "Started MiniAppApplication"
- [ ] Backend logovi pokazuju "HikariPool-1 - Start completed"
- [ ] `curl http://localhost:8080/api/me` vraća JSON
- [ ] `curl http://localhost:80` vraća HTML
- [ ] Baza ima tabele (users, measurements, chat_messages, blog_posts, itd.)
- [ ] Nema grešaka u logovima

---

## 🐛 Troubleshooting

### Problem: Backend ne može da se konektuje na bazu

```bash
# Proveri da li postgres container radi
docker compose -f docker-compose.production.yml ps postgres

# Proveri postgres logove
docker compose -f docker-compose.production.yml logs postgres | tail -20

# Proveri da li je postgres healthy
docker compose -f docker-compose.production.yml ps postgres | grep healthy
```

### Problem: Backend ne startuje

```bash
# Proveri backend logove za greške
docker compose -f docker-compose.production.yml logs backend | grep -i "error\|exception\|failed"

# Proveri environment variables
docker compose -f docker-compose.production.yml exec backend env | grep -i "SPRING_DATASOURCE\|JWT\|OPENAI"
```

### Problem: Frontend ne radi

```bash
# Proveri frontend logove
docker compose -f docker-compose.production.yml logs frontend | tail -20

# Proveri da li je port 80 slobodan
sudo lsof -i :80
```

---

## 🎉 Gotovo!

Kada sve proveri i testira, aplikacija je spremna za production! 🚀

