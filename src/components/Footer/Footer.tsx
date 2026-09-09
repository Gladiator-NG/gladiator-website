'use client';

import Image from 'next/image';
import { SmoothLink } from '@/components/ui';

import styles from './footer.module.css';

const InstagramIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <rect height="18" rx="5" width="18" x="3" y="3" />
    <circle cx="12" cy="12" r="4" />
    <circle className={styles.iconFill} cx="17.5" cy="6.5" r="1" />
  </svg>
);

const TikTokIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <path d="M15 4v10.5a4.5 4.5 0 1 1-4.5-4.5" />
    <path d="M15 4c.6 3 2.2 4.6 5 5" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.5L3.5 20.5l1.3-4.2a8.5 8.5 0 1 1 15.7-4.6Z" />
    <path d="M8.2 7.8c.2-.4.4-.4.7-.4h.4c.2 0 .4.1.5.5l.8 1.8c.1.3 0 .5-.2.7l-.6.7c-.2.2-.1.4 0 .6.7 1.2 1.7 2.2 3 2.8.2.1.4.1.6-.1l.8-1c.2-.2.4-.3.7-.2l1.8.8c.3.2.5.3.5.5 0 .2-.1 1.3-.7 1.8-.5.6-1.3.9-2.1.9-1 0-2.5-.5-4.2-2-2-1.7-3.2-3.9-3.3-5.4 0-.8.3-1.5.7-2Z" />
  </svg>
);

const MailIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <rect height="14" rx="2" width="18" x="3" y="5" />
    <path d="m4 7 8 6 8-6" />
  </svg>
);

function Footer() {
  const whatsappUrl = 'https://wa.me/2349165063000';
  const supportEmail =
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'bookings@gladiatorleisures.com';

  return (
    <footer className={styles.footer} id="contact">
      <div className={`wrap ${styles.layout}`}>
        <div className={styles.brand}>
          <Image
            alt="Gladiator"
            className={styles.wordmark}
            height={80}
            src="/brand/gladiator-wordmark-design.png"
            width={580}
          />
          <p>Yacht cruises and secluded waterfront stays in Lagos.</p>
        </div>

        <nav aria-label="Footer">
          <SmoothLink href="#booking-lookup">
            Look up booking
          </SmoothLink>
        </nav>

        <div className={styles.contact}>
          <p>Booking support</p>
          <div className={styles.contactLinks}>
            {whatsappUrl && (
              <a
                className={styles.contactMethod}
                href={whatsappUrl}
                rel="noreferrer"
                target="_blank"
              >
                <span className={styles.contactIcon}>
                  <WhatsAppIcon />
                </span>
                <span>
                  <strong>WhatsApp</strong>
                  <small>+234 916 506 3000</small>
                </span>
              </a>
            )}
            {supportEmail && (
              <a
                className={styles.contactMethod}
                href={`mailto:${supportEmail}`}
              >
                <span className={styles.contactIcon}>
                  <MailIcon />
                </span>
                <span>
                  <strong>Email</strong>
                  <small>{supportEmail}</small>
                </span>
              </a>
            )}
            <div className={styles.socialLinks}>
              <a
                aria-label="Gladiator on Instagram"
                href="https://www.instagram.com/gladiator.ng/"
                rel="noreferrer"
                target="_blank"
              >
                <InstagramIcon />
              </a>
              <a
                aria-label="Gladiator on TikTok"
                href="https://www.tiktok.com/@gladiatorleisures"
                rel="noreferrer"
                target="_blank"
              >
                <TikTokIcon />
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className={`wrap ${styles.bottom}`}>
        <p>&copy; {new Date().getFullYear()} Gladiator. All rights reserved.</p>
        <p>Luxury on water, curated in Lagos.</p>
      </div>
    </footer>
  );
}

export default Footer;
