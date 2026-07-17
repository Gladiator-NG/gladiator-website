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

function Footer() {
  const whatsappUrl = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_URL;
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
          <p>Private charters and secluded waterfront stays in Lagos.</p>
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
              <a href={whatsappUrl} rel="noreferrer" target="_blank">
                WhatsApp support
              </a>
            )}
            {supportEmail && (
              <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
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
