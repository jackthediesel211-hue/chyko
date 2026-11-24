# CHYKO – strona + zamawianie do stolika (Vercel)

## Adresy po wdrożeniu
- `/` – strona główna Chyko
- `/stolik/5` – zamawianie dla gościa przy stoliku nr 5 (do kodów QR)
- `/kuchnia-7k3q9x` – panel kuchni (tajny link + kod PIN)

## Wdrożenie krok po kroku
1. Wgraj ten folder do nowego repozytorium na GitHub (albo w folderze uruchom `npx vercel`).
2. Vercel → **Add New → Project** → wybierz repozytorium → **Deploy**.
3. W projekcie: **Storage → Create Database → Upstash (Redis)** i podłącz do projektu.
   Vercel sam doda zmienne `KV_REST_API_URL` i `KV_REST_API_TOKEN`.
4. **Settings → Environment Variables** dodaj:
   - `KITCHEN_PIN` = `8729`
   - `AUTH_SECRET` = długi losowy ciąg znaków (np. 40 losowych liter i cyfr)
5. **Deployments → Redeploy**, żeby zmienne zaczęły działać.
6. (Opcjonalnie) **Settings → Domains** → dodaj domenę.
7. Wejdź na `/kuchnia-7k3q9x`, wpisz PIN, otwórz zakładkę **Kody QR** i wydrukuj kody
   (kody są tworzone z adresu, na którym otwarto panel, więc rób to już na docelowej domenie).

## Jak to działa
- Ceny i menu są na serwerze (`api/_lib.js`). Serwer sam liczy kwotę, więc nikt nie podmieni cen w przeglądarce.
- Kod PIN jest sprawdzany na serwerze. Po poprawnym kodzie kuchnia dostaje ciasteczko na 12 godzin.
  Po 6 błędnych próbach z jednego adresu logowanie blokuje się na 10 minut.
- Kuchnia odświeża się co 3 sekundy i gra dźwięk przy nowym zamówieniu (trzeba raz kliknąć „Włącz dźwięk”).
- Historia: dokładna data i godzina (strefa Europe/Warsaw), czas do „gotowe” i godzina wydania.
- Płatność: przy kasie lub przy stoliku, bez płatności online.

## Zmiana menu i cen
- Zamawianie: edytuj listę `MENU` w `api/_lib.js`.
- Strona główna: ceny są wpisane w `public/index.html` (osobno).

## Zmiana tajnego linku kuchni
Zmień nazwę pliku `public/kuchnia-7k3q9x.html` na inną (np. `kuchnia-abc123.html`).
Link będzie wtedy `/kuchnia-abc123`.
