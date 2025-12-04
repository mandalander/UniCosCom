# UniCosCom - Nowoczesna Platforma Społecznościowa

**UniCosCom** (Unikalny Kosmos Komunikacji i Społeczności) to zaawansowana aplikacja społecznościowa zbudowana przy użyciu najnowszych technologii webowych. Platforma łączy funkcjonalność Reddit z nowoczesnym, eleganckim interfejsem użytkownika.

🌐 **Demo na żywo**: [uni-cos-com.vercel.app](https://uni-cos-com.vercel.app)

## ✨ Kluczowe Funkcje

### 🎨 Nowoczesny Design
- **Animowane Logo SVG**: Interaktywne logo z efektami 3D, animowanymi gradientami, orbitami i planetami
- **Glassmorphism UI**: Nowoczesne efekty szkła i rozmazania
- **Motyw Ciemny/Jasny**: Pełne wsparcie dla trybów jasnego i ciemnego
- **Responsive Design**: Doskonałe działanie na wszystkich urządzeniach
- **Gradient Branding**: Spójny system kolorów cyjan-niebieski-fiolet

### 👥 Społeczności
- **Tworzenie społeczności**: Użytkownicy mogą zakładać własne społeczności
- **Zarządzanie społecznościami**: Panel moderacji dla twórców
- **Moje społeczności**: Dedykowana strona z zakładkami:
  - "Dołączone" - społeczności do których dołączyłeś
  - "Utworzone" - społeczności które sam utworzyłeś
- **Dołączanie/Opuszczanie**: Łatwe zarządzanie członkostwem

### 📝 Posty i Komentarze
- **Tworzenie postów**: Bogaty edytor z obsługą społeczności
- **System komentarzy**: Wielopoziomowe komentarze z edycją
- **Wyświetlanie**: Responsywne karty postów z podglądem
- **Edycja/Usuwanie**: Pełna kontrola nad własnymi treściami

### 👍 Reakcje i Głosowanie
- **System głosowania**: Upvote/downvote dla postów i komentarzy z animacjami
- **Emoji Reactions**: Pełny system reakcji emoji (❤️ 😂 😮 😢 😡 👍)
- **Who Reacted Modal**: Zobacz kto zareagował na post/komentarz
- **Liczniki w czasie rzeczywistym**: Natychmiastowa synchronizacja

### 👤 Profile Użytkowników
- **Publiczne profile**: Wyświetlanie aktywności użytkownika
- **Edycja profilu**: Bio, lokalizacja, social media, zdjęcie profilowe
- **Posty użytkownika**: Historia wszystkich postów
- **Bezpośrednie wiadomości**: Chat 1-na-1 z innymi użytkownikami

### 🔔 Powiadomienia
- **Powiadomienia w czasie rzeczywistym**: O głosach, reakcjach, komentarzach
- **Panel powiadomień**: Centrum wszystkich powiadomień
- **Oznaczanie jako przeczytane**: Zarządzanie statusem

### 💾 Zapisane Posty
- **Zapisywanie**: Dodawaj posty do zakładek
- **Przeglądanie**: Dedykowana strona zapisanych postów
- **Usuwanie**: Łatwe zarządzanie zapisami

### 🔐 Uwierzytelnianie i Bezpieczeństwo
- **Firebase Auth**: Email/hasło i Google Sign-In
- **Bezpieczne reguły**: Firestore Security Rules
- **Zmiana hasła**: Panel ustawień bezpieczeństwa
- **Usuwanie konta**: Pełna kontrola nad danymi

### 🌍 Międzynarodowość
- **Wielojęzyczność**: Polski i angielski
- **Łatwa zmiana**: Przełącznik języka w ustawieniach
- **Pełne tłumaczenia**: Wszystkie elementy UI

### 📱 Dodatkowe Funkcje
- **Wyszukiwarka**: Globalne wyszukiwanie postów i użytkowników
- **Eksploracja**: Przeglądaj wszystkie społeczności
- **Moderacja**: Narzędzia dla moderatorów społeczności
- **Panel ustawień**: Zarządzanie kontem i preferencjami
- **PWA**: Wsparcie Progressive Web App

## 🚀 Stos Technologiczny

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router z Turbopack)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
- **Stylizacja**: [Tailwind CSS](https://tailwindcss.com/)
- **Ikony**: [Lucide React](https://lucide.dev/)
- **Formularze**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Animacje**: CSS Animations + Framer Motion

### Backend
- **Database**: [Firebase Firestore](https://firebase.google.com/docs/firestore)
- **Authentication**: [Firebase Authentication](https://firebase.google.com/docs/auth)
- **Storage**: [Firebase Storage](https://firebase.google.com/docs/storage)
- **Hosting**: [Vercel](https://vercel.com/)

### AI
- **Genkit**: [Google Genkit](https://firebase.google.com/docs/genkit) dla funkcji AI

## 🏁 Pierwsze Kroki

### Wymagania
- Node.js 18+ 
- npm lub yarn
- Konto Firebase

### Instalacja

1. **Sklonuj repozytorium**
   ```bash
   git clone https://github.com/twoje-repo/unicoscom.git
   cd unicoscom
   ```

2. **Zainstaluj zależności**
   ```bash
   npm install
   ```

3. **Skonfiguruj Firebase**
   - Utwórz projekt w [Firebase Console](https://console.firebase.google.com/)
   - Dodaj aplikację webową
   - Skopiuj konfigurację do `.env.local`:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Wdróż Firestore Rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

### Uruchomienie

**Tryb deweloperski:**
```bash
npm run dev
```
Aplikacja dostępna na [http://localhost:3000](http://localhost:3000)

**Build produkcyjny:**
```bash
npm run build
npm start
```

**Linting:**
```bash
npm run lint
```

**Type checking:**
```bash
npm run typecheck
```

## 📁 Struktura Projektu

```
src/
├── app/                    # Next.js App Router
│   ├── components/        # Komponenty React
│   ├── community/         # Strony społeczności
│   ├── profile/           # Profile użytkowników
│   ├── my-communities/   # Strona moich społeczności
│   ├── messages/          # Wiadomości
│   ├── notifications/     # Powiadomienia
│   └── ...
├── components/            # Komponenty UI (ShadCN)
├── firebase/              # Konfiguracja Firebase
├── hooks/                 # Custom React Hooks
├── lib/                   # Utilities i helpers
└── public/                # Zasoby statyczne
```

## 🎨 Highlights Designu

- **Animowane Logo**: Kosmiczne logo z orbitami, planetami i efektami blasku
- **Nowoczesne Gradienty**: Spójny system kolorów throughout
- **Smooth Animations**: Micro-interakcje dla lepszej UX
- **Glassmorphism**: Efekty przezroczystości i rozmazania
- **Dark Mode**: Pięknie zaprojektowany tryb ciemny

## 🔒 Bezpieczeństwo

- Firestore Security Rules dla ochrony danych
- Firebase Auth dla bezpiecznego logowania  
- Walidacja danych po stronie klienta i serwera
- Rate limiting dla API
- Sanityzacja input użytkownika

## 📈 Roadmap

- [ ] Integracja AI dla moderacji treści
- [ ] Webowe notyfikacje push
- [ ] Streaming wideo na żywo
- [ ] Rozbudowany system raportowania
- [ ] Analytics dashboard
- [ ] API publiczne

## 🤝 Wkład

Projekt otwarty na współpracę! Wszystkie pull requesty mile widziane.

## 📄 Licencja

MIT License - szczegóły w pliku LICENSE

## 🙏 Podziękowania

- Next.js team za świetny framework
- Firebase za backend infrastructure
- ShadCN za piękne komponenty UI
- Społeczność open source

---

**Zbudowane z ❤️ używając Next.js i Firebase**
