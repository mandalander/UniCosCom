# Unicoscom - Aplikacja społecznościowa na Next.js i Firebase

Witaj w **Unicoscom** (Unikalny Kosmos Komunikacji i Społeczności) - bogatej w funkcje aplikacji społecznościowej zbudowanej przy użyciu nowoczesnych technologii internetowych. Ten projekt służy jako punkt wyjścia do budowy własnej platformy typu Reddit, gdzie użytkownicy mogą tworzyć społeczności, publikować treści, komentować i głosować.

## ✨ Funkcje

*   **Tworzenie społeczności**: Użytkownicy mogą tworzyć własne społeczności.
*   **System postów i komentarzy**: Pełna funkcjonalność CRUD (Tworzenie, Odczyt, Aktualizacja, Usuwanie) dla postów i komentarzy.
*   **System głosowania**: Głosowanie "za" i "przeciw" na posty i komentarze.
*   **Profile użytkowników**: Publiczne profile użytkowników wyświetlające ich aktywność.
*   **Uwierzytelnianie**: Bezpieczne uwierzytelnianie użytkowników (E-mail/Hasło i Google) oparte na Firebase Auth.
*   **Aktualizacje w czasie rzeczywistym**: Synchronizacja danych w czasie rzeczywistym z Firestore.
*   **Powiadomienia**: Użytkownicy otrzymują powiadomienia o głosach na ich treści.
*   **Motywy**: Wsparcie dla trybu jasnego i ciemnego.
*   **Lokalizacja**: Wsparcie dla języka polskiego i angielskiego.

## 🚀 Stos technologiczny

*   **Framework**: [Next.js](https://nextjs.org/) (App Router)
*   **Baza danych**: [Firebase Firestore](https://firebase.google.com/docs/firestore)
*   **Uwierzytelnianie**: [Firebase Authentication](https://firebase.google.com/docs/auth)
*   **Komponenty UI**: [ShadCN UI](https://ui.shadcn.com/)
*   **Stylizacja**: [Tailwind CSS](https://tailwindcss.com/)
*   **Zarządzanie stanem**: React Context & niestandardowe Hooki
*   **Formularze**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)

## 🏁 Pierwsze kroki

Aby uruchomić projekt lokalnie, postępuj zgodnie z poniższymi instrukcjami:

### Wymagania wstępne

*   [Node.js](https://nodejs.org/) (wersja 18 lub nowsza)
*   Menedżer pakietów `npm`

### Instalacja

1.  Sklonuj repozytorium (jeśli jeszcze tego nie zrobiłeś):
    ```bash
    git clone https://github.com/twoje-repo/unicoscom.git
    cd unicoscom
    ```

2.  Zainstaluj zależności:
    ```bash
    npm install
    ```

### Uruchamianie w trybie deweloperskim

Aby uruchomić serwer deweloperski:

```bash
npm run dev
```

Aplikacja będzie dostępna pod adresem [http://localhost:3000](http://localhost:3000).

### Budowanie wersji produkcyjnej

Aby zbudować aplikację do produkcji:

```bash
npm run build
```

Następnie możesz ją uruchomić za pomocą:

```bash
npm start
```

### Linting

Aby sprawdzić kod pod kątem błędów:

```bash
npm run lint
```
