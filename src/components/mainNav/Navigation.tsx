'use client';

import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { ButtonLink, SmoothLink } from '@/components/ui';
import styles from './navigation.module.css';

const links = [
  { label: 'Look up booking', href: '#booking-lookup' },
  { label: 'Contact us', href: '#contact' },
];

const mobileLinks = [
  ...links,
  { label: 'Plan a yacht cruise', href: '#plan-charter', featured: true },
];

function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    function closeOnOutsideClick(event: PointerEvent) {
      if (!mobileMenuRef.current?.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsMobileMenuOpen(false);
    }

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isMobileMenuOpen]);

  return (
    <header className={styles.header}>
      <div className={`wrap ${styles.inner}`}>
        <a
          href="#"
          className={styles.brand}
          aria-label="Gladiator home"
          onClick={(event) => {
            event.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setIsMobileMenuOpen(false);
          }}
        >
          <Image
            src="/brand/gladiator_icon.png"
            alt=""
            width={96}
            height={96}
            className={styles.mark}
          />
          <span>GLADIATOR</span>
        </a>

        <nav className={styles.desktopNav} aria-label="Main navigation">
          {links.map((link) => (
            <SmoothLink key={link.label} href={link.href}>
              {link.label}
            </SmoothLink>
          ))}
        </nav>

        <ButtonLink
          href="#plan-charter"
          className={styles.bookButton}
          variant="secondary"
        >
          Plan a yacht cruise
        </ButtonLink>

        <div className={styles.mobileMenu} ref={mobileMenuRef}>
          <button
            aria-controls="mobile-navigation"
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? 'Close navigation' : 'Open navigation'}
            className={styles.mobileMenuButton}
            data-open={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            type="button"
          >
            <span />
            <span />
          </button>

          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.nav
                animate={{ opacity: 1, scale: 1, y: 0 }}
                aria-label="Mobile navigation"
                exit={{ opacity: 0, scale: 0.97, y: -8 }}
                id="mobile-navigation"
                initial={{ opacity: 0, scale: 0.96, y: -12 }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.28,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {mobileLinks.map((link, index) => (
                  <motion.div
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    initial={{ opacity: 0, x: 12 }}
                    key={link.label}
                    transition={{
                      delay: shouldReduceMotion ? 0 : 0.05 + index * 0.045,
                      duration: shouldReduceMotion ? 0 : 0.24,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <SmoothLink
                      className={
                        'featured' in link && link.featured
                          ? styles.mobileMenuCta
                          : undefined
                      }
                      href={link.href}
                      onNavigate={() => setIsMobileMenuOpen(false)}
                    >
                      {link.label}
                    </SmoothLink>
                  </motion.div>
                ))}
              </motion.nav>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

export default Navigation;
