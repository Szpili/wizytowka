/*
 * Joi: Karol's assistant on the card.
 * Text goes through Neo's terminal, voice through a Matrix-style hardline phone.
 * Three lines, picked at runtime:
 *   live   - PROFILE.bot.endpoint answers /health with a model behind it: free chat with the local model
 *   auto   - endpoint up but no model, or no endpoint at all: scripted receptionist
 *   e-mail - no endpoint reachable: the message is handed over as a prepared e-mail
 */
(function () {
  "use strict";

  var P = window.PROFILE;
  var BOT = P.bot || {};
  var NAME = BOT.name || "Joi";
  var ENDPOINT = (BOT.endpoint || "").replace(/\/+$/, "");
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;

  var S = {
    pl: {
      knock: "Puk, puk.",
      greet: "Tu " + NAME + ". Odbieram wiadomości dla Karola i przekazuję mu je słowo w słowo. O czym chcesz porozmawiać?",
      greetLive: "Tu " + NAME + ". Rozmawiasz na żywo z lokalnym modelem Karola. Pytaj o projekty albo zostaw wiadomość, a Karol się odezwie.",
      topics: ["Współpraca albo zlecenie", "Pytanie o projekt", "Coś innego"],
      askAbout: "Napisz w paru zdaniach, o co chodzi.",
      askContact: "Jak Karol ma się z tobą skontaktować? Podaj e-mail albo numer telefonu.",
      badContact: "Nie widzę tu adresu ani numeru. Spróbuj tak: imie@domena.pl albo +48 600 000 000.",
      askName: "Jak masz na imię? Jeśli wolisz nie podawać, wpisz minus.",
      summary: "Mam wszystko:",
      fTopic: "temat", fContact: "kontakt", fName: "imię",
      send: "Wysłać do Karola?",
      confirmOpts: ["Wyślij", "Popraw temat", "Popraw kontakt"],
      sending: "Wysyłam…",
      sent: "Wysłane. Karol odezwie się na {contact}. Dziękuję.",
      sentMail: "Nie mam teraz linii do Karola, więc przygotowałam e-mail z twoją wiadomością. Otwórz go i wyślij.",
      mailOpts: ["Otwórz e-mail", "Skopiuj treść"],
      copied: "Skopiowane.",
      failed: "Nie udało się wysłać. Spróbuj jeszcze raz albo napisz na " + (P.contact.email || "") + ".",
      bye: "Dziękuję. Możesz zamknąć terminal albo wziąć czerwoną pigułkę.",
      again: "Napisz, jeśli chcesz dodać coś jeszcze. Słowo „kontakt” zaczyna nową wiadomość.",
      liveDown: "Straciłam połączenie z modelem. Przechodzę na automat.",
      liveErr: "Model nie odpowiada. Spróbuj za chwilę albo zostaw kontakt.",
      leadHint: "Wpisz „kontakt”, żeby zostawić Karolowi wiadomość i namiary.",
      help: "Komendy: kontakt, zadzwoń, wyjdź.",
      unknown: "Nie rozumiem. Wybierz 1, 2 albo 3, albo napisz własnymi słowami.",
      lineLive: "linia: lokalny model Karola",
      lineAuto: "linia: automat",
      lineMail: "linia: e-mail",
      note: "Rozmowa jest zapisywana i trafia do Karola.",
      placeholder: "Napisz tutaj",
      you: "ty",
      call: "Zadzwoń",
      hangup: "Rozłącz",
      close: "Zamknij",
      callTitle: "Rozmowa z " + NAME,
      lcdCalling: "łączę…",
      lcdRinging: NAME + " dzwoni",
      lcdAnswer: "Odbierz",
      lcdListening: "słucham…",
      lcdSpeaking: NAME + " mówi…",
      lcdThinking: "myślę…",
      lcdEnded: "koniec",
      lcdNoMic: "brak mikrofonu",
      noMic: "Ta przeglądarka nie rozpoznaje mowy. Mogę mówić, ale ty pisz w terminalu.",
      micDenied: "Brak dostępu do mikrofonu. Pisz w terminalu.",
      callStart: "Połączenie z " + NAME + ". Mów po sygnale, słucham.",
      callEnd: "Rozłączone.",
      ringHint: "Dzwoni " + NAME + ". Odbierz.",
      mailSubject: "Wiadomość z wizytówki",
      cmdCall: ["zadzwoń", "zadzwon", "call"],
      cmdContact: ["kontakt", "contact"],
      cmdExit: ["wyjdź", "wyjdz", "exit", "quit"],
      cmdHelp: ["pomoc", "help", "?"],
      skip: ["-", "pomiń", "pomin", "nie", "skip"]
    },
    en: {
      knock: "Knock, knock.",
      greet: "This is " + NAME + ". I take messages for Karol and pass them on word for word. What would you like to talk about?",
      greetLive: "This is " + NAME + ". You are talking live to Karol's local model. Ask about the projects or leave a message and Karol will get back to you.",
      topics: ["Work together or a job", "A question about a project", "Something else"],
      askAbout: "Tell me in a few sentences what it is about.",
      askContact: "How should Karol reach you? Leave an email or a phone number.",
      badContact: "I can't see an address or a number there. Try name@domain.com or +48 600 000 000.",
      askName: "What is your name? Type a dash to skip.",
      summary: "I have everything:",
      fTopic: "topic", fContact: "contact", fName: "name",
      send: "Send it to Karol?",
      confirmOpts: ["Send", "Fix the topic", "Fix the contact"],
      sending: "Sending…",
      sent: "Sent. Karol will get back to you at {contact}. Thank you.",
      sentMail: "I have no line to Karol right now, so I prepared an email with your message. Open it and send it.",
      mailOpts: ["Open email", "Copy the text"],
      copied: "Copied.",
      failed: "Sending failed. Try again or write to " + (P.contact.email || "") + ".",
      bye: "Thank you. You can close the terminal or take the red pill.",
      again: "Write if you want to add anything. The word \"contact\" starts a new message.",
      liveDown: "I lost the connection to the model. Switching to the script.",
      liveErr: "The model is not answering. Try again in a moment or leave your contact.",
      leadHint: "Type \"contact\" to leave Karol a message and a way to reach you.",
      help: "Commands: contact, call, exit.",
      unknown: "I don't follow. Pick 1, 2 or 3, or say it in your own words.",
      lineLive: "line: Karol's local model",
      lineAuto: "line: script",
      lineMail: "line: email",
      note: "This conversation is recorded and goes to Karol.",
      placeholder: "Type here",
      you: "you",
      call: "Call",
      hangup: "Hang up",
      close: "Close",
      callTitle: "Call with " + NAME,
      lcdCalling: "calling…",
      lcdRinging: NAME + " calling",
      lcdAnswer: "Answer",
      lcdListening: "listening…",
      lcdSpeaking: NAME + " speaks…",
      lcdThinking: "thinking…",
      lcdEnded: "ended",
      lcdNoMic: "no microphone",
      noMic: "This browser has no speech recognition. I can speak, but please type in the terminal.",
      micDenied: "No microphone access. Please type in the terminal.",
      callStart: "Connected to " + NAME + ". Speak after the tone, I am listening.",
      callEnd: "Disconnected.",
      ringHint: NAME + " is calling. Answer.",
      mailSubject: "Message from the contact card",
      cmdCall: ["call", "zadzwoń", "zadzwon"],
      cmdContact: ["contact", "kontakt"],
      cmdExit: ["exit", "quit", "wyjdź", "wyjdz"],
      cmdHelp: ["help", "?", "pomoc"],
      skip: ["-", "skip", "no", "pomiń"]
    }
  };

  var lang = "pl";
  function t(k) { return S[lang][k]; }

  /* ---------- DOM ---------- */

  var root, log, form, input, btnClose, btnCall, lineEl, noteEl, phoneEl, nokia, lcdTop, lcdMain, lcdSoft, btnAnswer;
  var opener = null;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ---------- state ---------- */

  var line = "mail";        // live | auto | mail
  var stage = "idle";       // topic | about | contact | name | confirm | done | free
  var lead = { about: "", contact: "", name: "" };
  var history = [];         // [{role, text}] for the live model
  var session = "";
  var typing = null;        // active typewriter
  var queue = [];           // pending bot actions
  var busy = false;
  var options = [];         // clickable options currently offered
  var probe = null;
  var pending = "";         // typed before the greeting finished

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "s-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  /* ---------- typewriter ---------- */

  // Bot lines type out like the terminal in Neo's apartment. Click or Enter skips to the end.
  function say(text, done) {
    if (typing) typing.skip();
    var row = el("div", "t-bot");
    var span = el("span", "t-text");
    var cur = el("span", "t-cur");
    row.appendChild(span);
    row.appendChild(cur);
    log.appendChild(row);
    scroll();
    if (reduce) {
      span.textContent = text;
      cur.remove();
      if (done) done();
      return;
    }
    var i = 0;
    typing = {
      skip: function () {
        span.textContent = text;
        finish();
      }
    };
    function finish() {
      typing = null;
      cur.remove();
      scroll();
      if (done) done();
    }
    function step() {
      if (!typing) return;
      span.textContent = text.slice(0, ++i);
      scroll();
      if (i >= text.length) { finish(); return; }
      var ch = text[i - 1];
      var delay = ch === "." || ch === "?" || ch === "!" ? 260 : ch === "," ? 120 : 22 + Math.random() * 30;
      typing.timer = setTimeout(step, delay);
    }
    typing.timer = setTimeout(step, 180);
    typing.skipTimer = true;
    var origSkip = typing.skip;
    typing.skip = function () { clearTimeout(typing.timer); origSkip(); };
  }

  // A streamed reply: tokens arrive from the model, the terminal types them out at its own pace.
  function stream() {
    var row = el("div", "t-bot");
    var span = el("span", "t-text");
    var cur = el("span", "t-cur");
    row.appendChild(span);
    row.appendChild(cur);
    log.appendChild(row);
    var full = "", shown = 0, closed = false, timer = 0, onDone = null;
    function tick() {
      if (shown < full.length) {
        shown += reduce ? full.length : 1;
        span.textContent = full.slice(0, shown);
        scroll();
        timer = setTimeout(tick, reduce ? 0 : 18);
      } else if (closed) {
        cur.remove();
        timer = 0;
        if (onDone) onDone(full);
      } else {
        timer = 0;
      }
    }
    return {
      push: function (delta) {
        full += delta;
        if (!timer) tick();
      },
      end: function (cb) {
        closed = true;
        onDone = cb;
        if (!timer) tick();
      },
      text: function () { return full; }
    };
  }

  function echo(text) {
    var row = el("div", "t-you");
    row.appendChild(el("span", "t-prompt", "> "));
    row.appendChild(el("span", "t-text", text));
    log.appendChild(row);
    scroll();
  }

  function offer(list, onPick) {
    clearOptions();
    var box = el("div", "t-opts");
    list.forEach(function (label, i) {
      var b = el("button", "t-opt");
      b.type = "button";
      b.appendChild(el("span", "t-num", "[" + (i + 1) + "] "));
      b.appendChild(document.createTextNode(label));
      b.addEventListener("click", function () {
        clearOptions();
        echo(label);
        onPick(i, label);
      });
      box.appendChild(b);
    });
    log.appendChild(box);
    options = { list: list, pick: onPick, box: box };
    scroll();
  }

  function clearOptions() {
    if (options && options.box) options.box.remove();
    options = [];
  }

  function scroll() {
    log.scrollTop = log.scrollHeight;
  }

  // Serialize bot output so lines never type over each other.
  function run(fn) {
    queue.push(fn);
    if (!busy) next();
  }
  function next() {
    var fn = queue.shift();
    if (!fn) { busy = false; return; }
    busy = true;
    fn(next);
  }
  function sayQ(text) { run(function (d) { say(text, d); }); }

  /* ---------- line probe ---------- */

  function probeLine() {
    if (!ENDPOINT) { setLine("mail"); return Promise.resolve("mail"); }
    if (probe) return probe;
    var ctrl = "AbortController" in window ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 3500) : 0;
    probe = fetch(ENDPOINT + "/health", { signal: ctrl ? ctrl.signal : undefined, cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        clearTimeout(timer);
        var l = j && j.ok ? (j.live ? "live" : "auto") : "mail";
        setLine(l);
        return l;
      })
      .catch(function () { clearTimeout(timer); setLine("mail"); return "mail"; });
    return probe;
  }

  function setLine(l) {
    line = l;
    lineEl.textContent = t(l === "live" ? "lineLive" : l === "auto" ? "lineAuto" : "lineMail");
    lineEl.dataset.line = l;
  }

  /* ---------- scripted receptionist ---------- */

  function start() {
    log.innerHTML = "";
    history = [];
    lead = { about: "", contact: "", name: "" };
    session = uuid();
    stage = "idle";
    probeLine().then(function (l) {
      sayQ(t("knock"));
      if (l === "live") {
        sayQ(t("greetLive"));
        run(function (d) { stage = "free"; focusInput(); d(); flush(); });
      } else {
        sayQ(t("greet"));
        run(function (d) {
          stage = "topic";
          offer(t("topics"), function (i, label) {
            lead.about = label + ": ";
            stage = "about";
            sayQ(t("askAbout"));
          });
          focusInput();
          d();
          flush();
        });
      }
    });
  }

  function flush() {
    if (!pending) return;
    var p = pending;
    pending = "";
    submit(p);
  }

  function isEmail(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s); }
  function isPhone(s) { return /^\+?[\d\s().-]{7,}$/.test(s) && (s.match(/\d/g) || []).length >= 7; }

  function handleScripted(text) {
    var low = text.toLowerCase();
    if (stage === "topic") {
      var n = parseInt(low, 10);
      if (n >= 1 && n <= 3) { clearOptions(); lead.about = t("topics")[n - 1] + ": "; stage = "about"; sayQ(t("askAbout")); return; }
      if (text.length < 4) { sayQ(t("unknown")); return; }
      clearOptions();
      lead.about = text;
      stage = "contact";
      sayQ(t("askContact"));
      return;
    }
    if (stage === "about") {
      lead.about += text;
      stage = "contact";
      sayQ(t("askContact"));
      return;
    }
    if (stage === "contact") {
      var v = text.trim();
      if (!isEmail(v) && !isPhone(v)) { sayQ(t("badContact")); return; }
      lead.contact = v;
      stage = "name";
      sayQ(t("askName"));
      return;
    }
    if (stage === "name") {
      lead.name = t("skip").indexOf(low) >= 0 ? "" : text.trim();
      confirmLead();
      return;
    }
    if (stage === "confirm") {
      var k = parseInt(low, 10);
      if (k === 1) { clearOptions(); submitLead(); return; }
      if (k === 2) { clearOptions(); lead.about = ""; stage = "about"; sayQ(t("askAbout")); return; }
      if (k === 3) { clearOptions(); stage = "contact"; sayQ(t("askContact")); return; }
      sayQ(t("unknown"));
      return;
    }
    if (stage === "done") {
      sayQ(t("again"));
      return;
    }
  }

  function confirmLead() {
    stage = "confirm";
    run(function (d) {
      say(t("summary"), function () {
        var box = el("div", "t-sum");
        [["fTopic", lead.about], ["fContact", lead.contact], ["fName", lead.name || "—"]].forEach(function (f) {
          var r = el("div");
          r.appendChild(el("span", "t-key", t(f[0]) + ": "));
          r.appendChild(document.createTextNode(f[1]));
          box.appendChild(r);
        });
        log.appendChild(box);
        say(t("send"), function () {
          offer(t("confirmOpts"), function (i) {
            if (i === 0) submitLead();
            else if (i === 1) { lead.about = ""; stage = "about"; sayQ(t("askAbout")); }
            else { stage = "contact"; sayQ(t("askContact")); }
          });
          d();
        });
      });
    });
  }

  function leadBody() {
    var parts = [t("fTopic") + ": " + lead.about, t("fContact") + ": " + lead.contact];
    if (lead.name) parts.push(t("fName") + ": " + lead.name);
    return parts.join("\n");
  }

  function submitLead() {
    stage = "done";
    if (line === "mail" || !ENDPOINT) {
      sayQ(t("sentMail"));
      run(function (d) {
        offer(t("mailOpts"), function (i) {
          if (i === 0) {
            location.href = "mailto:" + P.contact.email + "?subject=" + encodeURIComponent(t("mailSubject") + (lead.name ? ": " + lead.name : "")) + "&body=" + encodeURIComponent(leadBody());
          } else if (navigator.clipboard) {
            navigator.clipboard.writeText(leadBody()).then(function () { sayQ(t("copied")); });
          }
          sayQ(t("bye"));
        });
        d();
      });
      return;
    }
    sayQ(t("sending"));
    run(function (d) {
      post("/lead", { session: session, lang: lang, name: lead.name, contact: lead.contact, about: lead.about, page: location.href })
        .then(function (ok) {
          if (ok) say(t("sent").replace("{contact}", lead.contact), function () { sayQ(t("bye")); d(); });
          else { stage = "confirm"; say(t("failed"), d); }
        });
    });
  }

  function post(path, body) {
    return fetch(ENDPOINT + path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    }).then(function (r) { return r.ok; }).catch(function () { return false; });
  }

  /* ---------- live model ---------- */

  function handleLive(text) {
    history.push({ role: "user", text: text });
    run(function (d) {
      var out = stream();
      lcd(t("lcdThinking"));
      var ctrl = "AbortController" in window ? new AbortController() : null;
      var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 90000) : 0;
      fetch(ENDPOINT + "/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ session: session, lang: lang, messages: history.slice(-20) }),
        signal: ctrl ? ctrl.signal : undefined
      }).then(function (r) {
        if (!r.ok || !r.body) throw new Error("http " + r.status);
        var reader = r.body.getReader(), dec = new TextDecoder(), buf = "";
        function pump() {
          return reader.read().then(function (res) {
            buf += dec.decode(res.value || new Uint8Array(), { stream: !res.done });
            var i;
            while ((i = buf.indexOf("\n")) >= 0) {
              var l = buf.slice(0, i).trim();
              buf = buf.slice(i + 1);
              if (!l) continue;
              var j = JSON.parse(l);
              if (j.delta) out.push(j.delta);
              if (j.error) throw new Error(j.error);
            }
            if (!res.done) return pump();
          });
        }
        return pump();
      }).then(function () {
        clearTimeout(timer);
        out.end(function (full) {
          history.push({ role: "assistant", text: full });
          if (history.length === 6) sayQ(t("leadHint"));
          speak(full);
          d();
        });
      }).catch(function () {
        clearTimeout(timer);
        out.end(function (full) {
          if (full) history.push({ role: "assistant", text: full });
          say(t("liveErr"), function () { speak(t("liveErr")); d(); });
        });
      });
    });
  }

  /* ---------- input ---------- */

  function submit(text) {
    text = text.trim();
    if (!text) return;
    if (stage === "idle") { pending = text; return; }
    if (typing) { typing.skip(); }
    var low = text.toLowerCase();
    if (t("cmdExit").indexOf(low) >= 0) { echo(text); close(); return; }
    if (t("cmdHelp").indexOf(low) >= 0) { echo(text); sayQ(t("help")); return; }
    if (t("cmdCall").indexOf(low) >= 0) { echo(text); startCall(); return; }
    if (t("cmdContact").indexOf(low) >= 0) {
      echo(text);
      clearOptions();
      lead = { about: history.filter(function (m) { return m.role === "user"; }).map(function (m) { return m.text; }).join(" | ").slice(0, 500), contact: "", name: "" };
      stage = lead.about ? "contact" : "topic";
      if (stage === "contact") sayQ(t("askContact"));
      else offer(t("topics"), function (i, label) { lead.about = label + ": "; stage = "about"; sayQ(t("askAbout")); });
      return;
    }
    if (options && options.list && options.list.length) {
      var n = parseInt(low, 10);
      if (n >= 1 && n <= options.list.length) {
        var pick = options.pick, label = options.list[n - 1];
        clearOptions();
        echo(label);
        pick(n - 1, label);
        return;
      }
    }
    echo(text);
    if (stage === "free") handleLive(text);
    else handleScripted(text);
  }

  function focusInput() {
    if (window.innerWidth > 700 || document.activeElement === input) input.focus({ preventScroll: true });
  }

  /* ---------- the hardline: voice ---------- */

  var call = null; // { rec, timer, t0, speaking, listening }

  function lcd(text) {
    if (lcdMain) lcdMain.textContent = text;
  }

  function startCall() {
    if (call) return;
    phoneEl.hidden = false;
    nokia.dataset.state = "ringing";
    lcdTop.textContent = NAME.toUpperCase();
    lcd(t("lcdCalling"));
    lcdSoft.textContent = "";
    btnCall.textContent = t("hangup");
    btnCall.setAttribute("aria-pressed", "true");
    call = { t0: 0, timer: 0, rec: null, speaking: false, listening: false };
    ring(2);
    setTimeout(function () {
      if (!call) return;
      nokia.dataset.state = "open";
      call.t0 = Date.now();
      call.timer = setInterval(clock, 1000);
      lcdTop.textContent = "00:00";
      run(function (d) {
        say(t("callStart"), function () {
          speak(t("callStart"), function () { listen(); d(); });
        });
      });
    }, reduce ? 300 : 2200);
  }

  function clock() {
    if (!call) return;
    var s = Math.floor((Date.now() - call.t0) / 1000);
    lcdTop.textContent = (s < 600 ? "0" : "") + Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60);
  }

  function endCall() {
    if (!call) return;
    var c = call;
    call = null;
    clearInterval(c.timer);
    if (c.rec) { try { c.rec.abort(); } catch (e) {} }
    if (window.speechSynthesis) speechSynthesis.cancel();
    nokia.dataset.state = "closed";
    lcd(t("lcdEnded"));
    lcdSoft.textContent = "";
    btnCall.textContent = t("call");
    btnCall.setAttribute("aria-pressed", "false");
    setTimeout(function () { if (!call) phoneEl.hidden = true; }, reduce ? 0 : 700);
    sayQ(t("callEnd"));
  }

  function listen() {
    if (!call) return;
    if (!SR) {
      lcd(t("lcdNoMic"));
      sayQ(t("noMic"));
      focusInput();
      return;
    }
    var rec = new SR();
    rec.lang = lang === "pl" ? "pl-PL" : "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    call.rec = rec;
    call.listening = true;
    lcd(t("lcdListening"));
    lcdSoft.textContent = "●";
    var finalText = "";
    rec.onresult = function (e) {
      var interim = "";
      for (var i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      lcd((finalText || interim || "").slice(-26) || t("lcdListening"));
    };
    rec.onerror = function (e) {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        lcd(t("lcdNoMic"));
        sayQ(t("micDenied"));
        call.listening = false;
        call.rec = null;
      }
    };
    rec.onend = function () {
      if (!call) return;
      call.listening = false;
      call.rec = null;
      lcdSoft.textContent = "";
      var text = finalText.trim();
      if (text) submit(text);
      else if (!call.speaking) setTimeout(listen, 300);
    };
    try { rec.start(); } catch (e) { lcd(t("lcdNoMic")); }
  }

  function pickVoice() {
    if (!window.speechSynthesis) return null;
    var want = lang === "pl" ? "pl" : "en";
    var voices = speechSynthesis.getVoices();
    var hit = null;
    for (var i = 0; i < voices.length; i++) {
      var v = voices[i];
      if (v.lang && v.lang.toLowerCase().indexOf(want) === 0) {
        if (!hit || /google|natural|premium|zofia|paulina/i.test(v.name)) hit = v;
      }
    }
    return hit;
  }

  // Joi only speaks aloud while the phone is off the hook.
  function speak(text, done) {
    if (!call || !window.speechSynthesis) { if (done) done(); return; }
    if (call.rec) { try { call.rec.abort(); } catch (e) {} call.rec = null; }
    call.speaking = true;
    lcd(t("lcdSpeaking"));
    var u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "pl" ? "pl-PL" : "en-US";
    var v = pickVoice();
    if (v) u.voice = v;
    u.rate = 1.02;
    u.pitch = 1.05;
    var finished = false;
    function fin() {
      if (finished) return;
      finished = true;
      if (!call) { if (done) done(); return; }
      call.speaking = false;
      if (done) done(); else listen();
    }
    u.onend = fin;
    u.onerror = fin;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
    // Some engines never fire onend; give up after a generous budget.
    setTimeout(fin, 1200 + text.length * 90);
  }

  // Two-tone trill, synthesized, nothing sampled.
  function ring(times) {
    if (reduce) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      var ac = ring.ctx || (ring.ctx = new AC());
      if (ac.state === "suspended") ac.resume();
      for (var r = 0; r < times; r++) {
        var t0 = ac.currentTime + r * 1.6;
        var g = ac.createGain();
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.linearRampToValueAtTime(0.08, t0 + 0.02);
        g.gain.setValueAtTime(0.08, t0 + 0.78);
        g.gain.linearRampToValueAtTime(0.0001, t0 + 0.8);
        g.connect(ac.destination);
        var o = ac.createOscillator();
        o.type = "square";
        for (var k = 0; k < 16; k++) o.frequency.setValueAtTime(k % 2 ? 1209 : 1477, t0 + k * 0.05);
        o.connect(g);
        o.start(t0);
        o.stop(t0 + 0.82);
      }
    } catch (e) {}
  }

  /* ---------- open / close ---------- */

  function announce(isOpen) {
    document.dispatchEvent(new CustomEvent("wiz:overlay", { detail: { open: isOpen, id: "joi" } }));
  }

  function open(from, mode) {
    opener = from || null;
    applyLang();
    root.hidden = false;
    document.body.classList.add("locked");
    announce(true);
    start();
    if (mode === "call") startCall();
    setTimeout(function () { (window.innerWidth > 700 ? input : btnClose).focus({ preventScroll: true }); }, 50);
  }

  function close() {
    endCall();
    queue = [];
    busy = false;
    if (typing) typing.skip();
    root.hidden = true;
    document.body.classList.remove("locked");
    announce(false);
    if (opener) opener.focus({ preventScroll: true });
  }

  function applyLang() {
    lang = document.documentElement.lang === "en" ? "en" : "pl";
    btnClose.textContent = t("close");
    btnCall.textContent = call ? t("hangup") : t("call");
    noteEl.textContent = t("note");
    input.placeholder = t("placeholder");
    input.setAttribute("aria-label", t("you"));
    phoneEl.setAttribute("aria-label", t("callTitle"));
    btnAnswer.textContent = t("lcdAnswer");
    setLine(line);
  }

  function trapFocus(e) {
    var items = [btnClose, btnCall, input].concat(Array.prototype.slice.call(log.querySelectorAll(".t-opt")));
    if (!phoneEl.hidden) items.push(btnAnswer);
    items = items.filter(function (n) { return n && !n.hidden && n.offsetParent !== null; });
    var i = items.indexOf(document.activeElement);
    e.preventDefault();
    items[e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : (i + 1) % items.length].focus();
  }

  function init() {
    root = document.getElementById("joi");
    if (!root) return;
    log = document.getElementById("term-log");
    form = document.getElementById("term-form");
    input = document.getElementById("term-input");
    btnClose = document.getElementById("joi-close");
    btnCall = document.getElementById("joi-call");
    lineEl = document.getElementById("joi-line");
    noteEl = document.getElementById("joi-note");
    phoneEl = document.getElementById("phone");
    nokia = document.getElementById("nokia");
    lcdTop = document.getElementById("lcd-top");
    lcdMain = document.getElementById("lcd-main");
    lcdSoft = document.getElementById("lcd-soft");
    btnAnswer = document.getElementById("lcd-answer");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = input.value;
      input.value = "";
      submit(v);
    });
    log.addEventListener("click", function () { if (typing) typing.skip(); });
    btnClose.addEventListener("click", close);
    btnCall.addEventListener("click", function () { if (call) endCall(); else startCall(); });
    btnAnswer.addEventListener("click", function () { if (call) endCall(); else startCall(); });
    document.addEventListener("keydown", function (e) {
      if (root.hidden) return;
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key === "Tab") trapFocus(e);
    });
    if (window.speechSynthesis && speechSynthesis.addEventListener) speechSynthesis.addEventListener("voiceschanged", function () {});

    Array.prototype.forEach.call(document.querySelectorAll("[data-joi]"), function (b) {
      b.addEventListener("click", function () { open(b, b.getAttribute("data-joi")); });
    });
  }

  window.Joi = {
    init: init,
    open: open,
    close: close,
    name: NAME,
    hasVoice: !!SR
  };
  if (/[?&]debug\b/.test(location.search)) {
    window.Joi.debug = function () { return { line: line, stage: stage, lead: lead, history: history, session: session, call: !!call }; };
  }
})();
