# Architektura Projektu Recoflix

## 1. Opis Projektu
RecoFlix to aplikacja webowa do rekomendowania filmów, która łączy interfejs użytkownika zbudowany w React z backendem FastAPI. System wykorzystuje Firebase Authentication do zarządzania użytkownikami oraz modele językowe OpenAI do generowania spersonalizowanych rekomendacji filmowych.

## 2. Stack Technologiczny
- **Frontend:** React 18 (za pomocą Vite), Mantine (biblioteka UI), React Router DOM, Firebase Client SDK.
- **Backend:** FastAPI, AsyncOpenAI (do komunikacji z modelami językowymi OpenAI), python-dotenv, Firebase Admin SDK.
- **Baza danych:** Brak tradycyjnej bazy danych dla filmów (dane statyczne ładowane z pliku `movies_database.json`). Firebase Authentication dla zarządzania kontami użytkowników.

## 3. Struktura Folderów (Overview)
- `/.github` - Konfiguracje GitHub Actions dla CI/CD.
- `/backend` - Logika serwerowa, API w FastAPI, serwisy i moduły do interakcji z LLM.
- `/data` - Przechowuje statyczne dane, takie jak baza filmów (`movies_database.json`).
- `/frontend` - Aplikacja kliencka React, komponenty, strony i logika UI.
- `.gitignore` - Plik ignorujący dla Git.
- `ARCHITECTURE.md` - Dokumentacja architektury projektu.
- `CONVENTIONS.md` - Konwencje GIT i GitHub dla projektu.
- `README.md` - Główny plik README projektu.

## 4. Główne Założenia i Przepływ Danych (Data Flow)
1.  **Uwierzytelnianie:** Użytkownik loguje się lub rejestruje poprzez interfejs React. Frontend używa Firebase Client SDK do uwierzytelniania, otrzymując token ID.
2.  **Komunikacja Frontend-Backend:** Aplikacja kliencka (React) komunikuje się z API FastAPI poprzez żądania HTTP (np. POST do `/api/chat`).
3.  **Autoryzacja API:** Każde chronione żądanie do backendu zawiera token ID Firebase w nagłówku autoryzacji. Backend, korzystając z `dependencies.py` i Firebase Admin SDK, weryfikuje ważność tokena i identyfikuje użytkownika.
4.  **Generowanie Rekomendacji:** Po autoryzacji, żądanie użytkownika (wraz z historią rozmów) jest przekazywane do `llm_service.py`. Ten serwis wysyła zapytanie do modelu językowego OpenAI, używając statycznej bazy filmów (`movies_database.json`) do kontekstu.
5.  **Odpowiedź AI:** Model językowy generuje rekomendację filmu, która jest zwracana przez backend do frontendu i wyświetlana w widżecie czatu.

## 5. Aktualny Plan Działania / Kamienie Milowe
- [x] Krok 1: Inicjalizacja i konfiguracja agentów (W TOKU)
- [ ] Krok 2: Zaimplementowanie systemu rekomendacji filmów opartego na AI z integracją Firebase.
- [ ] Krok 3: Dodanie funkcjonalności historii rozmów i preferencji użytkownika w chatbocie dla bardziej spersonalizowanych rekomendacji.
