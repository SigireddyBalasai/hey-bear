import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';

export async function GET(_request: NextRequest) {
  console.log('Payment cancel route called');

  // Since Stripe pricing table cancellation doesn't pass assistant data,
  // simply redirect back to Concierge with cancellation status
  return redirect('/Concierge?payment=cancelled');
}
