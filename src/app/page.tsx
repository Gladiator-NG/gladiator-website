import Navigation from '@/components/mainNav/Navigation';
import Hero from '@/components/Hero/Hero';
import ReservationPlanner from '@/components/ReservationPlanner/ReservationPlanner';
import BookingLookup from '@/components/BookingLookup/BookingLookup';
import CharterStandard from '@/components/CharterStandard/CharterStandard';
import Escape from '@/components/Escape/Escape';
import Footer from '@/components/Footer/Footer';

type HomeProps = {
  searchParams: Promise<{
    bookingReference?: string;
    reference?: string;
    referenceCode?: string;
  }>;
};

function bookingReferenceFrom(value: string | undefined) {
  if (!value) return '';

  const normalized = value.trim().toUpperCase();
  const match = normalized.match(/GLD-\d+/);

  return match?.[0] ?? normalized;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const initialBookingReference = bookingReferenceFrom(
    params.bookingReference ?? params.referenceCode ?? params.reference,
  );

  return (
    <>
      <Navigation />
      <main>
        <Hero />
        <ReservationPlanner />
        <BookingLookup initialReferenceCode={initialBookingReference} />
        <CharterStandard />
        <Escape />
      </main>
      <Footer />
    </>
  );
}
