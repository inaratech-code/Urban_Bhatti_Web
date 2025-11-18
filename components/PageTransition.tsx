'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

const transitionClass =
  'transition-all transform-gpu duration-[var(--motion-duration-slow)] ease-[var(--motion-ease-in-out)]';

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? 'root';
  const [displayedKey, setDisplayedKey] = useState(pathname);
  const [visible, setVisible] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const timerRef = useRef<number | null>(null);
  const isAdminPage = pathname.startsWith('/admin');

  useEffect(() => {
    setVisible(true);
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (pathname === displayedKey || prefersReducedMotion) {
      setDisplayedKey(pathname);
      setVisible(true);
      return;
    }

    setVisible(false);
    timerRef.current = window.setTimeout(() => {
      setDisplayedKey(pathname);
      setVisible(true);
    }, 140);
  }, [pathname, displayedKey, prefersReducedMotion]);

  const motionClass = prefersReducedMotion
    ? 'opacity-100 translate-y-0'
    : visible
    ? 'opacity-100 translate-y-0 scale-100'
    : 'opacity-0 translate-y-4 scale-[0.99]';

  if (isAdminPage) {
    return (
      <div
        key={displayedKey}
        className={`${transitionClass} ${motionClass} relative`}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      key={displayedKey}
      className={`${transitionClass} ${motionClass} relative rounded-[32px] border border-white/40 bg-white/85 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur-md`}
    >
      {children}
    </div>
  );
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener('change', updatePreference);
    return () => mediaQuery.removeEventListener('change', updatePreference);
  }, []);

  return prefersReducedMotion;
}
