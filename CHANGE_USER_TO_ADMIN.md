# 🔐 Promena Korisnika u Admin-a

## Promena Role za office@biozen.rs

Promenićemo role korisnika sa email-om `office@biozen.rs` iz "USER" u "ADMIN".

---

## Korak 1: Konektuj Se na Bazu

```bash
# SSH na production server
ssh root@164.90.231.47
cd /opt/biozenapp

# Konektuj se na bazu
docker compose -f docker-compose.production.yml exec postgres psql -U biozen -d biozenapp
```

---

## Korak 2: Proveri Trenutni Role

```sql
-- Proveri trenutni role korisnika
SELECT id, email, role, is_active 
FROM users 
WHERE email = 'office@biozen.rs';
```

---

## Korak 3: Promeni Role u ADMIN

```sql
-- Promeni role u ADMIN
UPDATE users 
SET role = 'ADMIN' 
WHERE email = 'office@biozen.rs';

-- Proveri da li je promenjeno
SELECT id, email, role, is_active 
FROM users 
WHERE email = 'office@biozen.rs';

-- Izađi
\q
```

---

## 🎯 Sve Odjednom - Copy-Paste

```bash
# SSH na production server
ssh root@164.90.231.47
cd /opt/biozenapp

# Konektuj se na bazu i promeni role
docker compose -f docker-compose.production.yml exec postgres psql -U biozen -d biozenapp -c "
-- Proveri trenutni role
SELECT id, email, role, is_active FROM users WHERE email = 'office@biozen.rs';

-- Promeni role u ADMIN
UPDATE users SET role = 'ADMIN' WHERE email = 'office@biozen.rs';

-- Proveri da li je promenjeno
SELECT id, email, role, is_active FROM users WHERE email = 'office@biozen.rs';
"
```

---

## Korak 4: Testiraj Admin Pristup

1. **Logout** iz aplikacije (ako si ulogovan)
2. **Login** sa `office@biozen.rs`
3. Trebalo bi da vidiš **Admin Panel** opciju

---

## ✅ Provera

Nakon promene, proveri:

1. **U bazi:**
   ```sql
   SELECT email, role FROM users WHERE email = 'office@biozen.rs';
   -- Trebalo bi da vidiš: role = 'ADMIN'
   ```

2. **U aplikaciji:**
   - Login sa `office@biozen.rs`
   - Trebalo bi da vidiš Admin Panel

---

## 🐛 Troubleshooting

### Problem: "Korisnik i dalje nema admin pristup"

1. Proveri da li je role zaista promenjen u bazi:
   ```sql
   SELECT email, role FROM users WHERE email = 'office@biozen.rs';
   ```

2. Proveri da li je `is_active = true`:
   ```sql
   SELECT email, role, is_active FROM users WHERE email = 'office@biozen.rs';
   ```

3. **Logout i login ponovo** - JWT token možda još uvek ima staru role informaciju

4. Proveri backend logove:
   ```bash
   docker compose -f docker-compose.production.yml logs backend | grep -i "admin\|role" | tail -20
   ```

---

## 📝 Napomene

- Role je case-insensitive ("ADMIN" = "admin" = "Admin")
- Korisnik mora biti `is_active = true` da bi imao admin pristup
- JWT token se generiše pri login-u, tako da treba **logout i login ponovo** nakon promene role

