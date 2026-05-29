import { ButtonLink } from '@/components/ui';
import styles from './charterStandard.module.css';

const standards = [
  {
    number: '01',
    title: 'Dedicated concierge',
    description:
      'Every request is shaped around your occasion, guests and preferred pace.',
  },
  {
    number: '02',
    title: 'Private by design',
    description:
      'Curated vessels and waterfront homes reserved for your exclusive use.',
  },
  {
    number: '03',
    title: 'Timed to perfection',
    description:
      'Departure windows, routes and returns planned with precision and ease.',
  },
  {
    number: '04',
    title: 'Seamless arrivals',
    description:
      'Link your charter, transfer and stay into one effortless itinerary.',
  },
];

function CharterStandard() {
  return (
    <section className={styles.section} id="standard">
      <div className={`wrap ${styles.layout}`}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>The Gladiator Standard</p>
          <h2>Every detail, quietly handled.</h2>
          <p>
            Luxury is more than the vessel. It is a calm arrival, a considered
            route and a team that understands how you prefer to travel.
          </p>
          <ButtonLink href="#plan-charter" variant="secondary">
            Begin planning
          </ButtonLink>
        </div>

        <div className={styles.standards}>
          {standards.map((standard) => (
            <article className={styles.standard} key={standard.title}>
              <p className={styles.number}>{standard.number}</p>
              <div>
                <h3>{standard.title}</h3>
                <p>{standard.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CharterStandard;
