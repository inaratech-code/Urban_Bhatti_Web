'use client';

import { useEffect } from 'react';

export default function VisitTracker() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storageKey = 'ub-visit-tracked';
    const lastTracked = window.sessionStorage.getItem(storageKey);
    if (lastTracked) {
      return;
    }

    window.sessionStorage.setItem(storageKey, new Date().toISOString());

    fetch('/api/metrics/visit', {
      method: 'POST'
    }).catch((error) => {
      console.error('Failed to record visit', error);
    });
  }, []);

  return null;
}
