import { NextResponse } from 'next/server';
import { initializeBookingPayment } from '@/services/paystack';
import type { CreateBookingInput } from '@/services/apiBooking';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { booking?: CreateBookingInput };

    if (!body.booking) {
      return NextResponse.json(
        { message: 'booking details are required.' },
        { status: 400 },
      );
    }

    const payment = await initializeBookingPayment(body.booking);

    return NextResponse.json({
      authorizationUrl: payment.authorization_url,
      reference: payment.reference,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : 'Payment could not be initialized.',
      },
      { status: 500 },
    );
  }
}
