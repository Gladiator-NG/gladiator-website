'use client';

import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  MouseEvent,
  ReactNode,
} from 'react';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';
import { cn } from './utils';
import styles from './button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'dark' | 'ghost' | 'icon' | 'hero';
type ButtonSize = 'sm' | 'md' | 'lg';

type BaseProps = {
  children?: ReactNode;
  className?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
};

type ButtonProps = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: never;
  };

type ButtonLinkProps = BaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

function buttonClassName({
  className,
  size = 'md',
  variant = 'primary',
}: BaseProps) {
  return cn(styles.button, styles[variant], styles[size], className);
}

export function Button({
  children,
  className,
  size = 'md',
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClassName({ className, size, variant })}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  children,
  className,
  href,
  onClick,
  size = 'md',
  variant = 'primary',
  ...props
}: ButtonLinkProps) {
  const scrollTo = useSmoothScroll(20);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (href.startsWith('#')) {
      event.preventDefault();
      scrollTo(href);
    }

    onClick?.(event);
  }

  return (
    <a
      className={buttonClassName({ className, size, variant })}
      href={href}
      onClick={handleClick}
      {...props}
    >
      {children}
    </a>
  );
}

export function ArrowIcon({ direction }: { direction: 'next' | 'previous' }) {
  return (
    <span
      aria-hidden="true"
      className={cn(styles.arrow, direction === 'previous' && styles.previous)}
    />
  );
}
