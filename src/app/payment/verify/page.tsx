import type { Metadata } from 'next';
import Link from 'next/link';
import {
  type PaymentConfirmation,
  verifyAndConfirmPayment,
} from '@/services/paystack';
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
  let result: PaymentConfirmation;

  try {
    result = reference
      ? await verifyAndConfirmPayment(reference)
      : { ok: false, message: 'Payment reference is missing.' };
  } catch {
    result = {
      ok: false,
      message:
        'We could not check the payment yet. Please do not pay again; refresh this page or contact our team with your debit reference.',
    };
  }

  const paymentNeedsAttention = result.paymentReceived && !result.ok;
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
          {result.ok
            ? 'Booking confirmed'
            : paymentNeedsAttention
              ? 'Payment received'
              : 'Verification pending'}
        </p>
        <h1>
          {result.ok
            ? 'Your payment was successful.'
            : paymentNeedsAttention
              ? 'Your payment was received.'
              : 'We could not verify this payment yet.'}
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
