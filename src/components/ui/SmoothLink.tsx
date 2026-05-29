'use client';

import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';

type SmoothLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  href: string;
  offset?: number;
  onNavigate?: () => void;
};

export function SmoothLink({
  children,
  href,
  offset = 20,
  onClick,
  onNavigate,
  ...props
}: SmoothLinkProps) {
  const scrollTo = useSmoothScroll(offset);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (href.startsWith('#')) {
      event.preventDefault();
      scrollTo(href);
      onNavigate?.();
    }

    onClick?.(event);
  }

  return (
    <a href={href} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}
