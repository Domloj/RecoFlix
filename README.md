# RecoFlix

RecoFlix to nowoczesna aplikacja webowa integrująca inteligentny silnik rekomendacji filmów (MovieLens) z przejrzystym interfejsem użytkownika.

## Stack Technologiczny
* **Frontend:** React (Vite), TypeScript, Mantine UI, Vitest
* **Backend:** Python, FastAPI, Pytest
* **Chmura / Auth:** Firebase

---

## Jak uruchomić projekt lokalnie?

### 1. Backend (Silnik AI i API)
⚠️ **Ważne:** Zanim zaczniesz, upewnij się, że posiadasz prywatny klucz dostępu do Firebase (`serviceAccountKey.json`) i umieściłeś go w folderze `backend/`.

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

API będzie dostępne pod adresem: `http://localhost:8000` (Dokumentacja Swagger: `/docs`)

### 2. Frontend (Interfejs Użytkownika)
⚠️ **Ważne:** Upewnij się, że masz skonfigurowany plik `.env.local` z publicznymi kluczami Firebase dla Reacta.

```bash
cd frontend
npm install
npm run dev
```

Aplikacja uruchomi się pod adresem: `http://localhost:5173`

---

## Testy automatyczne

Dbamy o jakość! Projekt jest podłączony pod GitHub Actions, co oznacza, że każdy push jest automatycznie sprawdzany. Możesz też uruchomić testy ręcznie:

**Testy Frontendu (React):**
```bash
cd frontend
npx vitest
```

**Testy Backendu (FastAPI):**
```bash
cd backend
pytest -v
```
