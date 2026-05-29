'use client';

import { useCallback } from 'react';

type ScrollTarget = string | HTMLElement | null | undefined;

export function useSmoothScroll(defaultOffset = 0) {
  return useCallback(
    (target: ScrollTarget, offset = defaultOffset) => {
      if (!target) return;

      let element: Element | null = null;

      if (target instanceof HTMLElement) {
        element = target;
      } else {
        const id = target.startsWith('#') ? target.slice(1) : target;
        element = document.getElementById(id) || document.querySelector(`#${id}`);
      }

      if (!element) return;

      const rect = element.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      window.scrollTo({
        top: Math.max(0, rect.top + scrollTop - offset),
        behavior: 'smooth',
      });
    },
    [defaultOffset],
  );
}
