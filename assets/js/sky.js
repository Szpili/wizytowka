/* Background: Matrix code columns behind Blade Runner rain. */
(function () {
  "use strict";

  var KANA = "ｦｧｨｩｪｫｬｭｮｯｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789Z:.=*+-<>|";
  var COL_W = 18;
  var GLYPH_H = 19;
  var FONT_PX = 15;
  var SLANT = 0.2;

  function rand(a, b) { return a + Math.random() * (b - a); }

  // Mirrored glyphs pre-rendered once per colour, like the film's code.
  function makeAtlas(color, dpr) {
    var c = document.createElement("canvas");
    var cw = Math.ceil(COL_W * dpr);
    var ch = Math.ceil(GLYPH_H * dpr);
    c.width = cw * KANA.length;
    c.height = ch;
    var g = c.getContext("2d");
    g.fillStyle = color;
    g.font = FONT_PX * dpr + 'px "DotGothic16", "MS Gothic", monospace';
    g.textAlign = "center";
    g.textBaseline = "middle";
    for (var i = 0; i < KANA.length; i++) {
      g.save();
      g.translate(i * cw + cw / 2, ch / 2);
      g.scale(-1, 1);
      g.fillText(KANA[i], 0, 0);
      g.restore();
    }
    return { canvas: c, cw: cw, ch: ch };
  }

  function mount(canvas, opts) {
    opts = opts || {};
    var ctx = canvas.getContext("2d");
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var isStatic = !!opts.static || reduce;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0;
    var cols = [], drops = [];
    var body, head;
    var raf = 0, last = 0, running = false, paused = false;
    var flash = { next: rand(12, 26), seq: [], t: 0 };

    function size() {
      w = opts.width || window.innerWidth;
      h = opts.height || window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      if (opts.width) {
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";
      }
    }

    // Columns behind the card are dimmer so text stays readable.
    function laneFactor(x) {
      if (opts.noLane) return 1;
      var d = Math.abs(x - w / 2);
      if (d < 230) return 0.42;
      if (d > 330) return 1;
      return 0.42 + (d - 230) / 100 * 0.58;
    }

    function newColumn(x, spread) {
      var len = Math.floor(rand(7, 24));
      var depth = rand(0.35, 1);
      var chars = [];
      for (var i = 0; i < len; i++) chars.push(Math.floor(Math.random() * KANA.length));
      return {
        x: x,
        y: spread ? rand(-h * 0.2, h * 1.1) : rand(-h * 0.6, 0),
        speed: rand(24, 66) * depth,
        len: len,
        alpha: (0.16 + depth * 0.2) * laneFactor(x),
        chars: chars,
        mut: rand(0.05, 0.4)
      };
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

    function init() {
      size();
      body = makeAtlas("#6dffa0", dpr);
      head = makeAtlas("#e6fff0", dpr);
      cols = [];
      var n = Math.ceil(w / COL_W) + 1;
      for (var i = 0; i < n; i++) {
        if (Math.random() < 0.72) cols.push(newColumn(i * COL_W + COL_W / 2, true));
      }
      drops = [];
      var count = Math.min(320, Math.floor((w * h) / 6500));
      for (var j = 0; j < count; j++) drops.push(newDrop(true));
    }

    function update(dt) {
      for (var i = 0; i < cols.length; i++) {
        var c = cols[i];
        c.y += c.speed * dt;
        c.mut -= dt;
        if (c.mut <= 0) {
          c.chars[Math.floor(Math.random() * c.len)] = Math.floor(Math.random() * KANA.length);
          c.mut = rand(0.05, 0.4);
        }
        if (c.y - c.len * GLYPH_H > h) cols[i] = newColumn(c.x, false);
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
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      var cw = body.cw, ch = body.ch;
      for (var i = 0; i < cols.length; i++) {
        var c = cols[i];
        var x = Math.round((c.x - COL_W / 2) * dpr);
        for (var k = 0; k < c.len; k++) {
          var y = c.y - k * GLYPH_H;
          if (y < -GLYPH_H || y > h) continue;
          var fade = 1 - k / c.len;
          ctx.globalAlpha = c.alpha * fade * fade * (k === 0 ? 1.6 : 1);
          var atlas = k === 0 ? head : body;
          ctx.drawImage(atlas.canvas, c.chars[k] * cw, 0, cw, ch, x, Math.round(y * dpr), cw, ch);
        }
      }
      ctx.globalAlpha = 1;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
        var step = flash.seq[0];
        if (step[0] > 0) {
          ctx.fillStyle = "rgba(190,215,255," + step[0] + ")";
          ctx.fillRect(0, 0, w, h);
        }
        flash.t += dt;
        if (flash.t >= step[1]) { flash.seq.shift(); flash.t = 0; }
      }
    }

    function frame(t) {
      if (!running) return;
      var dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016;
      last = t;
      update(dt);
      draw(dt);
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (isStatic || running || paused) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    function renderStill() {
      draw(0);
    }

    var lastW = 0;
    function onResize() {
      var nw = window.innerWidth;
      if (nw !== lastW) {
        lastW = nw;
        init();
      } else {
        size();
      }
      if (isStatic) renderStill();
    }

    init();
    lastW = w;

    var fontsReady = document.fonts && document.fonts.load
      ? document.fonts.load(FONT_PX + 'px "DotGothic16"', "ｱ")
      : Promise.resolve();
    fontsReady.catch(function () {}).then(function () {
      body = makeAtlas("#6dffa0", dpr);
      head = makeAtlas("#e6fff0", dpr);
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
