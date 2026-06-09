'use client';

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from './utils';
import styles from './tabNavigation.module.css';

export type TabNavigationItem<TValue extends string = string> = {
  label: ReactNode;
  value: TValue;
};

type TabNavigationProps<TValue extends string = string> = {
  ariaLabel: string;
  className?: string;
  onChange: (value: TValue) => void;
  tabs: TabNavigationItem<TValue>[];
  value: TValue;
};

export function TabNavigation<TValue extends string = string>({
  ariaLabel,
  className,
  onChange,
  tabs,
  value,
}: TabNavigationProps<TValue>) {
  return (
    <nav className={cn(styles.wrapper, className)} aria-label={ariaLabel}>
      <div className={styles.scroller} role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.value === value;

          return (
            <button
              aria-selected={isActive}
              className={cn(styles.tab, isActive && styles.activeTab)}
              key={tab.value}
              onClick={() => onChange(tab.value)}
              role="tab"
              type="button"
            >
              {tab.label}
              {isActive && (
                <motion.span
                  aria-hidden="true"
                  className={styles.indicator}
                  layoutId="tab-navigation-indicator"
                  transition={{
                    type: 'spring',
                    stiffness: 420,
                    damping: 34,
                    mass: 0.8,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
