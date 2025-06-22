import Stripe from 'stripe';

export const getStripeInstance = async (): Promise<Stripe | null> => {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    return null;
  }

  return await Promise.resolve(
    new Stripe(secretKey, {
      apiVersion: '2025-05-28.basil',
    })
  );
};
