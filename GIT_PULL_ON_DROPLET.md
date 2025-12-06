# 🔄 Kako da Povučeš Izmene sa Git-a na Droplet-u

## Osnovne Komande

```bash
# 1. Idi u direktorijum aplikacije
cd /opt/biozenapp

# 2. Proveri trenutni status
git status

# 3. Povuci najnovije izmene
git pull origin main

# 4. Ako ima konflikata, reši ih i commit-uj
# (obično neće biti konflikata ako radiš samo pull)
```

## Ako Git Traži Credentials

### Opcija 1: Personal Access Token (Preporučeno)

```bash
# Kada te pita za password, koristi Personal Access Token
# (ne tvoj GitHub password)

# Ili setuj token direktno:
git config --global credential.helper store
# Prvi put će tražiti username i password (token)
# Nakon toga će se automatski zapamtiti
```

### Opcija 2: SSH Key (Najbolje za Production)

```bash
# 1. Generiši SSH key na Droplet-u
ssh-keygen -t ed25519 -C "biozen-droplet"
# Pritisni Enter za sve (ne setuj password)

# 2. Kopiraj javni ključ
cat ~/.ssh/id_ed25519.pub

# 3. Dodaj ga na GitHub:
# - GitHub → Settings → SSH and GPG keys → New SSH key
# - Paste javni ključ

# 4. Promeni remote URL na SSH
cd /opt/biozenapp
git remote set-url origin git@github.com:4beesdev/biozenapp.git

# 5. Testiraj
git pull origin main
```

## Nakon Pull-a - Rebuild i Restart

```bash
# 1. Povuci izmene
cd /opt/biozenapp
git pull origin main

# 2. Rebuild Docker image-e
docker compose build

# 3. Restart aplikaciju
docker compose down
docker compose up -d

# 4. Proveri status
docker compose ps
docker compose logs -f backend
```

## Automatski Pull i Deploy (Opcionalno)

Možeš kreirati skriptu koja automatski pull-uje i redeploy-uje:

```bash
cat > /opt/biozenapp/deploy.sh << 'EOF'
#!/bin/bash
cd /opt/biozenapp
git pull origin main
docker compose build
docker compose down
docker compose up -d
echo "✅ Deploy završen!"
EOF

chmod +x /opt/biozenapp/deploy.sh

# Koristi sa:
/opt/biozenapp/deploy.sh
```

## Troubleshooting

### Problem: "Permission denied"
```bash
# Proveri ownership
ls -la /opt/biozenapp
# Ako treba, promeni ownership
chown -R root:root /opt/biozenapp
```

### Problem: "Your branch is behind"
```bash
# Force pull (pažljivo!)
git fetch origin
git reset --hard origin/main
```

### Problem: "Local changes would be overwritten"
```bash
# Sačuvaj lokalne izmene
git stash

# Pull
git pull origin main

# Vrati lokalne izmene (ako treba)
git stash pop
```

