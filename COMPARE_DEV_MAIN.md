# 🔍 Kako da Uporediš Dev i Main Branch Pre Merge-a

Ovaj vodič objašnjava kako da detaljno uporediš šta je na `dev` branch-u a šta na `main` branch-u pre nego što merge-uješ.

---

## 📊 Korak 1: Proveri Trenutni Branch

```bash
cd /Users/andrejdzakovic/Dropbox/BioZen/biozenapp

# Proveri na kom branch-u si
git branch

# Trebalo bi da vidiš:
# * dev
#   main
```

---

## 📋 Korak 2: Vidi Koliko Commit-ova Nije na Main

```bash
# Broj commit-ova na dev koji nisu na main
git log main..dev --oneline | wc -l

# ILI jednostavnije - vidi listu commit-ova
git log main..dev --oneline
```

**Šta ovo znači:**
- `main..dev` = commit-ovi koji su na `dev` ali NISU na `main`
- Ovo ti pokazuje sve izmene koje će se merge-ovati

---

## 📝 Korak 3: Vidi Listu Svih Commit-ova sa Dev

```bash
# Vidi poslednjih 30 commit-ova sa dev koji nisu na main
git log main..dev --oneline | head -30

# ILI vidi sve commit-ove sa detaljima
git log main..dev --oneline --graph
```

**Primer output-a:**
```
3470dbe Add production migration guide and update docker-compose.production.yml with OPENAI_API_KEY
7e31e6a Fix obimStruka not being saved - add to useEffect and handleSubmit
cf84fd0 Add Privacy Policy modal with health tracking app focused content
...
```

---

## 📁 Korak 4: Vidi Koji Fajlovi Su Promenjeni

```bash
# Vidi listu fajlova koji su promenjeni/dodati/obrisani
git diff main..dev --stat

# ILI samo imena fajlova
git diff main..dev --name-only

# ILI sa statusom (dodato/modifikovano/obrisano)
git diff main..dev --name-status
```

**Šta znače oznake:**
- `A` = Added (dodat novi fajl)
- `M` = Modified (modifikovan postojeći fajl)
- `D` = Deleted (obrisan fajl)

---

## 🔍 Korak 5: Vidi Detaljne Razlike u Specifičnim Fajlovima

### 5.1. Vidi razlike u backend fajlovima:

```bash
# Vidi sve backend fajlove koji su promenjeni
git diff main..dev --name-only | grep backend/

# Vidi razlike u konkretnom fajlu (npr. App.jsx)
git diff main..dev frontend/src/App.jsx

# ILI vidi samo broj linija koje su promenjene
git diff main..dev frontend/src/App.jsx --stat
```

### 5.2. Vidi razlike u frontend fajlovima:

```bash
# Vidi sve frontend fajlove koji su promenjeni
git diff main..dev --name-only | grep frontend/

# Vidi razlike u App.jsx
git diff main..dev frontend/src/App.jsx | head -100
```

**Napomena:** `head -100` prikazuje samo prvih 100 linija. Ako želiš sve, izostavi `| head -100`.

---

## 📊 Korak 6: Vidi Pregled Svih Izmena (Summary)

```bash
# Vidi summary svih izmena
git diff main..dev --stat

# Output će biti nešto ovako:
# backend/pom.xml                                    |   13 +
# frontend/src/App.jsx                               | 3103 ++++++++++++++++++--
# ...
# 58 files changed, 6464 insertions(+), 228 deletions(-)
```

**Šta znači:**
- `13 +` = 13 linija dodato u `backend/pom.xml`
- `3103 ++++++++++++++++++--` = 3103 linija dodato, nekoliko obrisano u `App.jsx`
- `58 files changed` = 58 fajlova je promenjeno
- `6464 insertions(+), 228 deletions(-)` = 6464 linija dodato, 228 obrisano

---

## 🔄 Korak 7: Vidi Razlike u Konfiguraciji

```bash
# Vidi razlike u docker-compose fajlovima
git diff main..dev docker-compose*.yml

# Vidi razlike u package.json
git diff main..dev frontend/package.json

# Vidi razlike u pom.xml (Maven dependencies)
git diff main..dev backend/pom.xml
```

---

## 📦 Korak 8: Vidi Koje Nove Fajlove Su Dodati

```bash
# Vidi samo nove fajlove (Added)
git diff main..dev --name-status | grep "^A"

# ILI jednostavnije - vidi samo nove fajlove
git diff main..dev --diff-filter=A --name-only
```

**Primer output-a:**
```
backend/src/main/java/com/example/app/chat/ChatController.java
backend/src/main/java/com/example/app/blog/BlogPost.java
frontend/src/brand.css
MIGRATE_TO_PRODUCTION.md
```

---

## 🗑️ Korak 9: Vidi Koje Fajlove Su Obrisani

```bash
# Vidi obrisane fajlove
git diff main..dev --name-status | grep "^D"

# ILI
git diff main..dev --diff-filter=D --name-only
```

---

## 🔀 Korak 10: Vidi Koje Fajlove Su Modifikovani

```bash
# Vidi modifikovane fajlove
git diff main..dev --name-status | grep "^M"

# ILI
git diff main..dev --diff-filter=M --name-only
```

---

## 📋 Korak 11: Kreiraj Detaljni Izveštaj

```bash
# Kreiraj fajl sa svim razlikama
git log main..dev --oneline > dev-commits.txt
git diff main..dev --stat > dev-changes-summary.txt
git diff main..dev --name-status > dev-files-changed.txt

# Zatim otvori fajlove u editoru da vidiš detalje
cat dev-commits.txt
cat dev-changes-summary.txt
cat dev-files-changed.txt
```

---

## 🎯 Korak 12: Vidi Razlike u Specifičnim Direktorijumima

```bash
# Vidi samo backend izmene
git diff main..dev --stat -- backend/

# Vidi samo frontend izmene
git diff main..dev --stat -- frontend/

# Vidi samo dokumentaciju
git diff main..dev --stat -- *.md
```

---

## 🔍 Korak 13: Vidi Razlike u Konkretnom Fajlu (Sa Kontekstom)

```bash
# Vidi razlike sa 3 linije konteksta pre i posle
git diff main..dev -U3 frontend/src/App.jsx | head -200

# ILI vidi samo dodate linije
git diff main..dev frontend/src/App.jsx | grep "^+"

# ILI vidi samo obrisane linije
git diff main..dev frontend/src/App.jsx | grep "^-"
```

---

## 📊 Korak 14: Vidi Grafički Pregled Branch-ova

```bash
# Vidi grafički prikaz branch-ova
git log --oneline --all --graph -20

# ILI detaljniji prikaz
git log --all --graph --decorate --oneline -30
```

**Šta znači:**
- `*` = commit na trenutnom branch-u
- `|` = linija commit-a
- `* dev` = dev branch
- `* main` = main branch

---

## ✅ Korak 15: Proveri da Li Postoje Konflikti (Pre Merge-a)

```bash
# Proveri da li će biti konflikata pri merge-u
git merge --no-commit --no-ff dev

# Ako nema grešaka, otkaži merge (samo provera)
git merge --abort
```

**Napomena:** Ovo samo proverava, ne merge-uje zaista.

---

## 🎯 Korak 16: Vidi Razlike u Environment Variables

```bash
# Vidi razlike u docker-compose fajlovima
git diff main..dev docker-compose*.yml

# Vidi razlike u .env.example (ako postoji)
git diff main..dev .env.example
```

---

## 📝 Korak 17: Kreiraj Kompletan Izveštaj

```bash
# Kreiraj folder za izveštaje
mkdir -p comparison-report

# Kreiraj različite izveštaje
git log main..dev --oneline > comparison-report/commits.txt
git diff main..dev --stat > comparison-report/files-changed.txt
git diff main..dev --name-status > comparison-report/files-status.txt

# Vidi izveštaje
cat comparison-report/commits.txt
cat comparison-report/files-changed.txt
cat comparison-report/files-status.txt
```

---

## 🔍 Korak 18: Vidi Razlike u Backend Java Fajlovima

```bash
# Vidi sve nove Java fajlove
git diff main..dev --diff-filter=A --name-only | grep "\.java$"

# Vidi sve modifikovane Java fajlove
git diff main..dev --diff-filter=M --name-only | grep "\.java$"

# Vidi razlike u konkretnom Java fajlu
git diff main..dev backend/src/main/java/com/example/app/user/User.java
```

---

## 🔍 Korak 19: Vidi Razlike u Frontend React Fajlovima

```bash
# Vidi sve promene u frontend/src
git diff main..dev --stat -- frontend/src/

# Vidi razlike u App.jsx (može biti dugačak!)
git diff main..dev frontend/src/App.jsx --stat

# Vidi samo broj linija promenjenih u App.jsx
git diff main..dev frontend/src/App.jsx | wc -l
```

---

## 📋 Korak 20: Finalni Pregled - Sve Odjednom

```bash
# Kompletan pregled - sve odjednom
echo "=== COMMITS NA DEV KOJI NISU NA MAIN ===" && \
git log main..dev --oneline && \
echo "" && \
echo "=== BROJ COMMIT-OVA ===" && \
git log main..dev --oneline | wc -l && \
echo "" && \
echo "=== PREGLED IZMENA ===" && \
git diff main..dev --stat && \
echo "" && \
echo "=== NOVI FAJLOVI ===" && \
git diff main..dev --diff-filter=A --name-only && \
echo "" && \
echo "=== OBRISANI FAJLOVI ===" && \
git diff main..dev --diff-filter=D --name-only
```

---

## 💡 Najjednostavniji Način - Korak po Korak

Ako želiš najjednostavniji pregled, koristi ove komande redom:

```bash
# 1. Vidi koliko commit-ova nije na main
git log main..dev --oneline | wc -l

# 2. Vidi listu commit-ova
git log main..dev --oneline

# 3. Vidi koje fajlove su promenjeni
git diff main..dev --stat

# 4. Vidi summary (koliko linija dodato/obrisano)
git diff main..dev --shortstat
```

---

## 🎯 Šta Da Tražiš

Kada pregledaš izmene, proveri:

1. **Nove funkcionalnosti:**
   - Chat (ChatController, ChatMessage)
   - Blog (BlogPost, AdminBlogController)
   - Obim struka (User.obimStruka, Measurement.obimStruka)

2. **Nove zavisnosti:**
   - `backend/pom.xml` - proveri nove dependencies
   - `frontend/package.json` - proveri nove packages

3. **Nove environment variables:**
   - `OPENAI_API_KEY` u docker-compose fajlovima

4. **Database izmene:**
   - `database_migration_add_obim_struka.sql`
   - Nove tabele (chat_messages)

5. **Konfiguracija:**
   - `docker-compose.production.yml` - proveri nove environment variables
   - `backend/src/main/resources/application.properties` - proveri nove postavke

---

## ✅ Kada Si Spreman za Merge

Kada si pregledao sve izmene i siguran si da želiš da merge-uješ:

```bash
# Prebaci se na main
git checkout main

# Pull najnovije izmene (ako postoje)
git pull origin main

# Merge dev u main
git merge dev

# Ako nema konflikata, push na GitHub
git push origin main
```

---

## 🐛 Ako Ima Konflikata

Ako merge pokaže konflikte:

```bash
# Vidi koje fajlove imaju konflikte
git status

# Otvori fajlove sa konfliktima i reši ih ručno
# Zatim:
git add .
git commit -m "Resolve merge conflicts from dev to main"
git push origin main
```

