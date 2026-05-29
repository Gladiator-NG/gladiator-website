import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './utils';
import styles from './card.module.css';

export function Card({
  children,
  className,
  glow = false,
  selected = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  glow?: boolean;
  selected?: boolean;
}) {
  return (
    <div
      className={cn(
        styles.card,
        glow && styles.glow,
        selected && styles.selected,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
