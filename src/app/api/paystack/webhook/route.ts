import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { verifyAndConfirmPayment } from '@/services/paystack';

function isValidPaystackSignature(payload: string, signature: string | null) {
  if (!signature) return false;

  const expected = createHmac('sha512', process.env.PAYSTACK_SECRET_KEY ?? '')
    .update(payload)
    .digest('hex');

  const signatureBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');

  return (
    signatureBuffer.length === expectedBuffer.length &&
    timingSafeEqual(signatureBuffer, expectedBuffer)
  );
}

export async function POST(request: Request) {
  const payload = await request.text();

  if (
    !process.env.PAYSTACK_SECRET_KEY ||
    !isValidPaystackSignature(
      payload,
      request.headers.get('x-paystack-signature'),
    )
  ) {
    return NextResponse.json({ message: 'Invalid signature.' }, { status: 401 });
  }

  const event = JSON.parse(payload) as {
    event?: string;
    data?: { reference?: string };
  };

  if (event.event === 'charge.success' && event.data?.reference) {
    await verifyAndConfirmPayment(event.data.reference);
  }

  return NextResponse.json({ received: true });
}
