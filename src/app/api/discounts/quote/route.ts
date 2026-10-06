import { NextResponse } from 'next/server';
import { quoteBookingDiscount } from '@/services/paystack';
import type { CreateBookingInput } from '@/services/apiBooking';

export async function POST(request: Request) {
  try {
    const { booking } = await request.json() as { booking?: CreateBookingInput };
    if (!booking || typeof booking.discount_code !== 'string' || booking.discount_code.length > 40) {
      return NextResponse.json({ message: 'Enter a valid discount code.' }, { status: 400 });
    }
    return NextResponse.json(await quoteBookingDiscount(booking));
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Could not validate code.' }, { status: 400 });
  }
}
