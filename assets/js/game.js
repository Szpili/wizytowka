/*
 * Tears in Rain: a one-button rooftop runner.
 * Matrix: agents, bullets, bullet time, green glyphs. Blade Runner: rain, neon, spinners, the dove.
 */
(function () {
  "use strict";

  var KANA = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ";
  var H = 180;
  var W = 320;
  var PX = 64;
  var GRAV = 1150, JUMP = -345, CUT = -125, DJUMP = -300, MAXFALL = 560;
  var BULLET = 150;
  var METRE = 8;
  var STEP = 1 / 120;

  var C = {
    coat: "#123726", coatHi: "#2e7a50", pants: "#0a0f12", skin: "#b88d6a", hair: "#050607",
    suit: "#0b0f12", shirt: "#cfd6d6", agentSkin: "#a98068",
    bld: "#091119", bldEdge: "#1b3242", roof: "#3d6f80",
    crate: "#26343e", crateHi: "#3f5461", crateLo: "#141d24",
    phosphor: "#6dffa0", pink: "#ff5fa2", cyan: "#5fe8ff", amber: "#ffb35a"
  };

  function rand(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function hash(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function kana() { return Math.floor(Math.random() * KANA.length); }

  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- DOM ---------- */

  var root, stage, canvas, ctx, scrTitle, scrOver, elScore, elBest, elFinal, elRecord, btnMute, btnClose, btnStart, btnAgain;
  var opener = null;
  var text = function (k) { return k; };

  /* ---------- state ---------- */

  var mode = "off"; // off | title | play | dying | over
  var w = null;
  var raf = 0, last = 0, clock = 0;
  var best = 0;
  var input = { down: false, pressed: false };
  var atlas = null, overlay = null, overReady = false, shownScore = -1, lastSlow = 1;

  try { best = parseInt(localStorage.getItem("wiz.best"), 10) || 0; } catch (e) {}

  /* ---------- pre-rendered assets ---------- */

  function makeAtlas() {
    var colors = { g: C.phosphor, p: C.pink, c: C.cyan, d: "#2f9e63" };
    var a = {};
    for (var key in colors) {
      var c = document.createElement("canvas");
      c.width = 10 * KANA.length;
      c.height = 12;
      var g = c.getContext("2d");
      g.fillStyle = colors[key];
      g.font = '10px "DotGothic16", monospace';
      g.textAlign = "center";
      g.textBaseline = "middle";
      for (var i = 0; i < KANA.length; i++) {
        g.save();
        g.translate(i * 10 + 5, 6.5);
        g.scale(-1, 1);
        g.fillText(KANA[i], 0, 0);
        g.restore();
      }
      a[key] = c;
    }
    return a;
  }

  function glyph(color, i, x, y) {
    ctx.drawImage(atlas[color], i * 10, 0, 10, 12, Math.round(x - 5), Math.round(y - 6), 10, 12);
  }

  function makeOverlay() {
    var c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    var g = c.getContext("2d");
    g.fillStyle = "rgba(0,0,0,0.16)";
    for (var y = 1; y < H; y += 2) g.fillRect(0, y, W, 1);
    var v = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.7);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(0,0,0,0.55)");
    g.fillStyle = v;
    g.fillRect(0, 0, W, H);
    return c;
  }

  /* ---------- world ---------- */

  function newWorld() {
    var world = {
      t: 0, speed: 0, base: 120, dist: 0, bonus: 0,
      ts: 1, bt: 0, shake: 0,
      flash: [], flashNext: rand(9, 20),
      buildings: [], crates: [], agents: [], bullets: [], pickups: [],
      parts: [], pops: [], ghosts: [], ripples: [],
      far: [], mid: [], cars: [], drops: [],
      nextUnicorn: rand(2200, 2900),
      p: { y: 0, vy: 0, ground: true, jumps: 0, holding: false, holdT: 0, phase: 0, coyote: 0, buffer: 0, alive: true, ghostT: 0 },
      dove: null, deadT: 0, cause: "",
      blimp: { x: W * 0.62, y: Math.round(H * 0.17) + 8 }
    };
    w = world;
    addBuilding(true);
    while (last_b().x + last_b().w < W + 260) addBuilding(false);
    world.p.y = world.buildings[0].top;
    for (var i = 0; i < 12; i++) addFar(i === 0, i === 3 ? "pyramid" : i === 5 ? "stack" : null);
    for (var j = 0; j < 12; j++) addMid(j === 0);
    for (var k = 0; k < 110; k++) world.drops.push(newDrop(true));
    return world;
  }

  function last_b() { return w.buildings[w.buildings.length - 1]; }
  function difficulty() { return clamp(w.dist / 28000, 0, 1); }

  function addBuilding(first) {
    var prev = first ? null : last_b();
    var d = difficulty();
    var x, top, width, gap = 0;
    if (!prev) {
      x = -20;
      top = H - 52;
      width = W + 220;
    } else {
      var sp = Math.max(w.base, 120);
      var air = (2 * -JUMP) / GRAV;
      var single = air * sp;
      var dbl = (air + 0.42) * sp;
      var maxGap = d < 0.1 ? single * 0.55 : lerp(single * 0.62, dbl * 0.72, (d - 0.1) / 0.9);
      gap = rand(24, Math.max(32, maxGap));
      top = clamp(prev.top + rand(-24 - 12 * d, 44), H - 94, H - 22);
      if (top < prev.top - 4) gap = Math.min(gap, single * 0.5);
      width = rand(lerp(210, 110, d), lerp(380, 240, d));
      x = prev.x + prev.w + gap;
    }
    var b = { x: x, w: Math.round(width), top: Math.round(top), seed: Math.random() * 1000, rim: Math.random() < 0.5 ? C.cyan : C.pink, deco: [] };
    // decorative antennas and water tanks, all behind the runner's plane
    var nDeco = Math.floor(rand(0, 3));
    for (var i = 0; i < nDeco; i++) {
      b.deco.push({ dx: rand(10, b.w - 14), kind: Math.random() < 0.6 ? "antenna" : "tank", h: Math.round(rand(8, 18)), blink: rand(0, 6) });
    }
    w.buildings.push(b);
    if (prev) populate(b, prev, gap);
  }

  function populate(b, prev, gap) {
    var d = difficulty();
    var metres = (w.dist + b.x) / METRE;
    var taken = [];
    function free(x, r) {
      for (var i = 0; i < taken.length; i++) if (Math.abs(taken[i] - x) < r) return false;
      return true;
    }

    if (b.w > 120 && Math.random() < 0.35 + 0.3 * d) {
      var n = Math.random() < 0.3 ? 2 : 1;
      for (var i = 0; i < n; i++) {
        var cx = b.x + rand(56, b.w - 40);
        if (!free(cx, 34)) continue;
        taken.push(cx);
        w.crates.push({ x: cx, y: b.top, w: Math.round(rand(10, 14)), h: Math.round(rand(7, 10)), hit: false, vx: 0, vy: 0, rot: 0, spin: 0 });
      }
    }

    if (metres > 150 && b.w > 140 && Math.random() < 0.28 + 0.4 * d) {
      var ax = b.x + rand(80, b.w - 46);
      if (free(ax, 46)) {
        taken.push(ax);
        w.agents.push({
          x: ax, y: b.top, aim: 0, fired: false, passed: false, flash: 0,
          armed: metres > 450 && Math.random() < 0.45 + 0.4 * d
        });
      }
    }

    if (gap > 26 && Math.random() < 0.7) {
      var x0 = prev.x + prev.w, x1 = b.x;
      var count = 2 + Math.floor(gap / 34);
      for (var k = 0; k < count; k++) {
        var u = (k + 1) / (count + 1);
        w.pickups.push({
          x: lerp(x0, x1, u),
          y: Math.min(prev.top, b.top) - 26 - Math.sin(u * Math.PI) * 22,
          kind: "glyph", ch: kana(), bob: rand(0, 6)
        });
      }
    } else if (Math.random() < 0.45) {
      var gx = b.x + rand(30, Math.max(40, b.w - 70));
      for (var m = 0; m < 4; m++) {
        if (!free(gx + m * 13, 12)) continue;
        w.pickups.push({ x: gx + m * 13, y: b.top - 13, kind: "glyph", ch: kana(), bob: rand(0, 6) });
      }
    }

    if (w.dist + b.x > w.nextUnicorn) {
      w.pickups.push({ x: b.x + Math.min(b.w * 0.5, 90), y: b.top - 58, kind: "unicorn", bob: 0 });
      w.nextUnicorn += rand(2000, 2800);
    }
  }

  /* ---------- background layers ---------- */

  function addFar(first, force) {
    var prev = w.far[w.far.length - 1];
    var x = first ? -10 : prev.x + prev.w + rand(-4, 6);
    var item;
    var pyramidOk = !w.far.some(function (f) { return f.kind === "pyramid"; });
    if (force === "pyramid" || (!force && !first && Math.random() < 0.08 && pyramidOk)) {
      item = { kind: "pyramid", x: x + 10, w: 170, h: 110, seed: Math.random() * 99 };
    } else if (force === "stack" || Math.random() < 0.12) {
      item = { kind: "stack", x: x, w: 10, h: Math.round(rand(34, 56)), timer: rand(0.5, 4) };
    } else {
      item = { kind: "tower", x: x, w: Math.round(rand(14, 36)), h: Math.round(rand(40, 96)), seed: Math.random() * 99 };
    }
    w.far.push(item);
  }

  function addMid(first) {
    var prev = w.mid[w.mid.length - 1];
    var x = first ? -6 : prev.x + prev.w + rand(2, 14);
    var r = Math.random();
    w.mid.push({
      x: x, w: Math.round(rand(26, 62)), h: Math.round(rand(74, 138)), seed: Math.random() * 99,
      sign: r < 0.32 ? { color: Math.random() < 0.55 ? "p" : "c", chars: [kana(), kana(), kana(), kana()].slice(0, 3 + Math.floor(Math.random() * 2)), off: 0 } : null,
      screen: r >= 0.32 && r < 0.46,
      code: r >= 0.46 && r < 0.56 ? [0, 1, 2, 3].map(function () { return { y: rand(0, 60), s: rand(14, 30), ch: [kana(), kana(), kana(), kana(), kana()] }; }) : null
    });
  }

  function newDrop(spread) {
    var near = Math.random() < 0.2;
    return {
      x: rand(-40, W + 10), y: spread ? rand(-10, H) : rand(-30, -4),
      len: near ? rand(7, 11) : rand(4, 7),
      speed: near ? rand(380, 460) : rand(260, 340),
      near: near
    };
  }

  /* ---------- simulation ---------- */

  function scroll(list, dx, pad) {
    for (var i = list.length - 1; i >= 0; i--) {
      list[i].x -= dx;
      if (list[i].x + (list[i].w || 0) < -(pad || 40)) list.splice(i, 1);
    }
  }

  function step(dt, realDt) {
    var p = w.p;
    w.t += dt;

    if (mode === "play") {
      w.base = 120 + 135 * smooth(w.dist / 30000);
      w.speed += (w.base - w.speed) * Math.min(1, dt * (w.speed < w.base * 0.5 ? 3 : 0.9));
    } else if (mode === "title") {
      w.speed = 0;
    } else {
      w.speed *= Math.pow(0.2, dt);
    }

    var dx = w.speed * dt;
    if (mode === "play") w.dist += dx;
    scroll(w.buildings, dx, 60);
    scroll(w.crates, dx);
    scroll(w.agents, dx);
    scroll(w.pickups, dx);
    scroll(w.parts, dx, 20);
    scroll(w.pops, dx, 60);
    scroll(w.ghosts, dx, 20);
    scroll(w.ripples, dx, 60);
    while (last_b().x + last_b().w < W + 260) addBuilding(false);

    // parallax layers keep drifting a little even on the title screen
    var amb = Math.max(w.speed, 24);
    scroll(w.far, amb * 0.1 * dt, 160);
    scroll(w.mid, amb * 0.32 * dt, 80);
    while (w.far.length && w.far[w.far.length - 1].x + w.far[w.far.length - 1].w < W + 40) addFar(false);
    while (w.mid.length && w.mid[w.mid.length - 1].x + w.mid[w.mid.length - 1].w < W + 40) addMid(false);

    // bullets
    for (var bi = w.bullets.length - 1; bi >= 0; bi--) {
      var bl = w.bullets[bi];
      var bx0 = bl.x;
      bl.x -= dx + BULLET * dt;
      if (p.alive && mode === "play") {
        var top = p.y - 15;
        if (bl.x < PX + 3 && bl.x + 4 > PX - 3 && bl.y >= top && bl.y <= p.y) {
          die("shot");
        } else if (!bl.passed && bx0 >= PX && bl.x < PX) {
          bl.passed = true;
          if (Math.abs(bl.y - (p.y - 7)) < 18) dodge(PX, bl.y, 30);
        }
      }
      if (bl.x < -20) w.bullets.splice(bi, 1);
    }

    // agents
    for (var ai = 0; ai < w.agents.length; ai++) {
      var a = w.agents[ai];
      a.flash = Math.max(0, a.flash - dt);
      var dist = a.x - PX;
      if (a.armed && !a.fired && mode === "play" && dist < 175 && dist > 58) {
        a.aim += dt;
        if (a.aim > 0.38) {
          a.fired = true;
          a.flash = 0.08;
          w.bullets.push({ x: a.x - 9, y: a.y - 11, passed: false });
          sfx("shot");
        }
      }
      if (p.alive && mode === "play") {
        if (a.x - 3 < PX + 3 && a.x + 3 > PX - 3 && p.y > a.y - 18 && p.y - 15 < a.y) {
          die("agent");
        } else if (!a.passed && a.x < PX) {
          a.passed = true;
          var clear = (a.y - 18) - p.y;
          if (clear >= 0 && clear < 16) dodge(a.x, a.y - 20, 50);
        }
      }
    }

    // runner
    if (mode === "play" || mode === "dying") runner(dt, realDt);

    // crates
    for (var ci = w.crates.length - 1; ci >= 0; ci--) {
      var c = w.crates[ci];
      if (c.hit) {
        c.vy += GRAV * 0.6 * dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.rot += c.spin * dt;
        if (c.y > H + 30) w.crates.splice(ci, 1);
      } else if (p.alive && mode === "play" && c.x - c.w / 2 < PX + 3 && c.x + c.w / 2 > PX - 3 && p.y > c.y - c.h) {
        c.hit = true;
        c.vx = 60;
        c.vy = -150;
        c.spin = rand(-8, 8);
        w.speed *= 0.72;
        w.shake = 3;
        burst(c.x, c.y - c.h / 2, 8, "#5a7380", 90);
        sfx("crash");
      }
    }

    // pickups
    for (var pi = w.pickups.length - 1; pi >= 0; pi--) {
      var k = w.pickups[pi];
      if (p.alive && mode === "play" && Math.abs(k.x - PX) < 8 && Math.abs(k.y - (p.y - 8)) < 11) {
        w.pickups.splice(pi, 1);
        if (k.kind === "unicorn") {
          w.bonus += 250;
          pop(k.x, k.y - 8, text("unicornGot") + " +250", C.amber);
          burst(k.x, k.y, 16, "#e8eef0", 120);
          sfx("unicorn");
        } else {
          w.bonus += 10;
          burst(k.x, k.y, 6, C.phosphor, 60);
          sfx("pickup");
        }
      }
    }

    // particles, popups, ghosts, ripples
    for (var q = w.parts.length - 1; q >= 0; q--) {
      var pt = w.parts[q];
      pt.life -= dt;
      if (pt.life <= 0) { w.parts.splice(q, 1); continue; }
      pt.vy += (pt.grav || 0) * dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
    }
    for (var r = w.pops.length - 1; r >= 0; r--) {
      w.pops[r].life -= realDt;
      w.pops[r].y -= 14 * realDt;
      if (w.pops[r].life <= 0) w.pops.splice(r, 1);
    }
    for (var g = w.ghosts.length - 1; g >= 0; g--) {
      w.ghosts[g].life -= realDt;
      if (w.ghosts[g].life <= 0) w.ghosts.splice(g, 1);
    }
    for (var rp = w.ripples.length - 1; rp >= 0; rp--) {
      w.ripples[rp].r += 40 * realDt;
      w.ripples[rp].life -= realDt;
      if (w.ripples[rp].life <= 0) w.ripples.splice(rp, 1);
    }

    // rain and roof splashes
    for (var di = 0; di < w.drops.length; di++) {
      var dr = w.drops[di];
      dr.y += dr.speed * dt;
      dr.x += dr.speed * 0.25 * dt - dx * 0.4;
      if (dr.y > H + 10) w.drops[di] = newDrop(false);
    }
    if (Math.random() < 0.7) {
      var hb = w.buildings[Math.floor(Math.random() * w.buildings.length)];
      var sx = hb.x + Math.random() * hb.w;
      if (sx > 0 && sx < W) {
        w.parts.push({ x: sx, y: hb.top - 1, vx: rand(-18, 18), vy: rand(-46, -18), grav: 320, life: 0.22, color: "rgba(185,215,235,0.75)", s: 1 });
      }
    }

    // spinners
    if (w.cars.length < 3 && Math.random() < dt * 0.35) {
      var ltr = Math.random() < 0.5;
      w.cars.push({ x: ltr ? -10 : W + 10, y: rand(18, Math.max(80, H - 100)), vx: (ltr ? 1 : -1) * rand(18, 44), depth: rand(0.5, 1), blink: rand(0, 1) });
    }
    for (var ci2 = w.cars.length - 1; ci2 >= 0; ci2--) {
      var car = w.cars[ci2];
      car.x += car.vx * dt - amb * 0.2 * car.depth * dt;
      car.blink += dt;
      if (car.x < -30 || car.x > W + 30) w.cars.splice(ci2, 1);
    }

    // flame stacks: the opening shot of Blade Runner
    for (var fi = 0; fi < w.far.length; fi++) {
      var f = w.far[fi];
      if (f.kind !== "stack") continue;
      f.timer -= dt;
      if (f.timer <= 0) {
        f.timer = rand(2.5, 6);
        for (var fb = 0; fb < 7; fb++) {
          w.parts.push({
            x: f.x + 1, y: H - f.h - 2, vx: rand(-6, 6), vy: rand(-26, -10), grav: -6,
            life: rand(0.5, 1.1), max: 1.1, color: fb < 3 ? "#ffe08a" : "#ff7a2a", s: Math.random() < 0.5 ? 2 : 3, far: true
          });
        }
      }
    }

    // advertising blimp drifting over the city
    w.blimp.x -= (amb * 0.05 + 3) * dt;
    if (w.blimp.x < -70) {
      w.blimp.x = W + 70 + rand(0, 160);
      w.blimp.y = Math.round(rand(H * 0.1, H * 0.3)) + 8;
    }

    // dove
    if (w.dove) {
      w.dove.t += realDt;
      w.dove.y -= 30 * realDt;
      w.dove.x += 9 * realDt;
    }

    // lightning
    if (!reduce) {
      w.flashNext -= realDt;
      if (w.flashNext <= 0) {
        w.flash = [[0.16, 0.06], [0, 0.07], [0.24, 0.1]];
        w.flashNext = rand(12, 26);
      }
      if (w.flash.length) {
        w.flash[0][1] -= realDt;
        if (w.flash[0][1] <= 0) w.flash.shift();
      }
    }

    w.shake = Math.max(0, w.shake - realDt * 10);
  }

  function runner(dt, realDt) {
    var p = w.p;
    if (p.alive) {
      if (input.pressed) { p.buffer = 0.12; input.pressed = false; }
      p.buffer = Math.max(0, p.buffer - realDt);
      p.coyote = p.ground ? 0.08 : Math.max(0, p.coyote - realDt);
      if (p.buffer > 0) {
        if (p.ground || p.coyote > 0) {
          p.vy = JUMP;
          p.ground = false;
          p.coyote = 0;
          p.jumps = 1;
          p.buffer = 0;
          p.holding = true;
          p.holdT = 0;
          sfx("jump");
        } else if (p.jumps < 2) {
          p.vy = DJUMP;
          p.jumps = 2;
          p.buffer = 0;
          p.holding = true;
          p.holdT = 0;
          burst(PX, p.y, 6, C.phosphor, 50);
          sfx("djump");
        }
      }
      // a quick tap still gives a usable hop; holding longer goes higher
      if (p.holding) {
        p.holdT += dt;
        if (!input.down && p.holdT >= 0.09) {
          if (p.vy < CUT) p.vy = CUT;
          p.holding = false;
        }
      }
    }

    p.vy = Math.min(MAXFALL, p.vy + GRAV * dt);
    var prevY = p.y;
    p.y += p.vy * dt;
    var wasGround = p.ground;
    p.ground = false;

    if (p.alive) {
      for (var i = 0; i < w.buildings.length; i++) {
        var b = w.buildings[i];
        if (b.x > PX + 3 || b.x + b.w < PX - 3) continue;
        if (p.vy >= 0 && prevY <= b.top + 0.5 && p.y >= b.top) {
          if (!wasGround && p.vy > 260) burst(PX, b.top, 5, "rgba(185,215,235,0.8)", 50);
          p.y = b.top;
          p.vy = 0;
          p.ground = true;
          p.jumps = 0;
        } else if (p.y > b.top + 0.5) {
          var entered = PX + 3 - b.x;
          if (entered <= 7 && p.y - b.top <= 7) {
            p.y = b.top;
            p.vy = 0;
            p.ground = true;
            p.jumps = 0;
          } else if (entered <= 14) {
            die("wall");
          }
        }
      }
      if (p.y > H + 24) die("fall");
    }

    if (p.ground) p.phase += w.speed * dt * 0.11;
    else p.phase += dt * 4;

    // bullet-time afterimages
    if (w.bt > 0 && p.alive) {
      p.ghostT -= realDt;
      if (p.ghostT <= 0) {
        p.ghostT = 0.035;
        w.ghosts.push({ x: PX, y: p.y, phase: p.phase, air: !p.ground, vy: p.vy, life: 0.3, w: 0 });
      }
    }

    if (mode === "dying") {
      w.deadT += realDt;
      if (!w.dove && (w.deadT > 0.9 || p.y > H + 20)) {
        w.dove = { x: PX + 6, y: Math.min(p.y, H - 12), t: 0 };
      }
      if (w.deadT > 1.6) gameOver();
    }
  }

  function dodge(x, y, pts) {
    w.bt = 0.85;
    w.bonus += pts;
    pop(x, y - 6, text("dodge") + " +" + pts, C.phosphor);
    w.ripples.push({ x: x, y: y, r: 2, life: 0.6, w: 0 });
    sfx("dodge");
  }

  function die(cause) {
    var p = w.p;
    if (!p.alive) return;
    p.alive = false;
    w.cause = cause;
    mode = "dying";
    w.deadT = 0;
    w.bt = 0;
    w.shake = cause === "fall" ? 2 : 5;
    if (cause !== "fall") {
      p.vy = -170;
      burst(PX, p.y - 8, 14, "#d8ffe8", 110);
    }
    sfx("die");
  }

  function gameOver() {
    if (mode === "over") return;
    mode = "over";
    var s = score();
    var record = s > best;
    if (record) {
      best = s;
      try { localStorage.setItem("wiz.best", String(best)); } catch (e) {}
    }
    elBest.textContent = best;
    elFinal.textContent = s;
    elRecord.hidden = !record;
    overReady = false;
    setTimeout(function () {
      if (mode !== "over") return;
      scrOver.hidden = false;
      overReady = true;
      btnAgain.focus({ preventScroll: true });
    }, 700);
  }

  function score() { return Math.floor(w.dist / METRE) + w.bonus; }

  function burst(x, y, n, color, sp) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, s = rand(0.3, 1) * sp;
      w.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20, grav: 260, life: rand(0.25, 0.55), color: color, s: 1 });
    }
  }

  function pop(x, y, msg, color) {
    w.pops.push({ x: x, y: y, msg: msg, color: color, life: 1.1, w: 0 });
  }

  function sfx(name) { if (window.Sfx) Sfx.play(name); }

  /* ---------- drawing ---------- */

  function rect(x, y, ww, hh, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), ww, hh);
  }

  function pline(x0, y0, x1, y1) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    var dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    var dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    var err = dx + dy;
    for (var guard = 0; guard < 64; guard++) {
      ctx.fillRect(x0, y0, 1, 1);
      if (x0 === x1 && y0 === y1) break;
      var e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }

  function drawSky() {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#03060a");
    g.addColorStop(0.5, "#0a1520");
    g.addColorStop(0.8, "#1a1a1e");
    g.addColorStop(1, "#3a2414");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // searchlights sweeping the smog
    ctx.fillStyle = "rgba(170,200,220,0.05)";
    for (var i = 0; i < 2; i++) {
      var ox = W * (0.28 + i * 0.5);
      var ang = -Math.PI / 2 + Math.sin(clock * 0.22 + i * 2.1) * 0.55;
      var len = 240, spread = 0.045;
      ctx.beginPath();
      ctx.moveTo(ox, H);
      ctx.lineTo(ox + Math.cos(ang - spread) * len, H + Math.sin(ang - spread) * len);
      ctx.lineTo(ox + Math.cos(ang + spread) * len, H + Math.sin(ang + spread) * len);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawFar() {
    for (var i = 0; i < w.far.length; i++) {
      var f = w.far[i];
      if (f.x > W || f.x + f.w < 0) continue;
      if (f.kind === "pyramid") {
        var glow = ctx.createRadialGradient(f.x + f.w / 2, H - 40, 4, f.x + f.w / 2, H - 40, 110);
        glow.addColorStop(0, "rgba(255,150,60,0.16)");
        glow.addColorStop(1, "rgba(255,150,60,0)");
        ctx.fillStyle = glow;
        ctx.fillRect(f.x - 60, H - 150, f.w + 120, 150);
        // stepped pyramid with lit floors
        var steps = 14;
        for (var s = 0; s < steps; s++) {
          var tier = s / steps;
          var tw = Math.round(f.w * (1 - tier) * 0.92 + 18);
          var ty = Math.round(H - 8 - (s + 1) * (f.h / steps));
          var tx = Math.round(f.x + (f.w - tw) / 2);
          rect(tx, ty, tw, Math.ceil(f.h / steps) + 1, "#0d1822");
          for (var wx = tx + 2; wx < tx + tw - 2; wx += 3) {
            if (hash(f.seed + s * 31 + wx) < 0.42) rect(wx, ty + 2, 1, 1, hash(wx + s) < 0.8 ? "rgba(255,179,90,0.75)" : "rgba(255,240,200,0.9)");
          }
        }
      } else if (f.kind === "stack") {
        rect(f.x, H - f.h, 2, f.h, "#0b1219");
        rect(f.x - 1, H - f.h, 4, 2, "#0b1219");
      } else {
        rect(f.x, H - f.h, f.w, f.h, "#0a131c");
        for (var y = H - f.h + 3; y < H; y += 4) {
          for (var x = f.x + 2; x < f.x + f.w - 1; x += 3) {
            var hsh = hash(f.seed * 13 + x * 7 + y * 3);
            if (hsh < 0.1) {
              var tw2 = Math.sin(clock * 2 + hsh * 60) > -0.6;
              if (tw2) rect(x, y, 1, 1, hsh < 0.07 ? "rgba(255,179,90,0.6)" : "rgba(95,232,255,0.5)");
            }
          }
        }
      }
    }
  }

  function drawBlimp(b) {
    var x = Math.round(b.x), y = Math.round(b.y);
    ctx.fillStyle = "rgba(255,190,225,0.045)";
    ctx.beginPath();
    ctx.moveTo(x - 2, y + 10);
    ctx.lineTo(x - 30 + Math.sin(clock * 0.7) * 14, H);
    ctx.lineTo(x + 26 + Math.sin(clock * 0.7) * 14, H);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#121a22";
    ctx.beginPath();
    ctx.ellipse(x, y, 30, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    rect(x - 8, y + 8, 16, 3, "#0d141b");
    rect(x + 26, y - 6, 4, 12, "#0f161d");
    var glow = 0.22 + 0.08 * Math.sin(clock * 5);
    rect(x - 19, y - 5, 38, 10, "rgba(255,61,139," + glow.toFixed(3) + ")");
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - 19, y - 5, 38, 10);
    ctx.clip();
    var scrollPx = clock * 14, base = Math.floor(scrollPx / 12), off = scrollPx % 12;
    for (var i = 0; i < 5; i++) glyph("p", (base + i) % KANA.length, x - 13 + i * 12 - off, y);
    ctx.restore();
    rect(x - 30, y, 1, 1, Math.floor(clock * 2) % 2 ? "#ff3b3b" : "#3a1515");
    rect(x + 29, y - 1, 1, 1, "#9fe8ff");
  }

  function drawCars() {
    for (var i = 0; i < w.cars.length; i++) {
      var c = w.cars[i];
      var x = Math.round(c.x), y = Math.round(c.y);
      var dir = c.vx > 0 ? 1 : -1;
      ctx.fillStyle = "rgba(200,225,240,0.06)";
      ctx.beginPath();
      ctx.moveTo(x + dir * 3, y + 1);
      ctx.lineTo(x + dir * 40, y + 8);
      ctx.lineTo(x + dir * 40, y - 4);
      ctx.closePath();
      ctx.fill();
      rect(x - 3, y, 7, 2, "#141c24");
      rect(x - 2, y - 1, 4, 1, "#1e2a35");
      var on = Math.floor(c.blink * 4) % 2 === 0;
      rect(x - dir * 3, y, 1, 1, on ? "#ff3b3b" : "#3b6bff");
      rect(x + dir * 3, y + 1, 1, 1, "#fff5d6");
    }
  }

  function drawMid() {
    for (var i = 0; i < w.mid.length; i++) {
      var m = w.mid[i];
      if (m.x > W || m.x + m.w < 0) continue;
      var top = H - m.h;
      rect(m.x, top, m.w, m.h, "#0d1925");
      rect(m.x, top, 1, m.h, "#152838");
      if (m.code) {
        for (var c = 0; c < m.code.length; c++) {
          var col = m.code[c];
          col.y += col.s * (1 / 60);
          if (col.y > m.h + 50) col.y = -10;
          var cx = m.x + 6 + c * ((m.w - 10) / m.code.length);
          for (var k = 0; k < col.ch.length; k++) {
            var gy = top + col.y - k * 10;
            if (gy < top + 4 || gy > H - 4) continue;
            ctx.globalAlpha = 0.7 * (1 - k / col.ch.length);
            glyph(k === 0 ? "g" : "d", col.ch[k], cx, gy);
          }
        }
        ctx.globalAlpha = 1;
      } else {
        for (var y = top + 5; y < H - 2; y += 6) {
          for (var x = m.x + 3; x < m.x + m.w - 3; x += 4) {
            var hs = hash(m.seed * 7 + x * 3 + y * 11);
            if (hs < 0.16) rect(x, y, 2, 1, hs < 0.1 ? "rgba(255,179,90,0.45)" : "rgba(95,232,255,0.4)");
          }
        }
      }
      if (m.screen) {
        var sw = Math.min(m.w - 8, 26), sx = Math.round(m.x + (m.w - sw) / 2), sy = top + 10;
        var pulse = 0.55 + 0.25 * Math.sin(clock * 3 + m.seed);
        rect(sx, sy, sw, 16, "rgba(255,61,139," + (0.22 * pulse).toFixed(3) + ")");
        ctx.globalAlpha = 0.85;
        var off = Math.floor(clock * 6 + m.seed) % 6;
        for (var gx = 0; gx < sw - 6; gx += 8) glyph("p", (off + gx) % KANA.length, sx + 5 + gx, sy + 8);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = "rgba(255,95,162,0.6)";
        ctx.strokeRect(sx + 0.5, sy + 0.5, sw - 1, 15);
      }
      if (m.sign) {
        var sgx = Math.round(m.x + m.w - 7), sgy = top + 6;
        var lit = Math.sin(clock * 17 + m.seed * 9) > -0.92 || reduce;
        if (lit) {
          ctx.fillStyle = m.sign.color === "p" ? "rgba(255,61,139,0.18)" : "rgba(40,220,255,0.15)";
          ctx.fillRect(sgx - 7, sgy - 2, 14, m.sign.chars.length * 11 + 4);
          for (var s = 0; s < m.sign.chars.length; s++) glyph(m.sign.color, m.sign.chars[s], sgx, sgy + 4 + s * 11);
        }
      }
    }
    var haze = ctx.createLinearGradient(0, H - 60, 0, H);
    haze.addColorStop(0, "rgba(255,140,60,0)");
    haze.addColorStop(1, "rgba(255,140,60,0.12)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, H - 60, W, 60);
  }

  function drawBuildings() {
    for (var i = 0; i < w.buildings.length; i++) {
      var b = w.buildings[i];
      if (b.x > W || b.x + b.w < 0) continue;
      var x = Math.round(b.x), top = b.top;
      for (var d = 0; d < b.deco.length; d++) {
        var dc = b.deco[d], dx = Math.round(x + dc.dx);
        if (dc.kind === "antenna") {
          rect(dx, top - dc.h, 1, dc.h, "#16242f");
          if (Math.sin(clock * 3 + dc.blink) > 0.3) rect(dx, top - dc.h - 1, 1, 1, "#ff3b3b");
        } else {
          rect(dx - 5, top - dc.h + 2, 11, dc.h - 4, "#121d26");
          rect(dx - 4, top - 2, 1, 2, "#121d26");
          rect(dx + 4, top - 2, 1, 2, "#121d26");
        }
      }
      rect(x, top, b.w, H - top, C.bld);
      rect(x, top, 1, H - top, C.bldEdge);
      rect(x, top, b.w, 1, b.rim);
      ctx.globalAlpha = 0.35;
      rect(x, top + 1, b.w, 2, b.rim);
      ctx.globalAlpha = 1;
      for (var y = top + 8; y < H; y += 9) {
        for (var wx = x + 4; wx < x + b.w - 4; wx += 7) {
          var hs = hash(b.seed + wx * 0.37 + y * 1.3);
          if (hs < 0.22) rect(wx, y, 2, 3, hs < 0.15 ? "rgba(255,179,90,0.32)" : "rgba(95,232,255,0.28)");
        }
      }
    }
  }

  function drawCrates() {
    for (var i = 0; i < w.crates.length; i++) {
      var c = w.crates[i];
      if (c.x > W + 20 || c.x < -20) continue;
      ctx.save();
      ctx.translate(Math.round(c.x), Math.round(c.y - c.h / 2));
      if (c.hit) ctx.rotate(c.rot);
      var hw = Math.floor(c.w / 2), hh = Math.floor(c.h / 2);
      ctx.fillStyle = C.crateLo;
      ctx.fillRect(-hw - 1, -hh - 1, c.w + 2, c.h + 2);
      ctx.fillStyle = C.crate;
      ctx.fillRect(-hw, -hh, c.w, c.h);
      ctx.fillStyle = C.crateHi;
      ctx.fillRect(-hw, -hh, c.w, 1);
      ctx.fillStyle = C.crateLo;
      for (var gx = -hw + 2; gx < hw - 1; gx += 2) ctx.fillRect(gx, -hh + 3, 1, c.h - 5);
      ctx.restore();
    }
  }

  function drawPickups() {
    for (var i = 0; i < w.pickups.length; i++) {
      var k = w.pickups[i];
      if (k.x < -10 || k.x > W + 10) continue;
      var y = k.y + Math.sin(clock * 4 + k.bob) * 1.5;
      if (k.kind === "glyph") {
        ctx.globalAlpha = 0.35;
        rect(k.x - 4, y - 5, 9, 11, "rgba(109,255,160,0.25)");
        ctx.globalAlpha = 1;
        glyph("g", k.ch, k.x, y);
      } else {
        drawUnicorn(k.x, y);
      }
    }
  }

  function drawUnicorn(x, y) {
    ctx.save();
    ctx.translate(Math.round(x) - 8, Math.round(y) - 8);
    ctx.scale(0.5, 0.5);
    var polys = [
      ["#e8eef0", [25, 9, 30, 2.5, 26.6, 9.6]],
      ["#c3ccd1", [20, 15, 24.4, 8.2, 27.6, 10.6, 23.4, 17.6]],
      ["#a9b4ba", [9, 17.5, 20, 15, 23.4, 17.6, 21.6, 22.6, 10.4, 23.6]],
      ["#d5dde1", [15, 20, 23.4, 17.6, 21.6, 22.6]],
      ["#8e9aa1", [11, 23.4, 12.4, 30, 13.6, 23.2]],
      ["#8e9aa1", [19.4, 22.8, 20.6, 30, 21.6, 22.4]],
      ["#c3ccd1", [9, 17.5, 3.4, 19.6, 6.8, 22.4]]
    ];
    for (var i = 0; i < polys.length; i++) {
      var pts = polys[i][1];
      ctx.fillStyle = polys[i][0];
      ctx.beginPath();
      ctx.moveTo(pts[0], pts[1]);
      for (var j = 2; j < pts.length; j += 2) ctx.lineTo(pts[j], pts[j + 1]);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawAgent(a, ox, oy, tint) {
    var x = Math.round(a.x) + ox, y = Math.round(a.y) + oy;
    function k(c) { return tint || c; }
    rect(x - 2, y - 6, 1, 6, k(C.suit));
    rect(x + 1, y - 6, 1, 6, k(C.suit));
    rect(x - 2, y - 14, 5, 9, k(C.suit));
    rect(x - 1, y - 14, 1, 3, k(C.shirt));
    rect(x - 1, y - 13, 1, 3, k("#000"));
    if (a.aim > 0 || a.fired) {
      rect(x - 7, y - 12, 6, 1, k(C.suit));
      rect(x - 9, y - 13, 2, 2, k("#3a3f44"));
      if (a.flash > 0 && !tint) {
        rect(x - 12, y - 13, 3, 1, "#ffe08a");
        rect(x - 11, y - 14, 1, 3, "#fff5d6");
      }
    } else {
      rect(x - 3, y - 13, 1, 6, k(C.suit));
    }
    rect(x - 1, y - 18, 3, 4, k(C.agentSkin));
    rect(x - 1, y - 19, 3, 1, k("#1a1a1a"));
    if (!tint) {
      rect(x - 2, y - 17, 3, 1, "#000");
      rect(x - 2, y - 17, 1, 1, "#ffffff");
      rect(x + 2, y - 16, 1, 1, C.shirt);
    }
  }

  function leg(x, hipY, a) {
    var kx = x + Math.sin(a) * 3, ky = hipY + Math.cos(a) * 3;
    var bend = a < 0 ? 1 : 0.25;
    pline(x, hipY, kx, ky);
    pline(kx, ky, kx + Math.sin(a - bend) * 3, ky + Math.cos(a - bend) * 3);
  }

  function drawRunner(x, y, phase, air, vy, tint) {
    var coat = tint || C.coat, hi = tint || C.coatHi, pants = tint || C.pants;
    var bob = air ? 0 : Math.round(Math.abs(Math.sin(phase)));
    var hip = Math.round(y - 6 - bob);
    ctx.fillStyle = pants;
    if (!air) {
      leg(x, hip, Math.sin(phase) * 0.95);
      leg(x, hip, Math.sin(phase + Math.PI) * 0.95);
    } else {
      var k = vy < 0 ? 1 : 0.4;
      pline(x, hip, x + 2, hip + 2);
      pline(x + 2, hip + 2, x + 1, hip + 5);
      pline(x - 1, hip, x - 3, hip + 3 * k + 1);
      pline(x - 3, hip + 3 * k + 1, x - 4, hip + 5);
    }
    // coat tail streaming behind
    var flap = air ? (vy < 0 ? 4 : 3) : 1 + Math.round(Math.sin(phase * 2) + 1);
    ctx.fillStyle = coat;
    for (var r = 0; r < 5; r++) {
      var tw = 1 + Math.round(r * 0.6 + flap * (r / 4));
      var lift = air ? Math.round(r * 0.5) : 0;
      ctx.fillRect(Math.round(x - 2 - tw), hip - 1 + r - lift, tw + 1, 1);
    }
    ctx.fillRect(Math.round(x - 2), hip - 8, 5, 9);
    ctx.fillStyle = hi;
    ctx.fillRect(Math.round(x + 2), hip - 8, 1, 7);
    ctx.fillStyle = coat;
    var arm = air ? -1.3 : Math.sin(phase + Math.PI) * 0.9;
    pline(x + 1, hip - 6, x + 1 + Math.sin(arm) * 4, hip - 6 + Math.cos(arm) * 4);
    var hx = Math.round(x - 1), hy = hip - 12;
    rect(hx, hy, 3, 4, tint || C.skin);
    rect(hx, hy - 1, 3, 2, tint || C.hair);
    rect(hx - 1, hy, 1, 2, tint || C.hair);
    if (!tint) {
      rect(hx + 1, hy + 1, 3, 1, "#000");
      rect(hx + 3, hy + 1, 1, 1, C.phosphor);
    }
  }

  function drawDove(d) {
    var x = Math.round(d.x), y = Math.round(d.y);
    var up = Math.floor(d.t * 8) % 2 === 0;
    rect(x - 1, y, 4, 2, "#f2f5f4");
    rect(x + 3, y - 1, 2, 2, "#f2f5f4");
    rect(x + 5, y, 1, 1, "#ffb35a");
    if (up) {
      rect(x - 2, y - 3, 2, 3, "#e3e9e8");
      rect(x + 1, y - 4, 2, 4, "#e3e9e8");
    } else {
      rect(x - 2, y + 2, 2, 2, "#e3e9e8");
      rect(x + 1, y + 2, 2, 3, "#e3e9e8");
    }
    rect(x - 3, y + 1, 2, 1, "#d2dad9");
  }

  function draw() {
    var sx = 0, sy = 0;
    if (w.shake > 0 && !reduce) {
      sx = Math.round(rand(-w.shake, w.shake));
      sy = Math.round(rand(-w.shake, w.shake));
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawSky();
    drawFar();
    for (var i = 0; i < w.parts.length; i++) {
      var fp = w.parts[i];
      if (!fp.far) continue;
      ctx.globalAlpha = clamp(fp.life / (fp.max || 1), 0, 1);
      rect(fp.x, fp.y, fp.s, fp.s, fp.color);
    }
    ctx.globalAlpha = 1;
    drawBlimp(w.blimp);
    drawCars();
    drawMid();

    ctx.setTransform(1, 0, 0, 1, sx, sy);
    drawBuildings();
    drawCrates();
    drawPickups();
    for (var a = 0; a < w.agents.length; a++) {
      var ag = w.agents[a];
      if (ag.x < -10 || ag.x > W + 10) continue;
      ctx.globalAlpha = 0.7;
      drawAgent(ag, -1, 0, "#ff8fc4");
      drawAgent(ag, 0, -1, "#ff8fc4");
      ctx.globalAlpha = 1;
      drawAgent(ag, 0, 0, null);
    }
    for (var b = 0; b < w.bullets.length; b++) {
      var bl = w.bullets[b];
      rect(bl.x, bl.y, 4, 1, "#fff5d6");
      ctx.globalAlpha = 0.5;
      rect(bl.x + 4, bl.y, 6, 1, "#ffb35a");
      ctx.globalAlpha = 1;
    }
    for (var r = 0; r < w.ripples.length; r++) {
      var rp = w.ripples[r];
      ctx.strokeStyle = "rgba(109,255,160," + (rp.life * 0.9).toFixed(2) + ")";
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (var g = 0; g < w.ghosts.length; g++) {
      var gh = w.ghosts[g];
      ctx.globalAlpha = gh.life * 1.4;
      drawRunner(gh.x, gh.y, gh.phase, gh.air, gh.vy, "#2f9e63");
    }
    ctx.globalAlpha = 1;
    var p = w.p;
    if (mode !== "over" && (p.alive || p.y < H + 20)) {
      var ph = mode === "title" ? 0 : p.phase;
      var inAir = mode === "play" || mode === "dying" ? !p.ground : false;
      // neon back-light so the runner reads against the dark city
      ctx.globalAlpha = 0.85;
      drawRunner(PX - 1, p.y, ph, inAir, p.vy, "#8fe6ff");
      drawRunner(PX, p.y - 1, ph, inAir, p.vy, "#8fe6ff");
      ctx.globalAlpha = 1;
      drawRunner(PX, p.y, ph, inAir, p.vy, null);
    }
    for (var q = 0; q < w.parts.length; q++) {
      var pt = w.parts[q];
      if (pt.far) continue;
      ctx.globalAlpha = clamp(pt.life * 3, 0, 1);
      rect(pt.x, pt.y, pt.s || 1, pt.s || 1, pt.color);
    }
    ctx.globalAlpha = 1;
    ctx.font = '16px "VT323", monospace';
    ctx.textAlign = "center";
    for (var o = 0; o < w.pops.length; o++) {
      var pp = w.pops[o];
      ctx.globalAlpha = clamp(pp.life * 1.5, 0, 1);
      ctx.fillStyle = "#000";
      ctx.fillText(pp.msg, Math.round(pp.x) + 1, Math.round(pp.y) + 1);
      ctx.fillStyle = pp.color;
      ctx.fillText(pp.msg, Math.round(pp.x), Math.round(pp.y));
    }
    ctx.globalAlpha = 1;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.strokeStyle = "rgba(160,195,220,0.42)";
    ctx.beginPath();
    for (var d = 0; d < w.drops.length; d++) {
      var dr = w.drops[d];
      if (dr.near) continue;
      ctx.moveTo(dr.x, dr.y);
      ctx.lineTo(dr.x - dr.len * 0.25, dr.y - dr.len);
    }
    ctx.stroke();
    ctx.strokeStyle = "rgba(200,225,240,0.6)";
    ctx.beginPath();
    for (var e = 0; e < w.drops.length; e++) {
      var dn = w.drops[e];
      if (!dn.near) continue;
      ctx.moveTo(dn.x, dn.y);
      ctx.lineTo(dn.x - dn.len * 0.25, dn.y - dn.len);
    }
    ctx.stroke();

    if (w.dove) drawDove(w.dove);

    var slowK = 1 - w.ts;
    if (slowK > 0.02) {
      ctx.fillStyle = "rgba(40,255,140," + (0.09 * slowK).toFixed(3) + ")";
      ctx.fillRect(0, 0, W, H);
    }
    ctx.drawImage(overlay, 0, 0);
    if (w.flash.length && w.flash[0][0] > 0) {
      ctx.fillStyle = "rgba(200,220,255," + w.flash[0][0] + ")";
      ctx.fillRect(0, 0, W, H);
    }
  }

  /* ---------- loop ---------- */

  function frame(ts) {
    if (mode === "off") return;
    var t = ts / 1000;
    var realDt = last ? Math.min(0.05, t - last) : 1 / 60;
    last = t;
    clock += realDt;

    w.bt = Math.max(0, w.bt - realDt);
    var target = w.bt > 0 && mode === "play" ? 0.3 : 1;
    w.ts += (target - w.ts) * Math.min(1, realDt * 9);
    if (window.Sfx && Math.abs(w.ts - lastSlow) > 0.02) { lastSlow = w.ts; Sfx.setSlow(w.ts); }

    var sim = realDt * w.ts;
    var n = Math.max(1, Math.ceil(sim / STEP));
    for (var i = 0; i < n; i++) step(sim / n, realDt / n);

    draw();
    if (mode === "play" || mode === "dying") {
      var s = score();
      if (s !== shownScore) { shownScore = s; elScore.textContent = s; }
    }
    raf = requestAnimationFrame(frame);
  }

  /* ---------- sizing ---------- */

  function fit(allowResize) {
    var r = stage.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var changed = false;
    if (allowResize) {
      var nw = Math.round(clamp(180 * (r.width / r.height), 240, 320) / 2) * 2;
      // portrait phones: keep the width, show more sky above the roofs
      var nh = Math.round(clamp(r.height / (r.width / nw), 180, 300) / 2) * 2;
      if (nw !== W || nh !== H || !overlay) {
        W = nw;
        H = nh;
        PX = Math.round(W * 0.2);
        canvas.width = W;
        canvas.height = H;
        overlay = makeOverlay();
        changed = true;
      }
    }
    var s = Math.min(r.width / W, r.height / H);
    if (s >= 2) s = Math.floor(s);
    canvas.style.width = Math.floor(W * s) + "px";
    canvas.style.height = Math.floor(H * s) + "px";
    ctx.imageSmoothingEnabled = false;
    return changed;
  }

  /* ---------- flow ---------- */

  function toTitle() {
    mode = "title";
    newWorld();
    scrTitle.hidden = false;
    scrOver.hidden = true;
    elScore.textContent = "0";
  }

  function startRun() {
    if (mode === "play") return;
    fit(true);
    newWorld();
    w.speed = 120;
    mode = "play";
    shownScore = -1;
    input.down = false;
    input.pressed = false;
    scrTitle.hidden = true;
    scrOver.hidden = true;
    overReady = false;
    stage.focus({ preventScroll: true });
  }

  function press() {
    if (mode === "title") { startRun(); return; }
    if (mode === "over") { if (overReady) startRun(); return; }
    if (mode !== "play") return;
    input.down = true;
    input.pressed = true;
  }
  function release() { input.down = false; }

  function announce(isOpen) {
    document.dispatchEvent(new CustomEvent("wiz:game", { detail: { open: isOpen } }));
  }

  function open(from) {
    opener = from || null;
    root.hidden = false;
    document.body.classList.add("locked");
    announce(true);
    elBest.textContent = best;
    syncMute();
    if (!atlas) atlas = makeAtlas();
    fit(true);
    toTitle();
    if (window.Sfx) Sfx.start();
    last = 0;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
    btnStart.focus({ preventScroll: true });
    var fonts = document.fonts && document.fonts.load
      ? Promise.all([document.fonts.load('10px "DotGothic16"', "ｱ"), document.fonts.load('16px "VT323"', "aąćęłńóśźżŻ")])
      : Promise.resolve();
    fonts.catch(function () {}).then(function () { atlas = makeAtlas(); });
  }

  function close() {
    mode = "off";
    cancelAnimationFrame(raf);
    root.hidden = true;
    document.body.classList.remove("locked");
    lastSlow = 1;
    if (window.Sfx) { Sfx.setSlow(1); Sfx.stop(); }
    announce(false);
    if (opener) opener.focus({ preventScroll: true });
  }

  // pressed = sound on
  function syncMute() {
    var m = window.Sfx ? Sfx.isMuted() : true;
    btnMute.setAttribute("aria-pressed", String(!m));
  }

  function init(opts) {
    text = opts.text || text;
    root = document.getElementById("game");
    stage = document.getElementById("stage");
    canvas = document.getElementById("game-canvas");
    ctx = canvas.getContext("2d");
    scrTitle = document.getElementById("g-title");
    scrOver = document.getElementById("g-over");
    elScore = document.getElementById("g-score");
    elBest = document.getElementById("g-best");
    elFinal = document.getElementById("g-final");
    elRecord = document.getElementById("g-record");
    btnMute = document.getElementById("game-mute");
    btnClose = document.getElementById("game-close");
    btnStart = document.getElementById("g-start");
    btnAgain = document.getElementById("g-again");
    stage.tabIndex = -1;

    btnStart.addEventListener("click", startRun);
    btnAgain.addEventListener("click", startRun);
    btnClose.addEventListener("click", close);
    btnMute.addEventListener("click", function () {
      if (!window.Sfx) return;
      Sfx.setMuted(!Sfx.isMuted());
      syncMute();
    });

    stage.addEventListener("pointerdown", function (e) {
      if (e.target.closest("button")) return;
      e.preventDefault();
      press();
    });
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    stage.addEventListener("contextmenu", function (e) { e.preventDefault(); });

    document.addEventListener("keydown", function (e) {
      if (mode === "off") return;
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key === "Tab") { trapFocus(e); return; }
      var jumpKey = e.code === "Space" || e.key === "ArrowUp" || e.key === "w" || e.key === "W";
      if (!jumpKey) return;
      if (e.target && e.target.tagName === "BUTTON" && e.code === "Space") return;
      e.preventDefault();
      if (e.repeat) return;
      press();
    });
    document.addEventListener("keyup", function (e) {
      if (e.code === "Space" || e.key === "ArrowUp" || e.key === "w" || e.key === "W") release();
    });

    window.addEventListener("resize", function () {
      if (mode === "off") return;
      if (fit(mode !== "play" && mode !== "dying") && mode === "title") newWorld();
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden && mode !== "off") {
        input.down = false;
        last = 0;
      }
    });
  }

  function trapFocus(e) {
    var items = [btnClose, btnMute];
    if (!scrTitle.hidden) items.push(btnStart);
    if (!scrOver.hidden) items.push(btnAgain);
    var i = items.indexOf(document.activeElement);
    e.preventDefault();
    var next = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : (i + 1) % items.length;
    items[next].focus();
  }

  window.Game = {
    init: init,
    open: open,
    close: close,
    setText: function () { /* strings are read live through text() */ }
  };
  if (/[?&]debug\b/.test(location.search)) {
    window.Game.debug = function () { return { w: w, mode: mode, PX: PX, W: W }; };
  }
})();
