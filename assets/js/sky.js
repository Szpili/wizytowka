/*
 * Background: Matrix code columns behind Blade Runner rain.
 * Cheap by design: 1x resolution, ~30 fps, one pre-rendered strip per code column,
 * gradients baked once, and it steps its quality down on machines that cannot keep up.
 */
(function () {
  "use strict";

  var KANA = "ｦｧｨｩｪｫｬｭｮｯｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789Z:.=*+-<>|";
  var COL_W = 18;
  var GLYPH_H = 19;
  var FONT_PX = 15;
  var SLANT = 0.2;
  // quality steps: target frame rate and share of columns/drops kept
  var FPS = [30, 30, 20];
  var KEEP = [1, 0.55, 0.75];
  // big monitors get a capped backing store, upscaled by CSS: the layer is soft anyway
  var MAX_PIXELS = 1.2e6;

  function rand(a, b) { return a + Math.random() * (b - a); }

  // Mirrored glyphs pre-rendered once per colour, like the film's code.
  function makeAtlas(color) {
    var c = document.createElement("canvas");
    c.width = COL_W * KANA.length;
    c.height = GLYPH_H;
    var g = c.getContext("2d");
    g.fillStyle = color;
    g.font = FONT_PX + 'px "DotGothic16", "MS Gothic", monospace';
    g.textAlign = "center";
    g.textBaseline = "middle";
    for (var i = 0; i < KANA.length; i++) {
      g.save();
      g.translate(i * COL_W + COL_W / 2, GLYPH_H / 2);
      g.scale(-1, 1);
      g.fillText(KANA[i], 0, 0);
      g.restore();
    }
    return c;
  }

  function mount(canvas, opts) {
    opts = opts || {};
    var ctx = canvas.getContext("2d", { alpha: false });
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var isStatic = !!opts.static || reduce;
    var w = 0, h = 0, scale = 1;
    var cols = [], drops = [];
    var body = makeAtlas("#6dffa0"), head = makeAtlas("#e6fff0");
    var backdrop = null;
    var raf = 0, last = 0, running = false, paused = false;
    var step = 0, frames = -60, late = 0;
    var flash = { next: rand(12, 26), seq: [], t: 0 };

    // The layer is soft background: 1x on dense screens, capped on very large ones.
    function size() {
      w = opts.width || window.innerWidth;
      h = opts.height || window.innerHeight;
      scale = opts.width ? 1 : Math.min(1, Math.sqrt(MAX_PIXELS / (w * h)));
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      if (opts.width) {
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";
      }
      backdrop = makeBackdrop();
    }

    function glow(g, cx, cy, rx, ry, rgb, alpha, end) {
      g.save();
      g.translate(cx, cy);
      g.scale(1, ry / rx);
      var gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
      gr.addColorStop(0, "rgba(" + rgb + "," + alpha + ")");
      gr.addColorStop(end, "rgba(" + rgb + ",0)");
      g.fillStyle = gr;
      g.fillRect(-cx, (-cy * rx) / ry, w, (h * rx) / ry);
      g.restore();
    }

    // Same gradients as the body background, baked once per size.
    function makeBackdrop() {
      var c = document.createElement("canvas");
      c.width = canvas.width;
      c.height = canvas.height;
      var g = c.getContext("2d", { alpha: false });
      g.scale(scale, scale);
      var lin = g.createLinearGradient(0, 0, 0, h);
      lin.addColorStop(0, "#04080b");
      lin.addColorStop(0.55, "#071017");
      lin.addColorStop(1, "#0c1114");
      g.fillStyle = lin;
      g.fillRect(0, 0, w, h);
      glow(g, w, h * 0.85, w * 0.45, h * 0.35, "40,200,255", 0.08, 0.7);
      glow(g, 0, h, w * 0.55, h * 0.4, "255,61,139", 0.1, 0.7);
      glow(g, w * 0.5, h * 1.12, w * 1.2, h * 0.55, "255,140,40", 0.2, 0.62);
      return c;
    }

    // Columns behind the card are dimmer so text stays readable.
    function laneFactor(x) {
      if (opts.noLane) return 1;
      var d = Math.abs(x - w / 2);
      if (d < 230) return 0.42;
      if (d > 330) return 1;
      return 0.42 + ((d - 230) / 100) * 0.58;
    }

    // Each column is a strip canvas: head glyph at the bottom, fading tail above.
    function paintCell(c, k) {
      var r = c.len - 1 - k;
      var fade = 1 - k / c.len;
      c.g.clearRect(0, r * GLYPH_H, COL_W, GLYPH_H);
      c.g.globalAlpha = Math.min(1, fade * fade * (k === 0 ? 1.6 : 1));
      c.g.drawImage(k === 0 ? head : body, c.chars[k] * COL_W, 0, COL_W, GLYPH_H, 0, r * GLYPH_H, COL_W, GLYPH_H);
    }

    function paintColumn(c) {
      for (var k = 0; k < c.len; k++) paintCell(c, k);
    }

    function resetColumn(c, spread) {
      var depth = rand(0.35, 1);
      c.len = Math.floor(rand(7, 24));
      c.y = spread ? rand(-h * 0.2, h * 1.1) : rand(-h * 0.6, 0);
      c.speed = rand(24, 66) * depth;
      c.alpha = (0.16 + depth * 0.2) * laneFactor(c.x);
      c.mut = rand(0.05, 0.4);
      c.chars = [];
      for (var i = 0; i < c.len; i++) c.chars.push(Math.floor(Math.random() * KANA.length));
      c.strip.width = COL_W;
      c.strip.height = c.len * GLYPH_H;
      paintColumn(c);
    }

    function newColumn(x) {
      var strip = document.createElement("canvas");
      var c = { x: x, strip: strip, g: strip.getContext("2d") };
      resetColumn(c, true);
      return c;
    }

    function newDrop(spread) {
      var near = Math.random() < 0.18;
      return {
        x: rand(-h * SLANT, w),
        y: spread ? rand(-40, h) : rand(-h * 0.4, -20),
        len: near ? rand(18, 30) : rand(8, 18),
        speed: near ? rand(880, 1100) : rand(560, 820),
        bucket: near ? 2 : (Math.random() < 0.5 ? 0 : 1)
      };
    }

    function thin(list, keep) {
      return list.filter(function () { return Math.random() < keep; });
    }

    function init() {
      size();
      cols = [];
      var n = Math.ceil(w / COL_W) + 1;
      for (var i = 0; i < n; i++) {
        if (Math.random() < 0.72) cols.push(newColumn(i * COL_W + COL_W / 2));
      }
      drops = [];
      var count = Math.min(320, Math.floor((w * h) / 6500));
      for (var j = 0; j < count; j++) drops.push(newDrop(true));
      for (var s = 1; s <= step; s++) {
        cols = thin(cols, KEEP[s]);
        drops = thin(drops, KEEP[s]);
      }
    }

    function update(dt) {
      for (var i = 0; i < cols.length; i++) {
        var c = cols[i];
        c.y += c.speed * dt;
        c.mut -= dt;
        if (c.mut <= 0) {
          var k = Math.floor(Math.random() * c.len);
          c.chars[k] = Math.floor(Math.random() * KANA.length);
          paintCell(c, k);
          c.mut = rand(0.05, 0.4);
        }
        if (c.y - c.len * GLYPH_H > h) resetColumn(c, false);
      }
      for (var j = 0; j < drops.length; j++) {
        var d = drops[j];
        d.y += d.speed * dt;
        d.x += d.speed * SLANT * dt;
        if (d.y - d.len > h) drops[j] = newDrop(false);
      }
      if (!isStatic && !opts.noFlash) {
        flash.next -= dt;
        if (flash.next <= 0) {
          flash.seq = [[0.07, 0.07], [0, 0.06], [0.11, 0.09], [0, 0]];
          flash.t = 0;
          flash.next = rand(16, 34);
        }
      }
    }

    function draw(dt) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.drawImage(backdrop, 0, 0);
      ctx.setTransform(scale, 0, 0, scale, 0, 0);

      for (var i = 0; i < cols.length; i++) {
        var c = cols[i];
        var top = c.y - (c.len - 1) * GLYPH_H;
        if (top > h || c.y + GLYPH_H < 0) continue;
        ctx.globalAlpha = c.alpha;
        ctx.drawImage(c.strip, Math.round(c.x - COL_W / 2), Math.round(top));
      }
      ctx.globalAlpha = 1;

      var styles = ["rgba(169,199,216,0.14)", "rgba(169,199,216,0.24)", "rgba(200,225,238,0.36)"];
      for (var b = 0; b < 3; b++) {
        ctx.strokeStyle = styles[b];
        ctx.lineWidth = b === 2 ? 1.3 : 1;
        ctx.beginPath();
        for (var j = 0; j < drops.length; j++) {
          var d = drops[j];
          if (d.bucket !== b) continue;
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x - d.len * SLANT, d.y - d.len);
        }
        ctx.stroke();
      }

      if (flash.seq.length) {
        var fs = flash.seq[0];
        if (fs[0] > 0) {
          ctx.fillStyle = "rgba(190,215,255," + fs[0] + ")";
          ctx.fillRect(0, 0, w, h);
        }
        flash.t += dt;
        if (flash.t >= fs[1]) { flash.seq.shift(); flash.t = 0; }
      }
    }

    // Frames that keep arriving late mean the machine is struggling: thin out, then slow down.
    function govern(gap) {
      frames++;
      if (frames <= 0) return;
      if (gap > 1350 / FPS[step]) late++;
      if (frames < 60) return;
      if (late > 20 && step < FPS.length - 1) {
        step++;
        cols = thin(cols, KEEP[step]);
        drops = thin(drops, KEEP[step]);
      }
      frames = 0;
      late = 0;
    }

    function frame(t) {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      if (!last) { last = t; return; }
      var gap = t - last;
      if (gap < 1000 / FPS[step] - 4) return;
      last = t;
      var dt = Math.min(0.1, gap / 1000);
      update(dt);
      draw(dt);
      govern(gap);
    }

    function start() {
      if (isStatic || running || paused) return;
      running = true;
      last = 0;
      frames = Math.min(frames, -30);
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    function renderStill() {
      draw(0);
    }

    var lastW = 0, resizeTimer = 0;
    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        var nw = window.innerWidth;
        if (nw !== lastW) {
          lastW = nw;
          init();
        } else {
          size();
        }
        if (isStatic || !running) renderStill();
      }, 120);
    }

    init();
    lastW = w;

    var fontsReady = document.fonts && document.fonts.load
      ? document.fonts.load(FONT_PX + 'px "DotGothic16"', "ｱ")
      : Promise.resolve();
    fontsReady.catch(function () {}).then(function () {
      body = makeAtlas("#6dffa0");
      head = makeAtlas("#e6fff0");
      cols.forEach(paintColumn);
      if (isStatic) renderStill(); else start();
    });

    if (!opts.width) {
      window.addEventListener("resize", onResize);
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) stop(); else start();
      });
    }

    return {
      start: start,
      stop: stop,
      renderStill: renderStill,
      pause: function () { paused = true; stop(); },
      resume: function () { paused = false; start(); }
    };
  }

  window.Sky = { mount: mount };
})();
