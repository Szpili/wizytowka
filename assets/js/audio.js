/* Tiny WebAudio synth: a Vangelis-ish pad, rain noise and arcade blips. */
(function () {
  "use strict";

  var ctx = null, master = null, delay = null;
  var pad = null, rain = null;
  var slow = 1;
  var muted = false;
  try { muted = localStorage.getItem("wiz.mute") === "1"; } catch (e) {}

  function ensure() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.55;
    master.connect(ctx.destination);

    delay = ctx.createDelay(1);
    delay.delayTime.value = 0.34;
    var fb = ctx.createGain();
    fb.gain.value = 0.38;
    var wet = ctx.createGain();
    wet.gain.value = 0.32;
    delay.connect(fb);
    fb.connect(delay);
    delay.connect(wet);
    wet.connect(master);
    return ctx;
  }

  function noiseBuffer(sec) {
    var len = Math.floor(ctx.sampleRate * sec);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  function startAmbience() {
    if (!ensure() || pad) return;
    if (ctx.state === "suspended") ctx.resume();
    var t = ctx.currentTime;

    // D minor add9 pad: detuned saws through a slowly breathing low-pass
    var bus = ctx.createGain();
    bus.gain.setValueAtTime(0, t);
    bus.gain.linearRampToValueAtTime(0.42, t + 3);
    var filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 650;
    filter.Q.value = 3;
    var lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    var lfoAmt = ctx.createGain();
    lfoAmt.gain.value = 260;
    lfo.connect(lfoAmt);
    lfoAmt.connect(filter.frequency);
    lfo.start();
    var voices = [];
    [73.42, 110, 146.83, 164.81, 220].forEach(function (f) {
      [-8, 8].forEach(function (cents) {
        var o = ctx.createOscillator();
        o.type = "sawtooth";
        o.frequency.value = f;
        o.detune.value = cents;
        var g = ctx.createGain();
        g.gain.value = 0.028;
        o.connect(g);
        g.connect(filter);
        o.start();
        voices.push({ osc: o, cents: cents });
      });
    });
    filter.connect(bus);
    bus.connect(master);
    bus.connect(delay);
    pad = { bus: bus, filter: filter, lfo: lfo, voices: voices };

    var src = ctx.createBufferSource();
    src.buffer = noiseBuffer(2);
    src.loop = true;
    var bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2600;
    bp.Q.value = 0.5;
    var rg = ctx.createGain();
    rg.gain.setValueAtTime(0, t);
    rg.gain.linearRampToValueAtTime(0.07, t + 1.5);
    src.connect(bp);
    bp.connect(rg);
    rg.connect(master);
    src.start();
    rain = { src: src, filter: bp, gain: rg };
    setSlow(1);
  }

  function stopAmbience() {
    if (!ctx) return;
    var t = ctx.currentTime;
    if (pad) {
      var p = pad;
      pad = null;
      p.bus.gain.cancelScheduledValues(t);
      p.bus.gain.setTargetAtTime(0, t, 0.15);
      setTimeout(function () {
        p.voices.forEach(function (v) { try { v.osc.stop(); } catch (e) {} });
        try { p.lfo.stop(); } catch (e) {}
        p.bus.disconnect();
      }, 900);
    }
    if (rain) {
      var r = rain;
      rain = null;
      r.gain.gain.cancelScheduledValues(t);
      r.gain.gain.setTargetAtTime(0, t, 0.15);
      setTimeout(function () {
        try { r.src.stop(); } catch (e) {}
        r.gain.disconnect();
      }, 900);
    }
    setTimeout(function () {
      if (ctx && !pad && ctx.state === "running") ctx.suspend();
    }, 1000);
  }

  // k = 1 normal time, ~0.3 bullet time: pitch and filters drop
  function setSlow(k) {
    if (!ctx) return;
    slow = k;
    var t = ctx.currentTime;
    if (pad) {
      pad.filter.frequency.setTargetAtTime(650 * (0.45 + 0.55 * k), t, 0.08);
      pad.voices.forEach(function (v) {
        v.osc.detune.setTargetAtTime(v.cents - (1 - k) * 500, t, 0.1);
      });
    }
    if (rain) {
      rain.filter.frequency.setTargetAtTime(2600 * (0.35 + 0.65 * k), t, 0.08);
      rain.src.playbackRate.setTargetAtTime(0.4 + 0.6 * k, t, 0.08);
    }
  }

  function tone(type, f0, f1, dur, vol, send) {
    var t = ctx.currentTime;
    var bend = 0.5 + 0.5 * slow;
    var o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0 * bend, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1 * bend), t + dur);
    var g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(master);
    if (send) g.connect(delay);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function noise(dur, vol, type, f0, f1) {
    var t = ctx.currentTime;
    var src = ctx.createBufferSource();
    src.buffer = noiseBuffer(dur + 0.05);
    var f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(f0, t);
    f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    var g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(master);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  var SFX = {
    jump: function () { tone("square", 260, 520, 0.09, 0.07); },
    djump: function () { tone("square", 420, 900, 0.1, 0.06); noise(0.08, 0.05, "highpass", 3000, 6000); },
    pickup: function () { tone("sine", 1180, 1760, 0.09, 0.08, true); },
    unicorn: function () {
      [660, 880, 1320, 1760].forEach(function (f, i) {
        setTimeout(function () { if (ctx && !muted) tone("triangle", f, f, 0.16, 0.07, true); }, i * 70);
      });
    },
    crash: function () { noise(0.18, 0.16, "lowpass", 900, 200); },
    shot: function () { noise(0.12, 0.12, "bandpass", 1800, 600); tone("square", 140, 60, 0.08, 0.05); },
    dodge: function () { noise(0.6, 0.1, "bandpass", 2400, 260); tone("sine", 90, 50, 0.6, 0.1); },
    die: function () { tone("sawtooth", 220, 55, 0.9, 0.08, true); noise(0.4, 0.08, "lowpass", 1200, 150); }
  };

  window.Sfx = {
    start: startAmbience,
    stop: stopAmbience,
    setSlow: setSlow,
    play: function (name) {
      if (!ctx || muted || !SFX[name] || ctx.state !== "running") return;
      SFX[name]();
    },
    setMuted: function (m) {
      muted = !!m;
      try { localStorage.setItem("wiz.mute", muted ? "1" : "0"); } catch (e) {}
      if (master) master.gain.setTargetAtTime(muted ? 0 : 0.55, ctx.currentTime, 0.05);
    },
    isMuted: function () { return muted; }
  };
})();
