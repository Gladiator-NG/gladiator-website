'use client';

import { FormEvent, useState } from 'react';
import { useBookingLookup } from '@/hooks/useBookingLookup';
import { Button, Card, FormField, TextInput } from '@/components/ui';
import styles from './bookingLookup.module.css';

const bookingTypeLabels = {
  boat_cruise: 'Private yacht charter',
  beach_house: 'Waterfront stay',
  boat_rental: 'Boat transfer',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat('en-NG', {
    currency,
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value);
}

function formatStatus(value: string) {
  return value.replaceAll('_', ' ');
}

function BookingLookup() {
  const [referenceCode, setReferenceCode] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [notFound, setNotFound] = useState(false);
  const { lookupAsync, booking, isPending, error, reset } = useBookingLookup();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotFound(false);

    try {
      const result = await lookupAsync({
        referenceCode: referenceCode.trim(),
        customerContact: customerContact.trim(),
      });

      setNotFound(!result);
    } catch {
      setNotFound(false);
    }
  }

  function handleChange(callback: (value: string) => void, value: string) {
    callback(value);
    setNotFound(false);
    reset();
  }

  return (
    <section className={styles.section} id="booking-lookup">
      <div className={`wrap ${styles.panel}`}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Booking lookup</p>
          <h2>Confirm your charter request.</h2>
          <p>
            Enter your Gladiator reference and the email or phone number used
            for the booking. We only show safe booking details.
          </p>
        </div>

        <Card className={styles.card}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <FormField label="Reference code">
              <TextInput
                autoComplete="off"
                onChange={(event) =>
                  handleChange(setReferenceCode, event.target.value)
                }
                placeholder="GLD-00001"
                required
                type="text"
                value={referenceCode}
              />
            </FormField>
            <FormField label="Email or phone">
              <TextInput
                autoComplete="email"
                onChange={(event) =>
                  handleChange(setCustomerContact, event.target.value)
                }
                placeholder="name@email.com or phone"
                required
                type="text"
                value={customerContact}
              />
            </FormField>
            <Button className={styles.submitButton} disabled={isPending} type="submit">
              {isPending ? 'Checking...' : 'Look up booking'}
            </Button>
          </form>

          {error && (
            <p className={styles.message}>
              We could not check that booking right now. Please try again.
            </p>
          )}

          {notFound && (
            <p className={styles.message}>
              No booking matched those details. Check the reference and contact
              used for the request.
            </p>
          )}

          {booking && (
            <div className={styles.result}>
              <div>
                <p className={styles.resultLabel}>Reference</p>
                <h3>{booking.reference_code}</h3>
              </div>
              <span className={styles.status}>
                {formatStatus(booking.status)}
              </span>
              <dl>
                <div>
                  <dt>Experience</dt>
                  <dd>{bookingTypeLabels[booking.booking_type]}</dd>
                </div>
                <div>
                  <dt>Listing</dt>
                  <dd>{booking.asset_label ?? 'Gladiator experience'}</dd>
                </div>
                <div>
                  <dt>Date</dt>
                  <dd>
                    {formatDate(booking.start_date)}
                    {booking.end_date !== booking.start_date
                      ? ` - ${formatDate(booking.end_date)}`
                      : ''}
                  </dd>
                </div>
                <div>
                  <dt>Payment</dt>
                  <dd>{formatStatus(booking.payment_status)}</dd>
                </div>
                <div>
                  <dt>Guests</dt>
                  <dd>{booking.guest_count}</dd>
                </div>
                <div>
                  <dt>Total</dt>
                  <dd>{formatMoney(booking.total_amount, booking.currency)}</dd>
                </div>
              </dl>
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}

export default BookingLookup;
