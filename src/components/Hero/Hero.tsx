'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { ButtonLink } from '@/components/ui';
import styles from './hero.module.css';

const heroSlides = [
  {
    src: '/images/charter-hero.png',
    className: styles.slideOne,
  },
  {
    src: '/images/tender-transfer.png',
    className: styles.slideTwo,
  },
  {
    src: '/images/private-stay.png',
    className: styles.slideThree,
  },
];

function Hero() {
  const shouldReduceMotion = useReducedMotion();
  const revealEase = [0.22, 0.86, 0.28, 1] as const;

  return (
    <section className={styles.hero}>
      {heroSlides.map((slide, index) => (
        <motion.div
          animate={
            shouldReduceMotion
              ? { opacity: index === 0 ? 1 : 0, scale: 1.01 }
              : {
                  opacity: [0, 1, 1, 0],
                  scale: [1.045, 1.01, 1.01, 1.01],
                }
          }
          aria-hidden="true"
          className={`${styles.slide} ${slide.className}`}
          initial={{ opacity: index === 0 ? 1 : 0, scale: 1.01 }}
          key={slide.src}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : {
                  delay: index * 6,
                  duration: 18,
                  ease: 'linear',
                  repeat: Infinity,
                  times: [0, 0.06, 0.3, 0.38],
                }
          }
        >
          <Image
            src={slide.src}
            alt=""
            fill
            preload={index === 0}
            sizes="100vw"
            className={styles.image}
          />
        </motion.div>
      ))}
      <div className={styles.overlay} />

      <div className={`wrap ${styles.inner}`}>
        <div className={styles.content}>
          <motion.p
            animate={{ opacity: 1, y: 0 }}
            className={styles.eyebrow}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
            transition={{ delay: 1.22, duration: 0.52, ease: revealEase }}
          >
            <motion.span
              animate={{ clipPath: 'inset(0 0 0 0)' }}
              initial={
                shouldReduceMotion
                  ? false
                  : { clipPath: 'inset(0 100% 0 0)' }
              }
              transition={{ delay: 1.62, duration: 1.08, ease: 'linear' }}
            >
              Private coastal charters / Lagos
            </motion.span>
          </motion.p>
          <h1>
            <motion.span
              animate={{
                clipPath: 'inset(0 0 0 0)',
                filter: 'blur(0)',
                opacity: 1,
                y: 0,
              }}
              className={styles.titleText}
              initial={
                shouldReduceMotion
                  ? false
                  : {
                      clipPath: 'inset(0 0 100% 0)',
                      filter: 'blur(14px)',
                      opacity: 0,
                      y: 32,
                    }
              }
              transition={{ delay: 0.18, duration: 0.84, ease: revealEase }}
            >
              Private luxury on the Lagos coast.
            </motion.span>
          </h1>
          <motion.p
            animate={{ opacity: 1, y: 0 }}
            className={styles.copy}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
            transition={{ delay: 0.62, duration: 0.56, ease: revealEase }}
          >
            Curated yacht charters, private boat transfers and waterfront stays
            for effortless days on the Lagos coast.
          </motion.p>
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className={styles.actions}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
            transition={{ delay: 0.8, duration: 0.52, ease: revealEase }}
          >
            <ButtonLink href="#plan-charter" size="lg" variant="hero">
              Plan a charter
            </ButtonLink>
          </motion.div>
        </div>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          aria-label="Available services"
          className={styles.detail}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
          transition={{ delay: 0.98, duration: 0.52, ease: revealEase }}
        >
          <span>Yacht charters</span>
          <span>Boat transfers</span>
          <span>Private stays</span>
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;
