/*
 * Wszystkie dane wizytówki i CV w jednym miejscu.
 * Puste pole kontaktu = przycisk się nie pokazuje.
 * Po zmianie danych CV: `npm run build` w katalogu tools/ (patrz README).
 */
window.PROFILE = {
  name: "Karol",
  handle: "Szpili",
  location: { pl: "Polska", en: "Poland" },
  title: { pl: "Twórca systemów AI", en: "AI systems builder" },
  role: {
    pl: "Buduję systemy AI: agentów, weryfikację odpowiedzi modeli i automatyzacje, z których ludzie naprawdę korzystają.",
    en: "I build AI systems: agents, verification of model answers, and automations people actually use."
  },

  siteUrl: "https://szpili.github.io/wizytowka/",
  repoUrl: "https://github.com/Szpili/wizytowka",
  cv: { pl: "cv/karol-ai-cv-pl.pdf", en: "cv/karol-ai-cv-en.pdf" },

  contact: {
    email: "kontakt@weryta.pl",
    phone: "",     // np. "+48 600 000 000"
    whatsapp: "",  // same cyfry, np. "48600000000"
    linkedin: "",  // pełny adres profilu
    telegram: ""   // nazwa bez @
  },

  github: [
    { user: "Szpili", note: { pl: "strony i produkty", en: "sites and products" } },
    { user: "Szpilmenik", note: { pl: "narzędzia AI", en: "AI tooling" } }
  ],

  // Krótka lista na wizytówce.
  projects: [
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
        "Projektuję i wdrażam systemy, w których modele językowe robią coś pożytecznego i sprawdzalnego: agentów pracujących w Claude Code, weryfikację odpowiedzi AI względem źródeł oraz automatyzacje, które zbierają dane z prawdziwego świata (scrapery, OCR, boty). Prowadzę projekty od pomysłu do działającego produktu: backend, frontend, infrastruktura i dokumentacja po polsku i angielsku.",
      projects: [
        {
          name: "Weryta",
          link: "weryta.pl",
          lead: "System odpowiedzi AI opartych na źródłach.",
          points: [
            "Odpowiedź ma etykietę zgodności ze źródłem (np. ENTAILED) i cytowanie, na przykład z Dziennika Ustaw. Baza faktów zmienia się tylko po zweryfikowanym dowodzie.",
            "Fairy Dice (physix.weryta.pl): ocena w 1–2 kliknięcia na dwóch osiach, prawda i odczucie, zapisywana w ledgerze append-only."
          ],
          tags: "weryfikacja źródeł / entailment / ledger append-only / PL i EN"
        },
        {
          name: "deepseek-workers",
          link: "github.com/Szpilmenik/deepseek-workers",
          lead: "Plugin do Claude Code, który oddaje pracę mechaniczną modelom DeepSeek V4.",
          points: [
            "Wrapper dsclaude uruchamia claude -p na endpoincie zgodnym z API Anthropic, więc DeepSeek ma pełne narzędzia agenta.",
            "Reguła routingu w CLAUDE.md kieruje proste partie każdej sesji i subagenta do tańszego modelu. Skill instalacyjny kończy się testem end-to-end."
          ],
          tags: "Claude Code / pluginy i skille / DeepSeek API / routing kosztowy"
        },
        {
          name: "HighScanner",
          link: "highscanner.pl",
          lead: "Porównywarka cen medycznej marihuany w polskich aptekach.",
          points: [
            "Ceny z paragonów od pacjentów (OCR) i z publicznych źródeł. Zdjęcia z PESEL-em lub numerem recepty są odrzucane.",
            "Apka na Androida, bot na Telegramie i społeczność na Discordzie. Strona w Next.js 16 i Tailwind CSS 4 na Vercelu."
          ],
          tags: "scrapery / OCR / Android / Telegram / Next.js"
        },
        {
          name: "Skola",
          link: "skola.weryta.com",
          lead: "Ocena zajęć na dwóch osiach zamiast jednej gwiazdki.",
          points: [
            "Jedno stuknięcie w kwadrat 5×5: ile się nauczyłem i czy mi się podobało. Bez konta, z jednorazowym żetonem głosu, kody QR dla nauczycieli, backend PHP i MySQL."
          ],
          tags: "PHP / MySQL / QR / prywatność / i18n"
        },
        {
          name: "Mikrobotech AI",
          link: "projekt prywatny",
          lead: "Osobisty asystent AI dla jednego użytkownika.",
          points: [
            "Klient OAuth 2.0 z dostępem do Kalendarza Google, Gmaila, Dysku i Kontaktów, działający na własnej maszynie."
          ],
          tags: "OAuth 2.0 / Google Workspace API / agent"
        },
        {
          name: "Baza wiedzy dla agentów",
          link: "projekt prywatny",
          lead: "Wspólna pamięć dla kilku agentów AI.",
          points: [
            "Synchronizacja między urządzeniami, nocna destylacja faktów, wyszukiwanie semantyczne na lokalnych embeddingach (Ollama) i przenośne skille z oceną ryzyka."
          ],
          tags: "Python / Ollama / embeddingi / RAG"
        }
      ],
      skills: [
        { group: "AI i LLM", items: "Claude Code (pluginy, skille, subagenci), API Anthropic, DeepSeek, Ollama, embeddingi i wyszukiwanie semantyczne, weryfikacja odpowiedzi, routing zadań między modelami" },
        { group: "Web", items: "TypeScript, React, Next.js, Tailwind CSS, HTML, CSS i JavaScript bez frameworka, PHP, MySQL" },
        { group: "Automatyzacja i dane", items: "Python, scrapery, OCR, boty na Telegramie, OAuth 2.0, API Google" },
        { group: "Infrastruktura", items: "Linux, Git i GitHub, GitHub Pages, Vercel, Cloudflare, Tailscale, Syncthing, cron i systemd" }
      ],
      principles: [
        "Tylko zweryfikowany dowód zmienia to, w co system wierzy.",
        "Pomyłka to nowy rekord, nigdy edycja.",
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
        "I design and ship systems where language models do something useful and checkable: agents that work inside Claude Code, verification of AI answers against sources, and automations that pull data from the real world (scrapers, OCR, bots). I take projects from an idea to a working product: backend, frontend, infrastructure, and docs in Polish and English.",
      projects: [
        {
          name: "Weryta",
          link: "weryta.pl",
          lead: "A system of source-grounded AI answers.",
          points: [
            "Each answer carries a label for how it relates to its source (e.g. ENTAILED) and a citation, for example from the Polish Journal of Laws. The fact store changes only on verified evidence.",
            "Fairy Dice (physix.weryta.com): a 1–2 click rating on two axes, truth and feeling, stored in an append-only ledger."
          ],
          tags: "source verification / entailment / append-only ledger / PL and EN"
        },
        {
          name: "deepseek-workers",
          link: "github.com/Szpilmenik/deepseek-workers",
          lead: "A Claude Code plugin that hands mechanical work to DeepSeek V4 models.",
          points: [
            "The dsclaude wrapper runs claude -p against an Anthropic-compatible endpoint, so DeepSeek gets the full agent toolset.",
            "A routing rule in CLAUDE.md sends simple chunks of every session and subagent to the cheaper model. The setup skill ends with a live end-to-end test."
          ],
          tags: "Claude Code / plugins and skills / DeepSeek API / cost routing"
        },
        {
          name: "HighScanner",
          link: "highscanner.pl",
          lead: "A price tracker for medical cannabis in Polish pharmacies.",
          points: [
            "Prices come from patients' receipts (OCR) and public sources. Photos showing a national ID or prescription number are rejected.",
            "An Android app, a Telegram bot and a Discord community. Website in Next.js 16 and Tailwind CSS 4 on Vercel."
          ],
          tags: "scrapers / OCR / Android / Telegram / Next.js"
        },
        {
          name: "Skola",
          link: "skola.weryta.com",
          lead: "Class feedback on two axes instead of a single star.",
          points: [
            "One tap on a 5×5 square: how much I learned and whether I liked it. No account, a one-time vote token, QR codes for teachers, a PHP and MySQL backend."
          ],
          tags: "PHP / MySQL / QR / privacy / i18n"
        },
        {
          name: "Mikrobotech AI",
          link: "private project",
          lead: "A personal, single-user AI assistant.",
          points: [
            "An OAuth 2.0 client with access to Google Calendar, Gmail, Drive and Contacts, running on its owner's machine."
          ],
          tags: "OAuth 2.0 / Google Workspace APIs / agent"
        },
        {
          name: "Knowledge base for agents",
          link: "private project",
          lead: "Shared memory for several AI agents.",
          points: [
            "Sync across devices, a nightly fact distiller, semantic search on local embeddings (Ollama) and portable agent skills with a risk rating."
          ],
          tags: "Python / Ollama / embeddings / RAG"
        }
      ],
      skills: [
        { group: "AI and LLMs", items: "Claude Code (plugins, skills, subagents), Anthropic API, DeepSeek, Ollama, embeddings and semantic search, answer verification, routing work between models" },
        { group: "Web", items: "TypeScript, React, Next.js, Tailwind CSS, framework-free HTML, CSS and JavaScript, PHP, MySQL" },
        { group: "Automation and data", items: "Python, scrapers, OCR, Telegram bots, OAuth 2.0, Google APIs" },
        { group: "Infrastructure", items: "Linux, Git and GitHub, GitHub Pages, Vercel, Cloudflare, Tailscale, Syncthing, cron and systemd" }
      ],
      principles: [
        "Only verified evidence changes what the system believes.",
        "A mistake is a new record, never an edit.",
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
