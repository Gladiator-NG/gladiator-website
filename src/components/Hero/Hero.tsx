import Image from 'next/image';
import { ButtonLink } from '@/components/ui';
import styles from './hero.module.css';

function Hero() {
  return (
    <section className={styles.hero}>
      <Image
        src="/images/charter-hero.png"
        alt=""
        fill
        preload
        sizes="100vw"
        className={styles.image}
      />
      <div className={styles.overlay} />

      <div className={`wrap ${styles.inner}`}>
        <div className={styles.content}>
          <p className={styles.eyebrow}>Private Charters / Lagos</p>
          <h1>Arrive by water. Leave ordinary behind.</h1>
          <p className={styles.copy}>
            Bespoke yacht charters, private boat transfers and secluded
            waterfront stays, curated for effortless days on the Lagos coast.
          </p>
          <div className={styles.actions}>
            <ButtonLink href="#plan-charter" size="lg">
              Plan your escape
            </ButtonLink>
            <ButtonLink
              href="#listings"
              size="lg"
              variant="secondary"
            >
              Browse collection
            </ButtonLink>
          </div>
        </div>

        <div className={styles.detail}>
          <p>Gladiator Private Charter</p>
          <span>Yacht experiences</span>
          <span>Private waterfront stays</span>
          <span>Tailored transfers</span>
        </div>
      </div>
    </section>
  );
}

export default Hero;
