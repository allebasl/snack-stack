'use strict';
/* ===================== sound ===================== */
const sound = (() => {
  let ctx = null;
  let muted = false;
  try { muted = localStorage.getItem('snackstack.muted') === '1'; } catch (e) {}
  function ac() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, start, dur, type = 'triangle', vol = 0.15, slideTo = null) {
    const c = ac(); if (!c || muted) return;
    const t0 = c.currentTime + start;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  return {
    get muted() { return muted; },
    toggle() { muted = !muted; try { localStorage.setItem('snackstack.muted', muted ? '1' : '0'); } catch (e) {} },
    click() { tone(620, 0, 0.07, 'triangle', 0.12, 420); },
    pop() { tone(660, 0, 0.08, 'sine', 0.18); tone(880, 0.06, 0.08, 'sine', 0.18); tone(1180, 0.12, 0.12, 'sine', 0.16); },
    lose() { tone(420, 0, 0.7, 'sawtooth', 0.08, 110); tone(300, 0.15, 0.6, 'triangle', 0.1, 90); },
    win() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.18, 'triangle', 0.15)); },
    nope() { tone(180, 0, 0.08, 'square', 0.05); },
  };
})();
