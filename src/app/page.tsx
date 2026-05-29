import Navigation from '@/components/mainNav/Navigation';
import Hero from '@/components/Hero/Hero';
import ReservationPlanner from '@/components/ReservationPlanner/ReservationPlanner';
import BookingLookup from '@/components/BookingLookup/BookingLookup';
import CharterStandard from '@/components/CharterStandard/CharterStandard';
import Escape from '@/components/Escape/Escape';
import Footer from '@/components/Footer/Footer';

export default function Home() {
  return (
    <>
      <Navigation />
      <main>
        <Hero />
        <ReservationPlanner />
        <BookingLookup />
        <CharterStandard />
        <Escape />
      </main>
      <Footer />
    </>
  );
}
