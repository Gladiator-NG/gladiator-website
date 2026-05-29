import Image from 'next/image';
import { ButtonLink } from '@/components/ui';

import styles from './escape.module.css';

function Escape() {
  return (
    <section className={styles.section}>
      <div className="wrap">
        <div className={styles.panel}>
          <div className={styles.image}>
            <Image
              alt="Private waterfront residence terrace overlooking calm water"
              fill
              sizes="(max-width: 900px) 100vw, 52vw"
              src="/images/private-stay.png"
            />
          </div>
          <div className={styles.content}>
            <p className={styles.eyebrow}>Stay Beyond Sunset</p>
            <h2>A private residence, paired with your charter.</h2>
            <p>
              Extend an afternoon on the water into an overnight retreat, with
              your arrival and return coordinated by Gladiator.
            </p>
            <ButtonLink href="#plan-charter">Design your itinerary</ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Escape;
