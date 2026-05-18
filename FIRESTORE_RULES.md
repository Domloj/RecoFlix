# Firebase Cloud Firestore Security Rules - RecoFlix

## Przegląd bezpieczeństwa

Poniższe reguły implementują model bezpieczeństwa oparty na **kontroli dostępu na poziomie użytkownika** i **walidacji danych**.

## Kolekcje i Reguły

### **`users/{userId}`** - Profil użytkownika

**Czynności dozwolone:**

| Operacja | Warunki | Opis |
|----------|---------|------|
| **READ** | `auth.uid == userId` | Użytkownik czyta tylko swój profil |
| **CREATE** | `request.auth != null && request.auth.uid == userId` | Zalogowany użytkownik może utworzyć własny dokument profilu |
| **UPDATE** | Administrator może aktualizować także `role`; właściciel dokumentu może aktualizować tylko dozwolone pola: `username`, `email`, `profilePicture`, `preferences`, `role`, `createdAt` | Reguły rozróżniają uprawnienia administratora i właściciela dokumentu |
| **DELETE** | Tylko administrator | Usunięcie profilu przez klienta jest dozwolone wyłącznie dla administratora |

**Walidacje:**
- `username` - tekst, 1-50 znaków (obowiązkowe)
- `email` - tekst (opcjonalne)
- `profilePicture` - string URL (opcjonalne)
- `preferences` - mapa/obiekt (opcjonalne)
- `role` - pole podlega ograniczeniom reguł; administrator może je aktualizować, a dokumentacja musi być zgodna z dopuszczonymi kluczami w `firestore.rules`
- `createdAt` - pole uwzględnione w dozwolonych kluczach dla aktualizacji własnego dokumentu

## Zasady Ogólne

1. **Domyślnie blokada** - `match /{document=**} { allow read, write: if false; }`
2. **Autentykacja wymagana** - Operacje modyfikujące wymagają zalogowanego użytkownika (`request.auth != null`)
3. **Kontrola właściciela** - Użytkownik może czytać i modyfikować własny dokument zgodnie z ograniczeniami reguł (`auth.uid == userId`)
4. **Uprawnienia administratora** - Administrator ma szersze uprawnienia, w tym aktualizację `role` i usuwanie dokumentów użytkowników
5. **Walidacja danych** - Każde pole jest walidowane na poziomie reguł
6. **Rola nie jest dowolnie zmienialna przez zwykłego użytkownika** - Uprawnienia do zmiany `role` wynikają z warunków w `firestore.rules`, a nie z samego klienta

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
