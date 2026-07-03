import type { Metadata } from 'next';
import Link from 'next/link';
import { verifyAndConfirmPayment } from '@/services/paystack';
import styles from './paymentVerify.module.css';

export const metadata: Metadata = {
  title: 'Payment Verification',
};

type PaymentVerifyPageProps = {
  searchParams: Promise<{
    reference?: string;
    trxref?: string;
  }>;
};

function money(amount: number, currency: string) {
  return new Intl.NumberFormat('en-NG', {
    currency,
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(amount);
}

export default async function PaymentVerifyPage({
  searchParams,
}: PaymentVerifyPageProps) {
  const params = await searchParams;
  const reference = params.reference ?? params.trxref ?? '';
  const result = reference
    ? await verifyAndConfirmPayment(reference)
    : { ok: false, message: 'Payment reference is missing.' };
  const bookingLookupHref = result.booking
    ? {
        hash: 'booking-lookup',
        pathname: '/',
        query: { bookingReference: result.booking.reference_code },
      }
    : '/#booking-lookup';

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <p className={styles.eyebrow}>
          {result.ok ? 'Booking confirmed' : 'Payment not confirmed'}
        </p>
        <h1>
          {result.ok
            ? 'Your payment was successful.'
            : 'We could not confirm this payment.'}
        </h1>
        <p>{result.message}</p>

        {result.booking && (
          <>
            <div className={styles.reference}>
              {result.booking.reference_code}
            </div>
            <p>
              {money(result.booking.total_amount, result.booking.currency)} ·{' '}
              {result.booking.payment_status}
            </p>
          </>
        )}

        <div className={styles.actions}>
          <Link className={styles.button} href={bookingLookupHref}>
            View booking
          </Link>
          <Link className={styles.secondaryButton} href="/#plan-charter">
            Back to reservations
          </Link>
        </div>
      </section>
    </main>
  );
}
