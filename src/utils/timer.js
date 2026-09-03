/**
 * Timer helpers and Web Audio synthesizer alerts for TRACULATOR.
 * Provides offline sound alerts and precision time formatting.
 */

/**
 * Formats seconds into MM:SS or HH:MM:SS
 * @param {number} totalSeconds 
 * @param {boolean} forceHours 
 * @returns {string}
 */
export function formatDigitalTime(totalSeconds, forceHours = false) {
  const sec = Math.max(0, Math.floor(totalSeconds || 0));
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const remainingSecs = sec % 60;

  const pad = (n) => String(n).padStart(2, '0');

  if (hrs > 0 || forceHours) {
    return `${pad(hrs)}:${pad(mins)}:${pad(remainingSecs)}`;
  }
  return `${pad(mins)}:${pad(remainingSecs)}`;
}

/**
 * Plays a loud, clear acoustic alarm chime using the Web Audio API.
 * Works 100% offline without external audio files.
 * Used when a countdown timer reaches 00:00 in noisy outdoor field conditions.
 */
export function playCompletionChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Play a sequence of 3 high-pitch attention beeps
    const beepFrequencies = [880, 1046.5, 1318.5, 1760]; // A5, C6, E6, A6

    beepFrequencies.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + index * 0.18);

      gain.gain.setValueAtTime(0, now + index * 0.18);
      gain.gain.linearRampToValueAtTime(0.4, now + index * 0.18 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.18 + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + index * 0.18);
      osc.stop(now + index * 0.18 + 0.26);
    });

    // Also trigger mobile device vibration if supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 400]);
    }
  } catch (err) {
    console.warn('Audio alert could not be played:', err);
  }
}

/**
 * Short button click feedback sound for outdoor tactile responsiveness
 */
export function playClickFeedback() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.07);
  } catch (e) {
    // Ignore audio context errors silently
  }
}
