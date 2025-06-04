'use client';

import { useCallback, useEffect, useState } from 'react';

import { RefreshCw } from 'lucide-react';

import { createClient } from '@/utils/supabase/client';

interface StripePricingTableProps {
  sessionId: string;
  onPaymentSuccess?: () => void;
  onPaymentCancel?: () => void;
  className?: string;
}

interface CustomerSessionResponse {
  customer_session_client_secret: string;
}

export function StripePricingTable({
  sessionId,
  onPaymentSuccess,
  onPaymentCancel,
  className = '',
}: StripePricingTableProps) {
  const [customerSessionSecret, setCustomerSessionSecret] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [userId, setUserId] = useState<string>('');

  // Validate Stripe configuration
  const stripeConfig = {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    pricingTableId: process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID,
  };

  const isStripeConfigured = stripeConfig.publishableKey && stripeConfig.pricingTableId;

  useEffect(() => {
    // Add Stripe script if not already added
    if (!document.querySelector('script[src*="js.stripe.com"]')) {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/pricing-table.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    async function loadCustomerSession() {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError('Authentication required');
          setLoading(false);
          return;
        }

        setUserId(user.id);

        console.log('[STRIPE PRICING TABLE] Fetching session data from API...');
        console.log('[STRIPE PRICING TABLE] Session ID:', sessionId);
        console.log('[STRIPE PRICING TABLE] User ID:', user.id);

        // Fetch session data to get customer ID
        const sessionUrl = `/api/Concierge/session?sessionId=${sessionId}`;
        const sessionResponse = await fetch(sessionUrl);

        if (!sessionResponse.ok) {
          const errorText = await sessionResponse.text();
          console.error('[STRIPE PRICING TABLE] Session API error response:', errorText);
          throw new Error('Failed to load session data');
        }

        const sessionData = (await sessionResponse.json()) as {
          customerId: string;
        };

        console.log('[STRIPE PRICING TABLE] Session data retrieved:', {
          customerId: sessionData.customerId,
        });

        // Get Stripe customer session
        const customerResponse = await fetch('/api/stripe/customer-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerId: sessionData.customerId,
          }),
        });

        if (!customerResponse.ok) {
          throw new Error('Failed to create customer session');
        }

        const customerData = (await customerResponse.json()) as CustomerSessionResponse;
        setCustomerSessionSecret(customerData.customer_session_client_secret);
      } catch (err) {
        console.error('Error loading customer session:', err);
        setError('Failed to load pricing options');
      } finally {
        setLoading(false);
      }
    }

    loadCustomerSession();
  }, [sessionId]);

  const handlePaymentComplete = useCallback(
    (paymentCompleted = false) => {
      if (paymentCompleted && onPaymentSuccess) {
        onPaymentSuccess();
      } else if (!paymentCompleted && onPaymentCancel) {
        onPaymentCancel();
      }
    },
    [onPaymentSuccess, onPaymentCancel]
  );

  useEffect(() => {
    // Listen for Stripe pricing table events
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://js.stripe.com') return;

      const data = event.data as { type?: string };
      if (data && data.type === 'stripe_checkout_session_completed') {
        console.log('[STRIPE PRICING TABLE] Payment completed successfully');
        handlePaymentComplete(true);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handlePaymentComplete]);

  if (loading) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <RefreshCw className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Loading pricing options...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-red-500 text-lg">{error}</p>
        <p className="mt-2 text-muted-foreground">Please try again.</p>
      </div>
    );
  }

  if (!isStripeConfigured) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-red-500 text-lg">
          Stripe configuration is missing. Please contact support.
        </p>
      </div>
    );
  }

  if (!customerSessionSecret) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <RefreshCw className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Loading pricing options...</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* @ts-ignore: Stripe pricing table is a custom element */}
      <stripe-pricing-table
        pricing-table-id={stripeConfig.pricingTableId}
        publishable-key={stripeConfig.publishableKey}
        customer-session-client-secret={customerSessionSecret}
        client-reference-id={
          userId ? `user-${userId}-session-${sessionId}` : `session-${sessionId}`
        }
      >
        {/* @ts-ignore: Stripe pricing table is a custom element */}
      </stripe-pricing-table>
    </div>
  );
}
