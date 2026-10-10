/* Renders the CV sheet from assets/js/profile.js. Used by build.mjs. */
(function () {
  "use strict";

  var P = window.PROFILE;
  var lang = new URLSearchParams(location.search).get("lang") === "en" ? "en" : "pl";
  var C = P.cvContent[lang];
  var T = {
    pl: {
      doc: "AI CV", summary: "Profil", projects: "Projekty", other: "Inne projekty", skills: "Umiejętności",
      principles: "Jak pracuję", languages: "Języki", site: "www", email: "e-mail", phone: "tel.",
      footer: "Wygenerowano z kodu wizytówki: github.com/Szpili/wizytowka",
      vk: "test Voighta-Kampffa: zaliczony"
    },
    en: {
      doc: "AI CV", summary: "Profile", projects: "Projects", other: "Other projects", skills: "Skills",
      principles: "How I work", languages: "Languages", site: "web", email: "email", phone: "phone",
      footer: "Generated from the source of this card: github.com/Szpili/wizytowka",
      vk: "Voight-Kampff test: passed"
    }
  }[lang];

  var KANA = "ｦｧｨｩｪｫｬｭｮｯｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789";
  // deterministic noise so both PDFs get the same band
  var seed = 7;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function add(parent, child) { parent.appendChild(child); return child; }
  function strip(url) { return url.replace(/^https?:\/\//, "").replace(/\/$/, ""); }

  document.documentElement.lang = lang;
  document.title = P.fullName + ": " + T.doc;
  var sheet = document.getElementById("sheet");

  var code = add(sheet, el("div", "code"));
  code.setAttribute("aria-hidden", "true");
  for (var c = 0; c < 62; c++) {
    var col = add(code, el("span"));
    var n = 2 + Math.floor(rnd() * 5);
    var alpha = 0.25 + rnd() * 0.6;
    col.style.opacity = alpha.toFixed(2);
    for (var k = 0; k < n; k++) add(col, el("i", null, KANA[Math.floor(rnd() * KANA.length)]));
  }

  var head = add(sheet, el("header", "head"));
  var id = add(head, el("div", "id"));
  add(id, el("h1", null, P.fullName));
  add(id, el("p", "title", P.title[lang]));

  var contact = add(head, el("aside", "contact"));
  var qr = add(contact, el("img", "qr"));
  qr.src = "qr-cv.svg";
  qr.alt = strip(P.siteUrl);
  var ul = add(contact, el("ul"));
  function line(key, value, href) {
    var li = add(ul, el("li"));
    add(li, el("span", "k", key + " "));
    var a = add(li, el("a", null, value));
    a.href = href;
  }
  line(T.site, strip(P.siteUrl), P.siteUrl);
  if (P.contact.phone) line(T.phone, P.contact.phone, "tel:" + P.contact.phone.replace(/\s+/g, ""));
  if (P.contact.email) line(T.email, P.contact.email, "mailto:" + P.contact.email);
  if (P.contact.linkedin) line("in", strip(P.contact.linkedin).replace(/^(www\.)?linkedin\.com\/in\//, ""), P.contact.linkedin);
  P.github.forEach(function (g) { line("gh", "github.com/" + g.user, "https://github.com/" + g.user); });

  var summary = add(sheet, el("section", "summary"));
  add(summary, el("h2", null, T.summary));
  add(summary, el("p", null, C.summary));

  var cols = add(sheet, el("div", "cols"));
  var main = add(cols, el("section", "projects"));
  add(main, el("h2", null, T.projects));
  C.projects.forEach(function (p) {
    var art = add(main, el("article", "project"));
    var h3 = add(art, el("h3"));
    add(h3, el("span", null, p.name));
    add(h3, el("span", "link", p.link));
    add(art, el("p", "lead", p.lead));
    var list = add(art, el("ul"));
    p.points.forEach(function (pt) { add(list, el("li", null, pt)); });
    add(art, el("p", "tags", p.tags));
  });
  if (C.other && C.other.length) {
    add(main, el("h2", null, T.other));
    var others = add(main, el("ul", "other"));
    C.other.forEach(function (o) {
      var li = add(others, el("li"));
      add(li, el("b", null, o.name));
      li.appendChild(document.createTextNode(": " + o.text));
    });
  }

  var side = add(cols, el("aside", "side"));
  add(side, el("h2", null, T.skills));
  var dl = add(side, el("dl"));
  C.skills.forEach(function (s) {
    add(dl, el("dt", null, s.group));
    add(dl, el("dd", null, s.items));
  });
  add(side, el("h2", null, T.principles));
  var pr = add(side, el("ul", "principles"));
  C.principles.forEach(function (s) { add(pr, el("li", null, s)); });
  add(side, el("h2", null, T.languages));
  var lg = add(side, el("ul", "langs"));
  C.languages.forEach(function (s) { add(lg, el("li", null, s)); });

  var foot = add(sheet, el("footer", "foot"));
  var date = new Date().toLocaleDateString(lang === "pl" ? "pl-PL" : "en-GB", { month: "long", year: "numeric" });
  add(foot, el("span", null, T.footer + ", " + date));
  add(foot, el("span", "vk", T.vk));

  window.CV_READY = (document.fonts ? document.fonts.ready : Promise.resolve()).then(function () {
    return new Promise(function (res) {
      if (qr.complete) res(); else { qr.onload = res; qr.onerror = res; }
    });
  });
})();
