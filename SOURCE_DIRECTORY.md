# Source Directory - Brzi Vodič

## Šta da upišeš u polje "Source Directory" na Digital Ocean:

### ✅ Backend servis:
```
backend
```

### ✅ Frontend servis:
```
frontend
```

---

## Detaljne instrukcije:

### Backend:
1. Kada Digital Ocean traži "Source Directory", upiši: **`backend`**
2. Build Type: **Docker**
3. Dockerfile Path: **`Dockerfile`** (ili ostavi prazno)
4. HTTP Port: **`8080`**

### Frontend:
1. Kada Digital Ocean traži "Source Directory", upiši: **`frontend`**
2. Build Type: **Docker**
3. Dockerfile Path: **`Dockerfile`** (ili ostavi prazno)
4. HTTP Port: **`80`**

---

## Zašto ovo?

Dockerfile-ovi se nalaze u:
- `backend/Dockerfile` → Source Directory: `backend`
- `frontend/Dockerfile` → Source Directory: `frontend`

Digital Ocean će automatski pronaći Dockerfile u tom direktorijumu.

