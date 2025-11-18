'use client';

import { ReactNode, useEffect, useRef } from 'react';

type NotificationSoundProviderProps = {
  children: ReactNode;
};

export default function NotificationSoundProvider({ children }: NotificationSoundProviderProps) {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const handler = () => {
      if (typeof window === 'undefined') return;
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext) as
        | typeof AudioContext
        | undefined;
      if (!AudioContextClass) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass();
      }

      const ctx = audioContextRef.current;
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => undefined);
      }

      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(1560, ctx.currentTime);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.5);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
    };

    window.addEventListener('play-notification-sound', handler);
    return () => window.removeEventListener('play-notification-sound', handler);
  }, []);

  return <>{children}</>;
}
