# 🔧 Rešavanje Problema sa Kreiranjem Blog-a

## Status

✅ Tabela `blog_posts` postoji
✅ Nema postojećih blogova (nije duplikat slug-a)
❓ Treba proveriti backend logove i admin status

---

## Korak 1: Pull Najnovije Izmene i Rebuild

```bash
# SSH na production server
ssh root@164.90.231.47
cd /opt/biozenapp

# Pull najnovije izmene (sa boljim logovanjem)
git pull origin main

# Rebuild backend
docker compose -f docker-compose.production.yml build --no-cache backend

# Restart backend
docker compose -f docker-compose.production.yml restart backend

# Sačekaj 10 sekundi
sleep 10
```

---

## Korak 2: Proveri Admin Status

```bash
# Proveri da li je korisnik admin
docker compose -f docker-compose.production.yml exec postgres psql -U biozen -d biozenapp -c "SELECT email, role, is_active FROM users WHERE email = 'office@biozen.rs';"
```

**Ako role nije "ADMIN", promeni ga:**
```bash
docker compose -f docker-compose.production.yml exec postgres psql -U biozen -d biozenapp -c "UPDATE users SET role = 'ADMIN' WHERE email = 'office@biozen.rs';"
```

---

## Korak 3: Pokušaj Ponovo da Kreiraš Blog

1. **Logout** iz aplikacije
2. **Login** sa `office@biozen.rs`
3. Pokušaj ponovo da kreiraš blog

---

## Korak 4: Proveri Backend Logove

```bash
# Proveri logove (posle pokušaja kreiranja bloga)
docker compose -f docker-compose.production.yml logs backend | tail -100

# ILI samo greške
docker compose -f docker-compose.production.yml logs backend | grep -i "error\|exception\|failed" | tail -50
```

---

## 🎯 Sve Odjednom - Copy-Paste

```bash
# SSH na production server
ssh root@164.90.231.47
cd /opt/biozenapp

# 1. Pull najnovije izmene
echo "=== PULL NAJNOVIJE IZMENE ===" && \
git pull origin main

# 2. Rebuild backend
echo "" && \
echo "=== REBUILD BACKEND ===" && \
docker compose -f docker-compose.production.yml build --no-cache backend

# 3. Restart backend
echo "" && \
echo "=== RESTART BACKEND ===" && \
docker compose -f docker-compose.production.yml restart backend

# 4. Sačekaj 10 sekundi
echo "" && \
echo "=== WAITING 10 SECONDS ===" && \
sleep 10

# 5. Proveri admin status
echo "" && \
echo "=== ADMIN STATUS ===" && \
docker compose -f docker-compose.production.yml exec postgres psql -U biozen -d biozenapp -c "SELECT email, role, is_active FROM users WHERE email = 'office@biozen.rs';" 2>/dev/null

# 6. Ako role nije ADMIN, promeni ga
echo "" && \
echo "=== PROMENA ROLE U ADMIN (ako nije već) ===" && \
docker compose -f docker-compose.production.yml exec postgres psql -U biozen -d biozenapp -c "UPDATE users SET role = 'ADMIN' WHERE email = 'office@biozen.rs'; SELECT email, role, is_active FROM users WHERE email = 'office@biozen.rs';" 2>/dev/null

# 7. Proveri backend logove (POKUŠAJ PONOVO DA KREIRAŠ BLOG, PA PROVERI)
echo "" && \
echo "=== BACKEND LOGOVI (poslednjih 100 linija) ===" && \
echo "POKUŠAJ PONOVO DA KREIRAŠ BLOG, PA PROVERI LOGOVE:" && \
docker compose -f docker-compose.production.yml logs backend | tail -100
```

---

## 🐛 Najčešći Problemi

### Problem 1: Admin Role Nije Promenjen

Ako role nije "ADMIN", endpoint će vratiti 403. Rešenje: promeni role u bazi (komanda iznad).

### Problem 2: JWT Token Ima Staru Role Informaciju

Ako si promenio role u bazi, ali si još uvek ulogovan, JWT token još uvek ima staru role informaciju. Rešenje: **logout i login ponovo**.

### Problem 3: Backend Greška

Proveri backend logove za specifičnu grešku (NullPointerException, SQLException, itd.).

---

## 📝 Šta Da Uradiš

1. Pull najnovije izmene i rebuild backend (komande iznad)
2. Proveri admin status i promeni role ako nije "ADMIN"
3. **Logout i login ponovo** (da se generiše novi JWT token sa admin role-om)
4. Pokušaj ponovo da kreiraš blog
5. Proveri backend logove i pošalji mi output

---

## ✅ Checklist

- [ ] Pull najnovije izmene
- [ ] Rebuild backend
- [ ] Restart backend
- [ ] Proveri admin status (role = 'ADMIN')
- [ ] Logout i login ponovo
- [ ] Pokušaj ponovo da kreiraš blog
- [ ] Proveri backend logove

