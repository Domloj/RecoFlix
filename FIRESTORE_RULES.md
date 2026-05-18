# Firebase Cloud Firestore Security Rules - RecoFlix

## Przegląd bezpieczeństwa

Poniższe reguły implementują model bezpieczeństwa oparty na **kontroli dostępu na poziomie użytkownika** i **walidacji danych**.

## Kolekcje i Reguły

### **`users/{userId}`** - Profil użytkownika

**Czynności dozwolone:**

| Operacja | Warunki | Opis |
|----------|---------|------|
| **READ** | `auth.uid == userId` | Użytkownik czyta tylko swój profil |
| **CREATE** | ❌ Zabronienie | Backend obsługuje tworzenie (Firebase Admin SDK) |
| **UPDATE** | Tylko pola: `username`, `email`, `profilePicture`, `preferences`; Pole `role` nie może zmienić | Użytkownik edytuje swoje dane, ale nie może zmienić roli |
| **DELETE** | ❌ Zabronienie | Profil nie może być usunięty przez klienta |

**Walidacje:**
- `username` - tekst, 1-50 znaków (obowiązkowe)
- `email` - tekst (opcjonalne)
- `profilePicture` - string URL (opcjonalne)
- `preferences` - mapa/obiekt (opcjonalne)
- `role` - **blokada zmian** (pozostaje `user` lub `admin` z inicjalizacji)

## Zasady Ogólne

1. **Domyślnie blokada** - `match /{document=**} { allow read, write: if false; }`
2. **Autentykacja wymagana** - Wszystkie operacje wymagają zalogowanego użytkownika (`request.auth != null`)
3. **Kontrola właściciela** - Użytkownik może edytować/usuwać tylko swoje dane (`auth.uid == userId`)
4. **Walidacja danych** - Każde pole jest walidowane na poziomie reguł
5. **Rola jest niezmienna** - Zwykły użytkownik (`user`) nie może zmienić się na administratora (`admin`)

---

## Wdrażanie

1. Przejdź do [Firebase Console](https://console.firebase.google.com/)
2. Wybierz projekt **RecoFlix**
3. Przejdź do **Firestore Database** → **Rules**
4. Zastąp istniejące reguły zawartością pliku `firestore.rules`
5. Kliknij **Publish**

```bash
# Alternatywnie, via Firebase CLI:
firebase deploy --only firestore:rules
```

---

## Testowanie Reguł

Użyj **Firebase Emulator Suite** do testowania reguł lokalnie:

```bash
firebase emulators:start --import=firestore-data
```

W Firebase Console dostępna jest też zakładka **Rules Simulator** do testowania scenariuszy.

---

## Przyszłe Rozszerzenia

Gdy będziesz dodawać nowe funkcje (np. oceny filmów, system wiadomości, listy obserwowanych), pamiętaj o:
- ✅ Definiowaniu eksplicitnych reguł dla nowych kolekcji
- ✅ Walidacji wszystkich pól wejściowych
- ✅ Stosowaniu modelu `user-owned` documents (gdzie to możliwe)
- ✅ Testowaniu reguł w Emulatorze Firestore

## Bezpieczeństwo Dodatkowo

- **Backend (FastAPI)** weryfikuje Firebase ID token w każdym żądaniu
- **Frontend** wysyła token w nagłówku `Authorization: Bearer <token>`
- **CORS** jest skonfigurowany na konkretny origin (frontend URL)
- **Rate limiting** - rozważ dodanie w następnym kroku
