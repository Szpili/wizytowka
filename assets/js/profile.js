/*
 * Wszystkie dane wizytówki i CV w jednym miejscu.
 * Puste pole kontaktu = przycisk się nie pokazuje.
 * Po zmianie danych CV: `npm run build` w katalogu tools/ (patrz README).
 */
window.PROFILE = {
  name: "Karol",
  fullName: "Karol Szubert",
  handle: "Szpili",
  location: { pl: "Polska", en: "Poland" },
  title: { pl: "Twórca systemów AI", en: "AI systems builder" },
  role: {
    pl: "Buduję systemy AI, które da się sprawdzić: weryfikowalną inferencję LLM, odpowiedzi oparte na źródłach i agentów, z których ludzie naprawdę korzystają.",
    en: "I build AI systems you can check: verifiable LLM inference, source-grounded answers, and agents people actually use."
  },

  siteUrl: "https://szpili.github.io/wizytowka/",
  repoUrl: "https://github.com/Szpili/wizytowka",
  cv: { pl: "cv/karol-ai-cv-pl.pdf", en: "cv/karol-ai-cv-en.pdf" },

  // Asystentka na wizytówce. endpoint = adres serwera z server/joi-relay.mjs (https, bez ukośnika na końcu).
  // Pusty endpoint = tryb automatu z wiadomością przez e-mail.
  bot: {
    name: "Joi",
    endpoint: ""
  },

  contact: {
    email: "kontakt@weryta.pl",
    phone: "+48 606 493 220",
    whatsapp: "",  // same cyfry, np. "48600000000"
    linkedin: "https://www.linkedin.com/in/karol-szubert-b30797235/",
    telegram: ""   // nazwa bez @
  },

  github: [
    { user: "Szpili", note: { pl: "projekty i badania", en: "projects and research" } },
    { user: "Szpilmenik", note: { pl: "narzędzia AI", en: "AI tooling" } }
  ],

  // Krótka lista na wizytówce.
  projects: [
    {
      name: "SIMON",
      url: "https://github.com/Szpili/SIMON",
      host: "github.com",
      desc: {
        pl: "Weryfikowalna inferencja LLM na niezaufanym sprzęcie: każde zadanie kończy się pokwitowaniem podpisanym Ed25519, które sprawdzisz offline.",
        en: "Verifiable LLM inference on untrusted hardware: every job ends with an Ed25519-signed receipt you can check offline."
      }
    },
    {
      name: "Weryta",
      url: { pl: "https://weryta.pl/pl/", en: "https://weryta.pl/" },
      host: "weryta.pl",
      desc: {
        pl: "Odpowiedzi AI oparte na zweryfikowanych źródłach. Oceny trafiają do ledgera append-only, nigdy do bazy faktów.",
        en: "AI answers grounded in verified sources. Ratings land in an append-only ledger, never in the fact store."
      }
    },
    {
      name: "deepseek-workers",
      url: "https://github.com/Szpilmenik/deepseek-workers",
      host: "github.com",
      desc: {
        pl: "Plugin do Claude Code: zadania mechaniczne idą do DeepSeek V4 za grosze, osąd zostaje przy Claude.",
        en: "Claude Code plugin: mechanical tasks go to DeepSeek V4 for cents, judgment stays with Claude."
      }
    },
    {
      name: "HighScanner",
      url: "https://highscanner.pl",
      host: "highscanner.pl",
      desc: {
        pl: "Ceny medycznej marihuany w polskich aptekach: OCR paragonów, apka na Androida, bot na Telegramie.",
        en: "Medical cannabis prices across Polish pharmacies: receipt OCR, an Android app, a Telegram bot."
      }
    },
    {
      name: "Skola",
      url: { pl: "https://szpili.github.io/skola-pl/", en: "https://skola.weryta.com/" },
      host: { pl: "szpili.github.io", en: "skola.weryta.com" },
      desc: {
        pl: "Ocena zajęć na dwóch osiach: ile się nauczyłem i czy mi się podobało. Jedno stuknięcie, bez konta.",
        en: "Class feedback on two axes: how much I learned and whether I liked it. One tap, no account."
      }
    }
  ],

  // Pełna treść CV (PDF). Tylko fakty z publicznych projektów.
  cvContent: {
    pl: {
      summary:
        "Projektuję i wdrażam systemy AI, które da się sprawdzić: rozproszoną inferencję LLM z podpisanymi pokwitowaniami, odpowiedzi oparte na źródłach, agentów w Claude Code i automatyzacje zbierające dane z prawdziwego świata. Mierzę, zanim coś obiecam, i piszę wprost, czego system nie dowodzi.",
      projects: [
        {
          name: "SIMON",
          link: "github.com/Szpili/SIMON",
          lead: "Weryfikowalna inferencja LLM na niezaufanym, różnorodnym sprzęcie.",
          points: [
            "Sieć P2P w Rust (libp2p, CBOR) rozsyła zadania do węzłów, których nikt centralnie nie kontroluje. Każde zadanie daje pokwitowanie podpisane Ed25519.",
            "Audyt to jeden forward pass: zmierzony koszt 2,4–9,9% zadania (mediana 7,4%). Pokwitowanie z RTX 3090 zweryfikowane offline na MacBooku z 2012 roku."
          ],
          tags: "Rust / libp2p / Ed25519 / vLLM / llama.cpp / weryfikacja inferencji"
        },
        {
          name: "Weryta i seventh-state",
          link: "weryta.pl",
          lead: "Odpowiedzi AI oparte na źródłach i słownik ocen twierdzeń.",
          points: [
            "Odpowiedź ma etykietę zgodności ze źródłem (np. ENTAILED) i cytowanie, na przykład z Dziennika Ustaw. Baza faktów zmienia się tylko po zweryfikowanym dowodzie.",
            "Prawdziwość, ujęcie i odczucie to osobne osie, a „nie wiem” jest pełnoprawną odpowiedzią. Interfejs Fairy Dice zapisuje oceny w ledgerze append-only."
          ],
          tags: "entailment / weryfikacja źródeł / ledger append-only / PL i EN"
        },
        {
          name: "deepseek-workers",
          link: "github.com/Szpilmenik/deepseek-workers",
          lead: "Plugin do Claude Code, który oddaje pracę mechaniczną modelom DeepSeek V4.",
          points: [
            "Wrapper dsclaude uruchamia claude -p na endpoincie zgodnym z API Anthropic, a reguła routingu w CLAUDE.md kieruje tam proste partie każdej sesji i subagenta."
          ],
          tags: "Claude Code / pluginy i skille / DeepSeek API / routing kosztowy"
        },
        {
          name: "HighScanner",
          link: "highscanner.pl",
          lead: "Porównywarka cen medycznej marihuany w polskich aptekach.",
          points: [
            "Ceny z paragonów od pacjentów (OCR) i z publicznych źródeł, apka na Androida, bot na Telegramie. Strona w Next.js 16 i Tailwind CSS 4 na Vercelu."
          ],
          tags: "scrapery / OCR / Android / Telegram / Next.js"
        },
        {
          name: "Skola",
          link: "skola.weryta.com",
          lead: "Ocena zajęć na dwóch osiach zamiast jednej gwiazdki.",
          points: [
            "Jedno stuknięcie w kwadrat 5×5, bez konta, z jednorazowym żetonem głosu. Kody QR dla nauczycieli, backend PHP i MySQL."
          ],
          tags: "PHP / MySQL / QR / prywatność / i18n"
        }
      ],
      other: [
        { name: "patoshi-forensics", text: "reanaliza bloków Bitcoina 0–70 000; popularna metoda nonce ma próg 19,53% fałszywych trafień." },
        { name: "claude-desktop-ivy-bridge", text: "Claude Desktop na Macach sprzed Haswella (SIGILL, shim Mach-O)." },
        { name: "codex-intel-rebuilder", text: "aplikacja Codex przepakowana na Intel Maca (Electron x64)." },
        { name: "Mikrobotech AI", text: "prywatny asystent AI z dostępem OAuth 2.0 do usług Google." }
      ],
      skills: [
        { group: "AI i LLM", items: "Claude Code (pluginy, skille, subagenci), API Anthropic, DeepSeek, vLLM, llama.cpp, Ollama, embeddingi, weryfikacja inferencji i odpowiedzi, routing między modelami" },
        { group: "Systemy rozproszone", items: "Rust, libp2p (gossipsub, request/response), podpisy Ed25519, CBOR, inferencja na GPU (CUDA) i CPU" },
        { group: "Web i aplikacje", items: "TypeScript, React, Next.js, Tailwind CSS, Electron, HTML, CSS i JavaScript bez frameworka, PHP, MySQL" },
        { group: "Dane i automatyzacja", items: "Python, analiza danych z łańcucha bloków, scrapery, OCR, boty na Telegramie, OAuth 2.0, API Google" },
        { group: "Infrastruktura", items: "Linux, macOS (Mach-O, launchd), Git i GitHub, GitHub Pages, Vercel, Cloudflare, Tailscale" }
      ],
      principles: [
        "Tylko zweryfikowany dowód zmienia to, w co system wierzy.",
        "Mierzę, zanim obiecam. Tezę, której dane nie bronią, wycofuję.",
        "Tani model do mechaniki, mocny model do osądu.",
        "Oddzielam to, co prawdziwe, od tego, co się podoba."
      ],
      languages: [
        "polski: ojczysty",
        "angielski: swobodnie, także w dokumentacji technicznej"
      ]
    },
    en: {
      summary:
        "I design and ship AI systems you can check: distributed LLM inference with signed receipts, source-grounded answers, agents inside Claude Code, and automations that pull data from the real world. I measure before I promise and state plainly what a system does not prove.",
      projects: [
        {
          name: "SIMON",
          link: "github.com/Szpili/SIMON",
          lead: "Verifiable LLM inference on untrusted, heterogeneous hardware.",
          points: [
            "A Rust P2P network (libp2p, CBOR) dispatches jobs to nodes nobody controls centrally. Every job produces an Ed25519-signed receipt.",
            "An audit is one forward pass, measured at 2.4–9.9% of the job (median 7.4%). A receipt from an RTX 3090 was verified offline on a 2012 MacBook."
          ],
          tags: "Rust / libp2p / Ed25519 / vLLM / llama.cpp / inference verification"
        },
        {
          name: "Weryta and seventh-state",
          link: "weryta.pl",
          lead: "Source-grounded AI answers and a rating vocabulary for claims.",
          points: [
            "Each answer carries a label for how it relates to its source (e.g. ENTAILED) and a citation, for example from the Polish Journal of Laws. The fact store changes only on verified evidence.",
            "Veracity, framing and feeling are separate axes, and \"I don't know\" is a first-class answer. The Fairy Dice interface stores ratings in an append-only ledger."
          ],
          tags: "entailment / source verification / append-only ledger / PL and EN"
        },
        {
          name: "deepseek-workers",
          link: "github.com/Szpilmenik/deepseek-workers",
          lead: "A Claude Code plugin that hands mechanical work to DeepSeek V4 models.",
          points: [
            "The dsclaude wrapper runs claude -p against an Anthropic-compatible endpoint, and a routing rule in CLAUDE.md sends simple chunks of every session and subagent there."
          ],
          tags: "Claude Code / plugins and skills / DeepSeek API / cost routing"
        },
        {
          name: "HighScanner",
          link: "highscanner.pl",
          lead: "A price tracker for medical cannabis in Polish pharmacies.",
          points: [
            "Prices from patients' receipts (OCR) and public sources, an Android app and a Telegram bot. Website in Next.js 16 and Tailwind CSS 4 on Vercel."
          ],
          tags: "scrapers / OCR / Android / Telegram / Next.js"
        },
        {
          name: "Skola",
          link: "skola.weryta.com",
          lead: "Class feedback on two axes instead of a single star.",
          points: [
            "One tap on a 5×5 square, no account, a one-time vote token. QR codes for teachers, a PHP and MySQL backend."
          ],
          tags: "PHP / MySQL / QR / privacy / i18n"
        }
      ],
      other: [
        { name: "patoshi-forensics", text: "a reanalysis of Bitcoin blocks 0–70,000; the popular nonce method has a 19.53% false-positive floor." },
        { name: "claude-desktop-ivy-bridge", text: "Claude Desktop on pre-Haswell Macs (SIGILL, a Mach-O shim)." },
        { name: "codex-intel-rebuilder", text: "the Codex desktop app repackaged for Intel Macs (x64 Electron)." },
        { name: "Mikrobotech AI", text: "a private AI assistant with OAuth 2.0 access to Google services." }
      ],
      skills: [
        { group: "AI and LLMs", items: "Claude Code (plugins, skills, subagents), Anthropic API, DeepSeek, vLLM, llama.cpp, Ollama, embeddings, inference and answer verification, routing work between models" },
        { group: "Distributed systems", items: "Rust, libp2p (gossipsub, request/response), Ed25519 signatures, CBOR, GPU (CUDA) and CPU inference" },
        { group: "Web and apps", items: "TypeScript, React, Next.js, Tailwind CSS, Electron, framework-free HTML, CSS and JavaScript, PHP, MySQL" },
        { group: "Data and automation", items: "Python, blockchain data analysis, scrapers, OCR, Telegram bots, OAuth 2.0, Google APIs" },
        { group: "Infrastructure", items: "Linux, macOS (Mach-O, launchd), Git and GitHub, GitHub Pages, Vercel, Cloudflare, Tailscale" }
      ],
      principles: [
        "Only verified evidence changes what the system believes.",
        "Measure before promising. Withdraw any claim the data cannot defend.",
        "A cheap model for mechanics, a strong model for judgment.",
        "Keep what is true apart from what is liked."
      ],
      languages: [
        "Polish: native",
        "English: fluent, including technical writing"
      ]
    }
  }
};
