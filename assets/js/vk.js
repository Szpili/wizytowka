/*
 * Voight-Kampff monitor: an amber eye that watches the visitor.
 * Matrix code reflects in the cornea. Intro: "wake up" typing, CRT power-on, lids open.
 */
(function () {
  "use strict";

  var KANA = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789";
  var TAU = Math.PI * 2;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function easeOut(t) { return 1 - Math.pow(1 - clamp(t, 0, 1), 3); }
  function pick() { return KANA[Math.floor(Math.random() * KANA.length)]; }

  function create(canvas, opts) {
    opts = opts || {};
    var ctx = canvas.getContext("2d");
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var text = opts.text || function (k) { return k; };

    var W = 0, H = 0;
    var geo = null;
    var irisTex = null, scan = null, veins = [], lashes = [];
    var code = [];

    var seen = false;
    try { seen = sessionStorage.getItem("vk.seen") === "1"; } catch (e) {}
    var state = reduce || seen || opts.skipIntro ? "live" : "boot";
    var stateT = 0;

    var gaze = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 };
    var pupil = { r: 0.4 };
    var interest = false, replicant = false;
    var flashLeft = 0;
    var blink = { next: rand(2.5, 5), t: -1 };
    var lastPointer = -1e9, saccade = 0;
    var now = 0, last = 0, raf = 0, running = false, visible = true, paused = false;
    var opened = state === "live";

    /* ---------- geometry & textures ---------- */

    function layout() {
      var rect = canvas.getBoundingClientRect();
      W = Math.max(200, rect.width || opts.width || 400);
      H = Math.max(90, rect.height || opts.height || 175);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);

      var hw = Math.min(W * 0.33, H * 0.95);
      var R = hw * 0.4;
      var cx = W * 0.5, cy = H * 0.53;
      geo = {
        cx: cx, cy: cy, hw: hw, R: R,
        up: R * 1.02, lo: R * 0.86,
        L: { x: cx - hw, y: cy + R * 0.08 },
        Rc: { x: cx + hw, y: cy - R * 0.05 },
        gx: hw * 0.42, gy: R * 0.22
      };

      irisTex = makeIris(R);
      scan = makeScan();
      makeVeins();
      makeLashes();
      makeCode();
    }

    function makeIris(R) {
      var size = Math.ceil((2 * R + 4) * dpr);
      var c = document.createElement("canvas");
      c.width = c.height = size;
      var g = c.getContext("2d");
      g.scale(dpr, dpr);
      var m = R + 2;

      var base = g.createRadialGradient(m, m, 0, m, m, R);
      base.addColorStop(0, "#2a1405");
      base.addColorStop(0.32, "#6e3510");
      base.addColorStop(0.52, "#c8701f");
      base.addColorStop(0.78, "#8c4714");
      base.addColorStop(0.93, "#3a1b07");
      base.addColorStop(1, "#1b0c03");
      g.fillStyle = base;
      g.beginPath();
      g.arc(m, m, R, 0, TAU);
      g.fill();

      for (var i = 0; i < 460; i++) {
        var a = rand(0, TAU);
        var r0 = R * rand(0.3, 0.42);
        var r1 = R * rand(0.72, 0.97);
        var am = a + rand(-0.07, 0.07);
        var rm = (r0 + r1) / 2;
        g.strokeStyle = Math.random() > 0.58
          ? "rgba(255,190,110," + rand(0.18, 0.5).toFixed(2) + ")"
          : "rgba(40,16,4," + rand(0.25, 0.55).toFixed(2) + ")";
        g.lineWidth = rand(0.4, 1.2);
        g.beginPath();
        g.moveTo(m + Math.cos(a) * r0, m + Math.sin(a) * r0);
        g.quadraticCurveTo(m + Math.cos(am) * rm, m + Math.sin(am) * rm, m + Math.cos(a) * r1, m + Math.sin(a) * r1);
        g.stroke();
      }

      g.beginPath();
      for (var k = 0; k <= 72; k++) {
        var ang = (k / 72) * TAU;
        var rr = R * (0.52 + Math.sin(k * 1.7) * 0.02 + rand(-0.025, 0.025));
        var px = m + Math.cos(ang) * rr, py = m + Math.sin(ang) * rr;
        if (k === 0) g.moveTo(px, py); else g.lineTo(px, py);
      }
      g.strokeStyle = "rgba(255,200,120,0.42)";
      g.lineWidth = 1.4;
      g.stroke();

      for (var n = 0; n < 22; n++) {
        var ca = rand(0, TAU), cr = R * rand(0.45, 0.82);
        g.fillStyle = "rgba(25,10,2,0.45)";
        g.beginPath();
        g.ellipse(m + Math.cos(ca) * cr, m + Math.sin(ca) * cr, rand(1.5, 3.5), rand(0.8, 1.8), ca, 0, TAU);
        g.fill();
      }

      var limbal = g.createRadialGradient(m, m, R * 0.8, m, m, R);
      limbal.addColorStop(0, "rgba(10,4,1,0)");
      limbal.addColorStop(1, "rgba(10,4,1,0.92)");
      g.fillStyle = limbal;
      g.beginPath();
      g.arc(m, m, R, 0, TAU);
      g.fill();
      return c;
    }

    function makeScan() {
      var c = document.createElement("canvas");
      c.width = canvas.width;
      c.height = canvas.height;
      var g = c.getContext("2d");
      g.fillStyle = "rgba(0,0,0,0.22)";
      var step = 3 * dpr;
      for (var y = 0; y < c.height; y += step) g.fillRect(0, y, c.width, Math.max(1, Math.round(dpr)));
      return c;
    }

    function makeVeins() {
      veins = [];
      for (var i = 0; i < 9; i++) {
        var fromLeft = i % 2 === 0;
        var x = fromLeft ? geo.L.x + rand(4, 16) : geo.Rc.x - rand(4, 16);
        var y = geo.cy + rand(-geo.R * 0.4, geo.R * 0.4);
        var pts = [[x, y]];
        var dir = fromLeft ? 1 : -1;
        var steps = Math.floor(rand(5, 10));
        for (var s = 0; s < steps; s++) {
          x += dir * rand(4, 9);
          y += rand(-3, 3);
          pts.push([x, y]);
        }
        veins.push(pts);
      }
    }

    function makeLashes() {
      lashes = [];
      for (var i = 0; i < 22; i++) {
        var t = 0.1 + (i / 21) * 0.84 + rand(-0.012, 0.012);
        lashes.push({ t: t, len: 4 + 7 * Math.sin(Math.PI * Math.min(1, t * 1.1)) + rand(-1, 1), tilt: rand(-0.1, 0.1) });
      }
    }

    function makeCode() {
      code = [];
      var n = 11;
      for (var i = 0; i < n; i++) {
        var len = Math.floor(rand(5, 10));
        var chars = [];
        for (var k = 0; k < len; k++) chars.push(pick());
        code.push({
          u: -1 + (2 * (i + 0.5)) / n,
          y: rand(0, geo.R * 2.6),
          speed: rand(24, 56),
          chars: chars,
          mut: rand(0.1, 0.5)
        });
      }
    }

    /* ---------- shapes ---------- */

    function lidCurves(o) {
      var g = geo, up = (g.up * o) / 0.75, lo = (g.lo * o) / 0.75;
      return {
        upper: [g.L.x, g.L.y, g.cx - g.hw * 0.62, g.cy - up, g.cx + g.hw * 0.3, g.cy - up, g.Rc.x, g.Rc.y],
        lower: [g.Rc.x, g.Rc.y, g.cx + g.hw * 0.52, g.cy + lo, g.cx - g.hw * 0.38, g.cy + lo, g.L.x, g.L.y]
      };
    }

    function almond(o) {
      var c = lidCurves(o);
      ctx.beginPath();
      ctx.moveTo(c.upper[0], c.upper[1]);
      ctx.bezierCurveTo(c.upper[2], c.upper[3], c.upper[4], c.upper[5], c.upper[6], c.upper[7]);
      ctx.bezierCurveTo(c.lower[2], c.lower[3], c.lower[4], c.lower[5], c.lower[6], c.lower[7]);
      ctx.closePath();
    }

    function bez(p, t) {
      var u = 1 - t;
      return {
        x: u * u * u * p[0] + 3 * u * u * t * p[2] + 3 * u * t * t * p[4] + t * t * t * p[6],
        y: u * u * u * p[1] + 3 * u * u * t * p[3] + 3 * u * t * t * p[5] + t * t * t * p[7]
      };
    }

    /* ---------- drawing ---------- */

    function drawBackdrop() {
      ctx.fillStyle = "#0b0704";
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = "rgba(255,164,60,0.05)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (var x = 0; x < W; x += 20) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); }
      for (var y = 0; y < H; y += 20) { ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); }
      ctx.stroke();

      var skin = ctx.createRadialGradient(geo.cx, geo.cy, 8, geo.cx, geo.cy, geo.hw * 1.45);
      skin.addColorStop(0, "rgba(150,78,28,0.34)");
      skin.addColorStop(0.6, "rgba(90,44,14,0.16)");
      skin.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = skin;
      ctx.fillRect(0, 0, W, H);
    }

    function drawEye(o, t) {
      var g = geo, R = g.R;
      var ix = g.cx + gaze.x, iy = g.cy + gaze.y;

      // eyelid volume between the crease and the lid line
      var lid = lidCurves(o), cr = lidCurves(Math.max(o, 0.35));
      var c1 = [cr.upper[0] + 10, cr.upper[1] - 10, cr.upper[2], cr.upper[3] - 16, cr.upper[4], cr.upper[5] - 16, cr.upper[6] - 8, cr.upper[7] - 12];
      ctx.fillStyle = "rgba(124,62,22,0.3)";
      ctx.beginPath();
      ctx.moveTo(lid.upper[0], lid.upper[1]);
      ctx.bezierCurveTo(lid.upper[2], lid.upper[3], lid.upper[4], lid.upper[5], lid.upper[6], lid.upper[7]);
      ctx.lineTo(c1[6], c1[7]);
      ctx.bezierCurveTo(c1[4], c1[5], c1[2], c1[3], c1[0], c1[1]);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(20,8,2,0.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(c1[0], c1[1]);
      ctx.bezierCurveTo(c1[2], c1[3], c1[4], c1[5], c1[6], c1[7]);
      ctx.stroke();
      ctx.strokeStyle = "rgba(124,62,22,0.22)";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(lid.lower[0], lid.lower[1] + 4);
      ctx.bezierCurveTo(lid.lower[2], lid.lower[3] + 4, lid.lower[4], lid.lower[5] + 4, lid.lower[6], lid.lower[7] + 3);
      ctx.stroke();

      if (o > 0.02) {
        ctx.save();
        almond(o);
        ctx.clip();

        var sclera = ctx.createRadialGradient(ix, iy, R * 0.9, g.cx, g.cy, g.hw * 1.05);
        sclera.addColorStop(0, "#f4c793");
        sclera.addColorStop(0.45, "#d18c4c");
        sclera.addColorStop(0.82, "#7b3f17");
        sclera.addColorStop(1, "#2e1405");
        ctx.fillStyle = sclera;
        ctx.fillRect(g.L.x - 4, g.cy - g.up - 4, g.hw * 2 + 8, g.up + g.lo + 8);

        ctx.strokeStyle = "rgba(110,28,8,0.4)";
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        for (var v = 0; v < veins.length; v++) {
          var pts = veins[v];
          ctx.moveTo(pts[0][0], pts[0][1]);
          for (var p = 1; p < pts.length; p++) ctx.lineTo(pts[p][0], pts[p][1]);
        }
        ctx.stroke();

        ctx.fillStyle = "rgba(176,72,40,0.7)";
        ctx.beginPath();
        ctx.ellipse(g.L.x + 8, g.L.y - 1, 7, 4.5, -0.1, 0, TAU);
        ctx.fill();

        ctx.drawImage(irisTex, ix - R - 2, iy - R - 2, 2 * R + 4, 2 * R + 4);

        var pr = R * pupil.r;
        var pg = ctx.createRadialGradient(ix, iy, pr * 0.55, ix, iy, pr * 1.08);
        pg.addColorStop(0, "#000");
        pg.addColorStop(0.86, "rgba(0,0,0,0.97)");
        pg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = pg;
        ctx.beginPath();
        ctx.arc(ix, iy, pr * 1.08, 0, TAU);
        ctx.fill();

        // Replicant eyeshine
        if (replicant) {
          var es = ctx.createRadialGradient(ix, iy, 0, ix, iy, pr);
          es.addColorStop(0, "rgba(255,80,40,0.85)");
          es.addColorStop(0.6, "rgba(220,40,20,0.45)");
          es.addColorStop(1, "rgba(200,30,10,0)");
          ctx.globalCompositeOperation = "lighter";
          ctx.fillStyle = es;
          ctx.beginPath();
          ctx.arc(ix, iy, pr, 0, TAU);
          ctx.fill();
          ctx.globalCompositeOperation = "source-over";
        }

        drawCode(ix, iy, R);

        // catchlights
        ctx.fillStyle = "rgba(255,238,215,0.85)";
        roundRect(ix - R * 0.52, iy - R * 0.5, R * 0.3, R * 0.2, R * 0.06);
        ctx.fill();
        ctx.fillStyle = "rgba(255,238,215,0.45)";
        ctx.beginPath();
        ctx.arc(ix + R * 0.3, iy + R * 0.32, Math.max(1.2, R * 0.04), 0, TAU);
        ctx.fill();

        // upper lid shadow
        var top = g.cy - g.up * o;
        var ls = ctx.createLinearGradient(0, top, 0, top + R * 0.95);
        ls.addColorStop(0, "rgba(15,6,1,0.78)");
        ls.addColorStop(1, "rgba(15,6,1,0)");
        ctx.fillStyle = ls;
        ctx.fillRect(g.L.x, top, g.hw * 2, R * 0.95);
        ctx.restore();
      }

      // lids
      var c = lidCurves(o);
      ctx.strokeStyle = "#160902";
      ctx.lineCap = "round";
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      ctx.moveTo(c.upper[0], c.upper[1]);
      ctx.bezierCurveTo(c.upper[2], c.upper[3], c.upper[4], c.upper[5], c.upper[6], c.upper[7]);
      ctx.stroke();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = "#2b1206";
      ctx.beginPath();
      ctx.moveTo(c.lower[0], c.lower[1]);
      ctx.bezierCurveTo(c.lower[2], c.lower[3], c.lower[4], c.lower[5], c.lower[6], c.lower[7]);
      ctx.stroke();

      // lashes
      ctx.strokeStyle = "#120601";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (var i = 0; i < lashes.length; i++) {
        var l = lashes[i];
        var a = bez(c.upper, l.t), b = bez(c.upper, Math.min(1, l.t + 0.01));
        var tx = b.x - a.x, ty = b.y - a.y, len = Math.hypot(tx, ty) || 1;
        var nx = ty / len, ny = -tx / len;
        var out = (l.t - 0.4) * 1.2 + l.tilt;
        var dirY = ny * clamp(o * 1.6 - 0.6, -0.7, 1);
        var ex = a.x + (nx + out) * l.len, ey = a.y + dirY * l.len;
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(a.x + nx * l.len * 0.5, a.y + dirY * l.len * 0.75, ex, ey);
      }
      ctx.stroke();
      ctx.lineCap = "butt";
    }

    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    // Code reflected on a curved cornea: columns squeeze toward the rim.
    function drawCode(ix, iy, R) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(ix, iy, R * 0.98, 0, TAU);
      ctx.clip();
      ctx.globalCompositeOperation = "lighter";
      ctx.font = '10px "DotGothic16", monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      var step = 11;
      for (var i = 0; i < code.length; i++) {
        var col = code[i];
        var s = Math.sin((col.u * Math.PI) / 2);
        var sx = Math.cos((col.u * Math.PI) / 2) * 0.85 + 0.15;
        var x = ix + R * 0.95 * s;
        for (var k = 0; k < col.chars.length; k++) {
          var y = iy - R + col.y - k * step;
          if (y < iy - R - step || y > iy + R + step) continue;
          var f = 1 - k / col.chars.length;
          ctx.globalAlpha = 0.62 * f * f * (replicant ? 0.6 : 1);
          ctx.fillStyle = k === 0 ? "#d8ffe8" : "#6dffa0";
          ctx.save();
          ctx.translate(x, y);
          ctx.scale(-sx, 1);
          ctx.fillText(col.chars[k], 0, 0);
          ctx.restore();
        }
      }
      ctx.restore();
    }

    function drawOverlay(t) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(scan, 0, 0);
      ctx.restore();

      var vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.62);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,0.62)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);

      var amber = "rgba(255,164,60,0.85)";
      var faint = "rgba(255,164,60,0.22)";

      // crosshair segments around the pupil
      var ix = geo.cx + gaze.x, iy = geo.cy + gaze.y, R = geo.R;
      ctx.strokeStyle = faint;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ix - R - 26, iy); ctx.lineTo(ix - R - 6, iy);
      ctx.moveTo(ix + R + 6, iy); ctx.lineTo(ix + R + 26, iy);
      ctx.moveTo(ix, iy - R - 18); ctx.lineTo(ix, iy - R - 4);
      ctx.moveTo(ix, iy + R + 4); ctx.lineTo(ix, iy + R + 18);
      ctx.stroke();

      // viewfinder corners
      ctx.strokeStyle = "rgba(255,164,60,0.55)";
      ctx.lineWidth = 1.2;
      var m = 9, k = 13;
      ctx.beginPath();
      ctx.moveTo(m, m + k); ctx.lineTo(m, m); ctx.lineTo(m + k, m);
      ctx.moveTo(W - m - k, m); ctx.lineTo(W - m, m); ctx.lineTo(W - m, m + k);
      ctx.moveTo(m, H - m - k); ctx.lineTo(m, H - m); ctx.lineTo(m + k, H - m);
      ctx.moveTo(W - m - k, H - m); ctx.lineTo(W - m, H - m); ctx.lineTo(W - m, H - m - k);
      ctx.stroke();

      var mm = 2 + ((pupil.r - 0.2) / 0.4) * 6;
      var left = text("vkPupil") + " " + mm.toFixed(1) + " mm";
      var right = text(replicant ? "vkReplicant" : "vkHuman");
      // shrink the readouts on narrow screens so they never collide
      var size = 17;
      ctx.font = size + 'px "VT323", monospace';
      while (size > 12 && ctx.measureText(left).width + ctx.measureText(right).width + 52 > W) {
        size -= 1;
        ctx.font = size + 'px "VT323", monospace';
      }
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = amber;
      ctx.textAlign = "left";
      ctx.fillText(left, 18, H - 15);
      ctx.textAlign = "right";
      ctx.fillStyle = replicant ? "rgba(255,110,80,0.95)" : amber;
      ctx.fillText(right, W - 18, H - 15);
      ctx.font = '17px "VT323", monospace';
      ctx.textAlign = "left";
      ctx.fillStyle = amber;
      ctx.fillText("VOIGHT-KAMPFF", 18, 26);
      ctx.textAlign = "right";
      ctx.fillStyle = amber;
      ctx.fillText("REC", W - 18, 26);
      if (reduce || Math.floor(t * 1.2) % 2 === 0) {
        ctx.fillStyle = "rgba(255,70,50,0.95)";
        ctx.beginPath();
        ctx.arc(W - 18 - ctx.measureText("REC").width - 9, 21, 3.5, 0, TAU);
        ctx.fill();
      }
    }

    function drawBoot(t) {
      ctx.fillStyle = "#020403";
      ctx.fillRect(0, 0, W, H);
      var lines = text("intro");
      var tt = t;
      var line = "", typed = 0, done = true;
      for (var i = 0; i < lines.length; i++) {
        var dur = lines[i].length * 0.045 + 0.6;
        if (tt < dur) {
          line = lines[i];
          typed = Math.min(line.length, Math.floor(tt / 0.045));
          done = false;
          break;
        }
        tt -= dur;
      }
      if (done) return true;
      ctx.font = '24px "VT323", monospace';
      ctx.fillStyle = "#6dffa0";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.shadowColor = "rgba(109,255,160,0.7)";
      ctx.shadowBlur = 8;
      var shown = line.slice(0, typed);
      ctx.fillText(shown, 20, H / 2 + 6);
      if (Math.floor(t * 3) % 2 === 0) {
        var cw = ctx.measureText(shown).width;
        ctx.fillRect(22 + cw, H / 2 - 12, 10, 20);
      }
      ctx.shadowBlur = 0;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(scan, 0, 0);
      ctx.restore();
      return false;
    }

    function drawPower(k) {
      // CRT power-on: a bright line opens into the picture
      var hh = Math.max(2, H * easeOut(k));
      ctx.fillStyle = "rgba(0,0,0,1)";
      ctx.fillRect(0, 0, W, (H - hh) / 2);
      ctx.fillRect(0, (H + hh) / 2, W, (H - hh) / 2);
      ctx.fillStyle = "rgba(230,255,240," + (0.9 * (1 - k)).toFixed(3) + ")";
      ctx.fillRect(0, (H - hh) / 2, W, hh);
    }

    /* ---------- update ---------- */

    function update(dt) {
      // gaze
      if (now - lastPointer > 2.5) {
        saccade -= dt;
        if (saccade <= 0) {
          if (Math.random() < 0.3) { gaze.tx = 0; gaze.ty = 0; }
          else { gaze.tx = rand(-0.75, 0.75); gaze.ty = rand(-0.6, 0.6); }
          saccade = rand(0.7, 2.6);
        }
      }
      var kx = gaze.tx * geo.gx, ky = gaze.ty * geo.gy;
      var K = 260, C = 2 * Math.sqrt(K);
      gaze.vx += (K * (kx - gaze.x) - C * gaze.vx) * dt;
      gaze.vy += (K * (ky - gaze.y) - C * gaze.vy) * dt;
      gaze.x += gaze.vx * dt;
      gaze.y += gaze.vy * dt;

      // pupil: dilates slowly, constricts fast
      flashLeft = Math.max(0, flashLeft - dt);
      var target = interest ? 0.56 : 0.4;
      if (flashLeft > 0) target = 0.24;
      target += Math.sin(now * 1.7) * 0.012 + Math.sin(now * 0.53) * 0.01;
      var rate = target < pupil.r ? 7 : 2.4;
      pupil.r += (target - pupil.r) * Math.min(1, dt * rate);

      // blink
      blink.next -= dt;
      if (blink.next <= 0 && blink.t < 0) {
        blink.t = 0;
        blink.next = Math.random() < 0.15 ? 0.35 : rand(2.8, 6.5);
      }
      if (blink.t >= 0) {
        blink.t += dt;
        if (blink.t > 0.2) blink.t = -1;
      }

      // reflection
      for (var i = 0; i < code.length; i++) {
        var c = code[i];
        c.y += c.speed * dt;
        c.mut -= dt;
        if (c.mut <= 0) {
          c.chars[Math.floor(Math.random() * c.chars.length)] = pick();
          c.mut = rand(0.08, 0.5);
        }
        if (c.y - c.chars.length * 11 > geo.R * 2.2) {
          c.y = rand(-20, 0);
          c.speed = rand(24, 56);
        }
      }
    }

    function openness() {
      if (blink.t < 0) return 1;
      var t = blink.t;
      if (t < 0.07) return 1 - t / 0.07;
      return Math.min(1, (t - 0.07) / 0.12);
    }

    function render(dt) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (state === "boot") {
        stateT += dt;
        if (drawBoot(stateT)) { state = "power"; stateT = 0; }
        return;
      }
      if (state === "power") {
        stateT += dt;
        drawBackdrop();
        drawEye(0, now);
        drawOverlay(now);
        drawPower(stateT / 0.32);
        if (stateT >= 0.32) { state = "open"; stateT = 0; fireOpen(); }
        return;
      }
      var o = 1;
      if (state === "open") {
        stateT += dt;
        o = easeOut(stateT / 0.55);
        if (stateT >= 0.55) {
          state = "live";
          try { sessionStorage.setItem("vk.seen", "1"); } catch (e) {}
        }
      } else {
        o = reduce ? 1 : openness();
      }
      if (!reduce) update(dt);
      drawBackdrop();
      drawEye(o, now);
      drawOverlay(now);
    }

    function fireOpen() {
      if (opened) return;
      opened = true;
      if (opts.onOpen) opts.onOpen();
    }

    function frame(ts) {
      if (!running) return;
      var t = ts / 1000;
      var dt = last ? Math.min(0.05, t - last) : 0.016;
      last = t;
      now += dt;
      render(dt);
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (running || reduce || paused || !visible || document.hidden) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }
    function still() {
      if (!running) render(0);
    }

    /* ---------- input ---------- */

    window.addEventListener("pointermove", function (e) {
      var r = canvas.getBoundingClientRect();
      var dx = (e.clientX - (r.left + r.width / 2)) / (window.innerWidth * 0.5);
      var dy = (e.clientY - (r.top + r.height * 0.53)) / (window.innerHeight * 0.5);
      gaze.tx = clamp(dx * 1.4, -1, 1);
      gaze.ty = clamp(dy * 1.8, -1, 1);
      lastPointer = now;
    }, { passive: true });

    canvas.addEventListener("pointerdown", function () {
      if (state === "boot" || state === "power") {
        state = "open";
        stateT = 0;
        fireOpen();
      } else {
        api.flash();
      }
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start(); else stop();
      }).observe(canvas);
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else start();
    });
    if ("ResizeObserver" in window) {
      var firstRO = true;
      new ResizeObserver(function () {
        if (firstRO) { firstRO = false; return; }
        layout();
        still();
      }).observe(canvas);
    }

    var api = {
      setInterest: function (on) { interest = !!on; if (reduce) { pupil.r = on ? 0.56 : 0.4; still(); } },
      flash: function () { flashLeft = 0.35; },
      setReplicant: function (on) { replicant = !!on; still(); },
      refresh: function () { still(); },
      pause: function () { paused = true; stop(); },
      resume: function () { paused = false; start(); },
      introDone: function () { return opened; }
    };

    layout();
    var fontWait = document.fonts && document.fonts.load
      ? Promise.all([document.fonts.load('17px "VT323"', "aąćęłńóśźż"), document.fonts.load('10px "DotGothic16"', "ｱ")])
      : Promise.resolve();
    fontWait.catch(function () {}).then(function () {
      if (reduce) { render(0); }
      else start();
    });

    return api;
  }

  window.VK = { create: create };
})();
