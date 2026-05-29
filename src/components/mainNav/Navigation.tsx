'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { ButtonLink, SmoothLink } from '@/components/ui';
import styles from './navigation.module.css';

const links = [
  { label: 'Look up booking', href: '#booking-lookup' },
  { label: 'Contact us', href: '#contact' },
];

function Navigation() {
  const mobileMenuRef = useRef<HTMLDetailsElement>(null);

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
            mobileMenuRef.current?.removeAttribute('open');
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
          Plan a charter
        </ButtonLink>

        <details className={styles.mobileMenu} ref={mobileMenuRef}>
          <summary aria-label="Open navigation">
            <span />
            <span />
          </summary>
          <nav aria-label="Mobile navigation">
            {links.map((link) => (
              <SmoothLink
                key={link.label}
                href={link.href}
                onNavigate={() => mobileMenuRef.current?.removeAttribute('open')}
              >
                {link.label}
              </SmoothLink>
            ))}
            <SmoothLink
              href="#plan-charter"
              onNavigate={() => mobileMenuRef.current?.removeAttribute('open')}
            >
              Plan a charter
            </SmoothLink>
          </nav>
        </details>
      </div>
    </header>
  );
}

export default Navigation;
