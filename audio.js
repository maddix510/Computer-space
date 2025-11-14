// tiny audio helper: makes short beeps using WebAudio
export const sound = (() => {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();

  function beep(freq=440, time=0.06, type='sine', vol=0.1) {
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + time);
    o.stop(ctx.currentTime + time + 0.02);
  }

  return { beep };
})();