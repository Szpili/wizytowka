/* Card wiring: language, contact rows, projects, pills, unicorn, toasts. */
(function () {
  "use strict";

  var P = window.PROFILE;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  var T = {
    pl: {
      title: "Karol (Szpili): wizytówka",
      langGroup: "Język strony",
      contactNav: "Kontakt i CV",
      vkAria: "Animowane oko podczas testu Voighta-Kampffa. W tęczówce odbija się kod z Matriksa.",
      vkPupil: "źrenica",
      vkHuman: "werdykt: człowiek (raczej)",
      vkReplicant: "werdykt: replikant",
      intro: ["Obudź się…", "Matrix cię ma.", "Podążaj za białym królikiem."],
      cvLabel: "Pobierz AI CV",
      cvDetail: "PDF, wersja polska",
      cvAlt: "Also in English (PDF)",
      cvAltLang: "en",
      github: "GitHub",
      email: "E-mail",
      phone: "Zadzwoń",
      whatsapp: "WhatsApp",
      linkedin: "LinkedIn",
      telegram: "Telegram",
      projects: "Projekty",
      source: "Kod tej strony",
      unicornAria: "Origami: jednorożec",
      replicantOn: "Szkoda, że nie przeżyje. Ale kto przeżyje?",
      replicantOff: "Test powtórzony. Werdykt: człowiek.",
      pillsAsk: "Którą wybierasz?",
      redAria: "Czerwona pigułka: zagraj w Łzy w deszczu",
      blueAria: "Niebieska pigułka: schowaj pigułki",
      blueToast: "Koniec historii. Budzisz się w swoim łóżku i wierzysz, w co chcesz.",
      close: "Zamknij",
      sound: "Dźwięk",
      score: "Wynik",
      best: "Rekord",
      gameTitle: "Łzy w deszczu",
      gameTag: "Nikomu nie udaje się pierwszy skok.",
      gameHow: "Biegnij po dachach w deszczu. Stuknij, kliknij albo naciśnij spację, żeby skoczyć. Przytrzymaj, żeby skoczyć wyżej, a w powietrzu skocz jeszcze raz. Omijaj agentów i ich kule, zbieraj zielone znaki.",
      gameStart: "Skacz",
      gameQuote: "Wszystkie te chwile znikną w czasie jak łzy w deszczu.",
      newRecord: "Nowy rekord.",
      again: "Jeszcze raz",
      gameHint: "Spacja albo stuknięcie: skok. Esc: wyjście.",
      dodge: "UNIK",
      unicornGot: "JEDNOROŻEC"
    },
    en: {
      title: "Karol (Szpili): contact card",
      langGroup: "Page language",
      contactNav: "Contact and CV",
      vkAria: "An animated eye during a Voight-Kampff test. Matrix code reflects in the iris.",
      vkPupil: "pupil",
      vkHuman: "verdict: human (probably)",
      vkReplicant: "verdict: replicant",
      intro: ["Wake up…", "The Matrix has you.", "Follow the white rabbit."],
      cvLabel: "Download AI CV",
      cvDetail: "PDF, English version",
      cvAlt: "Także po polsku (PDF)",
      cvAltLang: "pl",
      github: "GitHub",
      email: "Email",
      phone: "Call",
      whatsapp: "WhatsApp",
      linkedin: "LinkedIn",
      telegram: "Telegram",
      projects: "Projects",
      source: "Source of this page",
      unicornAria: "Origami unicorn",
      replicantOn: "It's too bad she won't live. But then again, who does?",
      replicantOff: "Test repeated. Verdict: human.",
      pillsAsk: "Which one do you take?",
      redAria: "Red pill: play Tears in Rain",
      blueAria: "Blue pill: hide the pills",
      blueToast: "The story ends. You wake up in your bed and believe whatever you want to believe.",
      close: "Close",
      sound: "Sound",
      score: "Score",
      best: "Best",
      gameTitle: "Tears in Rain",
      gameTag: "Nobody makes the first jump.",
      gameHow: "Run across rooftops in the rain. Tap, click or press space to jump. Hold to jump higher, and jump once more in mid-air. Dodge agents and their bullets, collect the green glyphs.",
      gameStart: "Jump",
      gameQuote: "All those moments will be lost in time, like tears in rain.",
      newRecord: "New record.",
      again: "Play again",
      gameHint: "Space or tap: jump. Esc: exit.",
      dodge: "DODGE",
      unicornGot: "UNICORN"
    }
  };

  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  var session = {
    get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  };

  var lang = store.get("wiz.lang");
  if (lang !== "pl" && lang !== "en") {
    lang = (navigator.language || "pl").toLowerCase().indexOf("pl") === 0 ? "pl" : "en";
  }
  function t(key) { return T[lang][key]; }
  function L(v) { return v && typeof v === "object" && !Array.isArray(v) ? v[lang] : v; }

  /* ---------- icons ---------- */

  var ICON = {
    github: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="6" cy="5" r="2.2"/><circle cx="6" cy="19" r="2.2"/><circle cx="18" cy="8" r="2.2"/><path d="M6 7.2v9.6M18 10.2c0 4-6 3.2-11.2 7"/></svg>',
    email: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="5.5" width="18" height="13"/><path d="m3.5 6 8.5 7 8.5-7"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6.5 3.5h3l1.5 4.5-2 1.5a12 12 0 0 0 5.5 5.5l1.5-2 4.5 1.5v3a2 2 0 0 1-2 2A16.5 16.5 0 0 1 4.5 5.5a2 2 0 0 1 2-2z"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 20l1.3-4A8.5 8.5 0 1 1 8.4 19z"/><path d="M9 9.2c.3 2.5 2.6 4.8 5.6 5.6l1.2-1.4-2-.9-1 .8a5 5 0 0 1-2.2-2.3l.8-1-.9-2z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="3" width="18" height="18"/><path d="M8 10.5V17M8 7.2v.1M11.5 17v-6.5M11.5 13.2c0-1.6 1-2.7 2.5-2.7s2.5 1 2.5 2.7V17"/></svg>',
    telegram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M21 4 3 11l6 2.2L18 7l-7 7.5V20l3.3-3.6L18 19z"/></svg>'
  };

  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    for (var k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function row(href, icon, label, detail, external) {
    var a = el("a", {
      class: "row",
      href: href,
      target: external ? "_blank" : null,
      rel: external ? "noopener" : null
    }, '<span class="ic" aria-hidden="true">' + ICON[icon] + '</span>' +
      '<span class="txt"><span class="lbl">' + esc(label) + '</span><span class="det">' + esc(detail) + "</span></span>");
    a.dataset.dyn = "1";
    return a;
  }

  function renderRows() {
    var nav = document.getElementById("actions");
    Array.prototype.slice.call(nav.querySelectorAll("[data-dyn]")).forEach(function (n) { n.remove(); });
    var c = P.contact;
    var rows = [];
    P.github.forEach(function (g) {
      rows.push(row("https://github.com/" + g.user, "github", t("github"), "@" + g.user + ": " + L(g.note), true));
    });
    if (c.email) rows.push(row("mailto:" + c.email, "email", t("email"), c.email, false));
    if (c.phone) rows.push(row("tel:" + c.phone.replace(/\s+/g, ""), "phone", t("phone"), c.phone, false));
    if (c.whatsapp) rows.push(row("https://wa.me/" + c.whatsapp, "whatsapp", t("whatsapp"), "+" + c.whatsapp, true));
    if (c.linkedin) rows.push(row(c.linkedin, "linkedin", t("linkedin"), c.linkedin.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""), true));
    if (c.telegram) rows.push(row("https://t.me/" + c.telegram, "telegram", t("telegram"), "@" + c.telegram, true));
    rows.forEach(function (r) { nav.appendChild(r); });
    bindInterest(rows);
  }

  function renderProjects() {
    var ul = document.getElementById("projects");
    ul.innerHTML = "";
    P.projects.forEach(function (p) {
      var li = el("li");
      li.appendChild(el("a", { href: L(p.url), target: "_blank", rel: "noopener" },
        '<span class="pname"><span>' + esc(p.name) + '</span><span class="host">' + esc(L(p.host)) + "</span></span>" +
        '<span class="pdesc">' + esc(L(p.desc)) + "</span>"));
      ul.appendChild(li);
    });
  }

  function applyLang() {
    document.documentElement.lang = lang;
    document.title = t("title");
    Array.prototype.forEach.call(document.querySelectorAll("[data-i18n]"), function (n) {
      var k = n.getAttribute("data-i18n");
      if (k === "role") n.textContent = L(P.role);
      else if (k === "location") n.textContent = L(P.location);
      else if (T[lang][k] != null) n.textContent = t(k);
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-i18n-aria]"), function (n) {
      n.setAttribute("aria-label", t(n.getAttribute("data-i18n-aria")));
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-i18n-title]"), function (n) {
      n.setAttribute("title", t(n.getAttribute("data-i18n-title")));
    });
    Array.prototype.forEach.call(document.querySelectorAll(".lang button"), function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-lang") === lang));
    });

    var other = lang === "pl" ? "en" : "pl";
    var cv = document.getElementById("cv-link");
    cv.href = P.cv[lang];
    cv.setAttribute("download", lang === "pl" ? "Karol-AI-CV.pdf" : "Karol-AI-CV-EN.pdf");
    var alt = document.getElementById("cv-alt");
    alt.href = P.cv[other];
    alt.setAttribute("lang", other);
    alt.setAttribute("download", other === "pl" ? "Karol-AI-CV.pdf" : "Karol-AI-CV-EN.pdf");

    renderRows();
    renderProjects();
    if (vk) vk.refresh();
    if (window.Game) Game.setText(T[lang]);
  }

  /* ---------- name decode ---------- */

  function decodeName() {
    var h = document.getElementById("name");
    var target = P.name;
    if (reduce) { h.textContent = target; return; }
    var glyphs = "01<>[]{}/\\|=+*#%";
    var start = performance.now(), dur = 700;
    function step(now) {
      var k = (now - start) / dur;
      var out = "";
      for (var i = 0; i < target.length; i++) {
        var settle = (i + 1) / target.length;
        if (k >= settle) out += esc(target[i]);
        else out += '<span class="glitch">' + esc(glyphs[Math.floor(Math.random() * glyphs.length)]) + "</span>";
      }
      h.innerHTML = out;
      if (k < 1) requestAnimationFrame(step);
      else h.textContent = target;
    }
    requestAnimationFrame(step);
  }

  /* ---------- toast ---------- */

  var toastEl = document.getElementById("toast"), toastTimer = 0;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 4200);
  }

  /* ---------- eye ---------- */

  var vk = null;
  function bindInterest(nodes) {
    nodes.forEach(function (n) {
      n.addEventListener("pointerenter", function () { if (vk) vk.setInterest(true); });
      n.addEventListener("pointerleave", function () { if (vk) vk.setInterest(false); });
      n.addEventListener("focus", function () { if (vk) vk.setInterest(true); });
      n.addEventListener("blur", function () { if (vk) vk.setInterest(false); });
    });
  }

  /* ---------- pills ---------- */

  var pills = document.getElementById("pills");
  var ask = document.getElementById("pills-ask");
  function showAsk() {
    if (session.get("wiz.asked") || pills.classList.contains("gone")) return;
    session.set("wiz.asked", "1");
    setTimeout(function () {
      ask.hidden = false;
      setTimeout(function () { ask.hidden = true; }, 4500);
    }, 1400);
  }

  document.getElementById("pill-red").addEventListener("click", function () {
    ask.hidden = true;
    if (window.Game) Game.open(this);
  });
  document.getElementById("pill-blue").addEventListener("click", function () {
    ask.hidden = true;
    pills.classList.add("gone");
    toast(t("blueToast"));
  });

  /* ---------- unicorn ---------- */

  var unicorn = document.getElementById("unicorn");
  unicorn.addEventListener("click", function () {
    var on = unicorn.getAttribute("aria-pressed") !== "true";
    unicorn.setAttribute("aria-pressed", String(on));
    if (vk) vk.setReplicant(on);
    toast(t(on ? "replicantOn" : "replicantOff"));
  });

  /* ---------- language toggle ---------- */

  Array.prototype.forEach.call(document.querySelectorAll(".lang button"), function (b) {
    b.addEventListener("click", function () {
      lang = b.getAttribute("data-lang");
      store.set("wiz.lang", lang);
      applyLang();
    });
  });

  /* ---------- boot ---------- */

  var primary = document.getElementById("cv-link");
  bindInterest([primary, document.getElementById("cv-alt")]);
  primary.addEventListener("click", function () { if (vk) vk.flash(); });

  var sky = window.Sky ? Sky.mount(document.getElementById("sky")) : null;

  // While the game is open the card underneath sleeps and is hidden from assistive tech.
  document.addEventListener("wiz:game", function (e) {
    var open = e.detail.open;
    document.querySelector("main").inert = open;
    pills.inert = open;
    if (sky) { if (open) sky.pause(); else sky.resume(); }
    if (vk) { if (open) vk.pause(); else vk.resume(); }
  });
  if (window.Game) Game.init({ text: function (k) { return t(k); } });

  applyLang();

  if (window.VK) {
    vk = VK.create(document.getElementById("vk"), {
      text: t,
      onOpen: function () { decodeName(); showAsk(); }
    });
    if (vk.introDone()) showAsk();
  }
})();
