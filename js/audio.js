/* Módulo de música ambiental sintetizada.
   - Web Audio API, sin archivos de audio.
   - Se activa solo con interacción del usuario.
   - Estado persistente en localStorage.
   - Versión "Grandeza celestial": pads amplios, eco lejano,
     bajo profundo y campanas etéreas. */

const AmbientMusic = (() => {
  let ctx = null;
  let masterGain = null;
  let isPlaying = false;
  let schedulerId = null;
  let currentStep = 0;

  // --- Configuración musical ---
  const BPM = 66;               // más lento = más grande
  const stepDur = 60 / BPM / 4; // semicorchea
  const lookAhead = 0.1;
  const nextNoteTime = { v: 0 };

  // Progresión: Dm - Bb - F - C (épica, con aire de catedral)
  const chords = [
    [50, 53, 57], // Dm
    [46, 50, 53], // Bb
    [41, 45, 48], // F
    [48, 52, 55], // C
  ];

  // Escala pentatónica menor de D para el arpegio celestial
  const arpNotes = [74, 77, 79, 81, 84, 81, 79, 77];

  const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);

  // --- Inicialización perezosa ---
  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();

    masterGain = ctx.createGain();
    masterGain.gain.value = 0.0;
    masterGain.connect(ctx.destination);

    // --- Reverb celestial: delay largo + feedback + filtro ---
    const delay = ctx.createDelay(2.5);
    delay.delayTime.value = 0.68; // eco amplio
    const feedback = ctx.createGain();
    feedback.gain.value = 0.42;
    const wet = ctx.createGain();
    wet.gain.value = 0.35;
    const damp = ctx.createBiquadFilter();
    damp.type = 'lowpass';
    damp.frequency.value = 2400; // el eco se va apagando, más "aire"

    delay.connect(damp);
    damp.connect(feedback);
    feedback.connect(delay);
    delay.connect(wet);
    wet.connect(masterGain);

    ctx._delaySend = delay;

    // Segundo delay más corto para dar amplitud estéreo
    const delay2 = ctx.createDelay(1.0);
    delay2.delayTime.value = 0.24;
    const wet2 = ctx.createGain();
    wet2.gain.value = 0.18;
    delay2.connect(wet2);
    wet2.connect(masterGain);

    ctx._delayShort = delay2;
  }

  // --- Helpers de síntesis ---
  function playPad(freq, time, dur) {
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;
    osc2.type = 'sine';
    osc2.frequency.value = freq * 1.002;
    osc2.detune.value = 5;
    osc3.type = 'triangle';
    osc3.frequency.value = freq * 0.5;
    osc3.detune.value = -4;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, time);
    filter.frequency.linearRampToValueAtTime(1400, time + dur * 0.4);
    filter.frequency.linearRampToValueAtTime(700, time + dur);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.10, time + dur * 0.35);
    gain.gain.linearRampToValueAtTime(0, time + dur);

    osc.connect(filter);
    osc2.connect(filter);
    osc3.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    if (ctx._delaySend) gain.connect(ctx._delaySend);

    osc.start(time);
    osc2.start(time);
    osc3.start(time);
    osc.stop(time + dur);
    osc2.stop(time + dur);
    osc3.stop(time + dur);
  }

  function playBass(freq, time, dur) {
    const osc = ctx.createOscillator();
    const sub = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.value = freq;
    sub.type = 'sine';
    sub.frequency.value = freq * 0.5; // sub-bajo profundo

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(0.22, time + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(filter);
    sub.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    osc.start(time);
    sub.start(time);
    osc.stop(time + dur);
    sub.stop(time + dur);
  }

  // Campana etérea: sine con armónico brillante y eco celestial
  function playBell(freq, time) {
    const osc = ctx.createOscillator();
    const harm = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;
    harm.type = 'sine';
    harm.frequency.value = freq * 2.01; // armónico inharmónico = campana
    harm.detune.value = 3;

    const harmGain = ctx.createGain();
    harmGain.gain.value = 0.25;

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(0.09, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 1.4);

    osc.connect(gain);
    harm.connect(harmGain);
    harmGain.connect(gain);
    gain.connect(masterGain);
    if (ctx._delaySend) gain.connect(ctx._delaySend);
    if (ctx._delayShort) gain.connect(ctx._delayShort);

    osc.start(time);
    harm.start(time);
    osc.stop(time + 1.5);
    harm.stop(time + 1.5);
  }

  // Pluck suave tipo arpa para el arpegio
  function playPluck(freq, time) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, time);
    filter.frequency.exponentialRampToValueAtTime(600, time + 0.3);

    gain.gain.setValueAtTime(0.045, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.6);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    if (ctx._delaySend) gain.connect(ctx._delaySend);

    osc.start(time);
    osc.stop(time + 0.7);
  }

  // Kick profundo y envolvente (latido grave, sin agresividad)
  function playKick(time) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, time);
    osc.frequency.exponentialRampToValueAtTime(32, time + 0.28);

    gain.gain.setValueAtTime(0.28, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(time);
    osc.stop(time + 0.4);
  }

  // --- Scheduler ---
  function scheduleStep(step, time) {
    const chordIdx = Math.floor(step / 16) % chords.length;
    const chord = chords[chordIdx];
    const stepInBar = step % 16;

    // Pad sostenido al inicio de cada compás (muy largo, llena el espacio)
    if (stepInBar === 0) {
      chord.forEach((n) => playPad(midiToFreq(n), time, stepDur * 16));
    }

    // Bajo profundo en 1 y 3, más largo para dar gravedad
    if (stepInBar === 0 || stepInBar === 8) {
      playBass(midiToFreq(chord[0] - 12), time, stepDur * 8);
    }

    // Kick grave en 1 y 3 (latido del corazón)
    if (stepInBar === 0 || stepInBar === 8) {
      playKick(time);
    }

    // Campanas celestiales: notas altas esporádicas con mucho eco
    if (stepInBar % 8 === 4 && Math.random() > 0.4) {
      const bellNote = arpNotes[Math.floor(Math.random() * arpNotes.length)] + 12;
      playBell(midiToFreq(bellNote), time);
    }

    // Arpegio de arpa: respira, no en todos los pasos
    if (stepInBar % 2 === 0 && Math.random() > 0.45) {
      const note = arpNotes[(step / 2) % arpNotes.length];
      playPluck(midiToFreq(note), time);
    }
  }

  function scheduler() {
    while (nextNoteTime.v < ctx.currentTime + lookAhead) {
      scheduleStep(currentStep, nextNoteTime.v);
      nextNoteTime.v += stepDur;
      currentStep++;
    }
  }

  // --- API pública ---
  function fadeTo(value, seconds = 1.6) {
    const now = ctx.currentTime;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setValueAtTime(masterGain.gain.value, now);
    masterGain.gain.linearRampToValueAtTime(value, now + seconds);
  }

  function start() {
    init();
    if (ctx.state === 'suspended') ctx.resume();
    if (isPlaying) return;

    isPlaying = true;
    nextNoteTime.v = ctx.currentTime + 0.1;
    currentStep = 0;
    fadeTo(0.55, 2.0); // entrada lenta = grandeza
    schedulerId = setInterval(scheduler, 25);
    localStorage.setItem('litv-music', 'on');
    updateButtons();
  }

  function stop() {
    if (!isPlaying) return;
    isPlaying = false;
    fadeTo(0, 1.4); // salida lenta
    setTimeout(() => {
      if (schedulerId) clearInterval(schedulerId);
      schedulerId = null;
    }, 1600);
    localStorage.setItem('litv-music', 'off');
    updateButtons();
  }

  function toggle() {
    isPlaying ? stop() : start();
  }

  function updateButtons() {
    document.querySelectorAll('.music-toggle').forEach((btn) => {
      btn.classList.toggle('playing', isPlaying);
      btn.setAttribute('aria-pressed', String(isPlaying));
      const label = btn.querySelector('.music-label');
      if (label) label.textContent = isPlaying ? 'Música: ON' : 'Música: OFF';
    });
  }

  // Estado inicial del botón, sin arrancar audio (política del navegador)
  document.addEventListener('DOMContentLoaded', () => {
    updateButtons();
  });

  return { start, stop, toggle, isPlaying: () => isPlaying };
})();