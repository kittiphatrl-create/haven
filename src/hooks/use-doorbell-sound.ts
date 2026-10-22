"use client";

import { useCallback, useEffect, useRef } from "react";

export function useDoorbellSound() {
  const current = useRef<AudioContext | null>(null);

  const stop = useCallback(() => {
    const context = current.current;
    current.current = null;
    if (context && context.state !== "closed")
      void context.close().catch(() => {});
  }, []);

  useEffect(() => stop, [stop]);

  const play = useCallback(async () => {
    stop();
    try {
      const context = new AudioContext();
      current.current = context;
      await context.resume();
      if (current.current !== context || context.state === "closed") return;

      const volume = context.createGain();
      volume.gain.value = 0.5;
      volume.connect(context.destination);
      const start = context.currentTime + 0.015;
      const partials = [
        [1, 0.48],
        [2.76, 0.12],
        [5.4, 0.025],
      ];

      for (const [note, frequency] of [659.25, 523.25].entries()) {
        const strike = start + note * 0.6;
        for (const [partial, amplitude] of partials) {
          const oscillator = context.createOscillator();
          const envelope = context.createGain();
          oscillator.type = "sine";
          oscillator.frequency.value = frequency * partial;
          envelope.gain.setValueAtTime(0, strike);
          envelope.gain.linearRampToValueAtTime(amplitude, strike + 0.004);
          envelope.gain.exponentialRampToValueAtTime(0.0001, strike + 1.65);
          oscillator.connect(envelope);
          envelope.connect(volume);
          oscillator.start(strike);
          oscillator.stop(strike + 1.7);
          oscillator.onended = () => {
            oscillator.disconnect();
            envelope.disconnect();
            if (note === 1 && partial === 5.4 && current.current === context)
              stop();
          };
        }
      }
    } catch {
      stop();
    }
  }, [stop]);

  return { play, stop };
}
