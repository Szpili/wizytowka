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

## Joi: terminal i telefon

Joi odbiera wiadomości w terminalu (przycisk „Napisz do Joi”) i przez telefon (słuchawka w lewym dolnym rogu, rozpoznawanie mowy w Chrome i Safari). Bez serwera działa automat: zbiera temat, kontakt i imię, a wiadomość oddaje jako gotowy e-mail. Z serwerem rozmawia na żywo lokalny model, a każda rozmowa ma transkrypcję.

Serwer-przekaźnik to jeden plik bez zależności, Node 18+. Model: Ollama albo dowolny serwer zgodny z OpenAI (vLLM, llama.cpp, LM Studio), API wykrywane samo.

```bash
git clone https://github.com/Szpili/wizytowka.git ~/wizytowka && cd ~/wizytowka
cp server/joi.env.example server/joi.env   # LLM_URL, MODEL, TRANSCRIPT_DIR, Telegram
set -a; . server/joi.env; set +a
node server/joi-relay.mjs
```

Wystaw go po HTTPS i wpisz adres w `assets/js/profile.js` → `bot.endpoint` (bez ukośnika na końcu):

```bash
tailscale funnel --bg 8787          # https://<host>.<tailnet>.ts.net
# albo
cloudflared tunnel --url http://127.0.0.1:8787
```

Głos w telefonie: domyślnie głos systemowy przeglądarki. Własny głos daje `TTS_URL` (serwer w stylu OpenAI, np. Kokoro-FastAPI) albo `TTS_CMD` (np. piper z wybranym modelem głosu); przeglądarka sama przełączy się na serwer.

Transkrypcje: `TRANSCRIPT_DIR/<sesja>.md`, wiadomości dodatkowo w `leads.jsonl`. `TELEGRAM_BOT_TOKEN` i `TELEGRAM_CHAT_ID` dają powiadomienie o każdej wiadomości. Limity: 30 wiadomości na 10 minut i 5 zgłoszeń na godzinę z jednego adresu.

Usługa systemd (`~/.config/systemd/user/joi.service`):

```ini
[Service]
WorkingDirectory=%h/wizytowka
EnvironmentFile=%h/wizytowka/server/joi.env
ExecStart=/usr/bin/node server/joi-relay.mjs
Restart=on-failure
[Install]
WantedBy=default.target
```

## Sekrety

- Czerwona pigułka uruchamia grę, a niebieska chowa obie pigułki.
- Origami jednorożec w stopce przełącza tryb replikanta.
- W terminalu działają komendy: kontakt, zadzwoń, wyjdź.

Fonty: VT323, Chakra Petch i DotGothic16 na licencji SIL OFL 1.1 (`assets/fonts/OFL.txt`).
