import confetti from "canvas-confetti";

export const MOBILE_CELEBRATION_MS = 5000;
export const CELEBRATION_PHRASE_MS = 1200;
export const CELEBRATION_FALL_DURATION_S = 3.6;

const SIFI_COLORS = ["#1B7339", "#8DC63F", "#FFD700", "#ffffff"];

export function isMobileViewport(): boolean {
  return window.innerWidth < 768;
}

export function fireMobileScholarConfetti() {
  const end = Date.now() + MOBILE_CELEBRATION_MS;

  const frame = () => {
    confetti({
      particleCount: 4,
      angle: 90,
      spread: 80,
      startVelocity: 35,
      gravity: 1.2,
      scalar: 1.1,
      drift: 0,
      ticks: 320,
      origin: { x: Math.random(), y: 0 },
      colors: SIFI_COLORS,
      zIndex: 99999,
      disableForReducedMotion: false,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  confetti({
    particleCount: 80,
    angle: 90,
    spread: 100,
    startVelocity: 40,
    gravity: 1,
    scalar: 1,
    origin: { x: 0.5, y: 0.05 },
    colors: SIFI_COLORS,
    zIndex: 99999,
    disableForReducedMotion: false,
  });

  frame();
}
