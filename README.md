# wizytowka

Wizytówka Karola (Szpili) w klimacie Matriksa i Łowcy androidów: AI CV w PDF (PL i EN) i ukryta gra „Łzy w deszczu”.

Adres: https://szpili.github.io/wizytowka/

## Edycja danych

Wszystkie dane są w `assets/js/profile.js`: kontakt, projekty i treść CV. Puste pole kontaktu ukrywa przycisk (`phone`, `whatsapp`, `linkedin`, `telegram`).

## Przebudowa CV, QR i obrazka OG

```bash
cd tools
npm install
npm run build
```

Wynik: `cv/karol-ai-cv-pl.pdf`, `cv/karol-ai-cv-en.pdf`, `assets/qr-wizytowka.svg` (QR do druku), `assets/og.png`.
Gdy tekst nie zmieści się na jednej stronie A4, skrypt to zgłosi.

## Publikacja

Settings → Pages → Build and deployment → Deploy from a branch → `main`, folder `/ (root)`.

## Podgląd lokalny

```bash
python3 -m http.server 8080
```

Stronę trzeba otworzyć przez HTTP. Przez `file://` przeglądarka nie załaduje fontów.

## Sekrety

- Czerwona pigułka uruchamia grę, a niebieska chowa obie pigułki.
- Origami jednorożec w stopce przełącza tryb replikanta.

Fonty: VT323, Chakra Petch i DotGothic16 na licencji SIL OFL 1.1 (`assets/fonts/OFL.txt`).
