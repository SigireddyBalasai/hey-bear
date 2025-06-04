'use client';

import { useCallback, useEffect, useState } from 'react';

import { ChevronLeft, RefreshCw, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { createClient } from '@/utils/supabase/client';

interface CustomerSessionResponse {
  customer_session_client_secret: string;
}

interface AssistantData {
  name: string;
  description: string;
  conciergeName: string;
  personality: string;
  businessName: string;
  sharePhoneNumber: boolean;
  phoneNumber: string;
}

interface PricingTablePopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string | null;
  onPaymentSuccess?: () => void;
  onPaymentCancel?: () => void;
}

export function PricingTablePopup({
  open,
  onOpenChange,
  sessionId,
  onPaymentSuccess,
  onPaymentCancel,
}: PricingTablePopupProps) {
  const [assistantData, setAssistantData] = useState<AssistantData | null>(null);
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
    async function loadData() {
      if (!sessionId || !open) {
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

        console.log('[PRICING POPUP] Fetching session data from API...');
        console.log('[PRICING POPUP] Session ID:', sessionId);
        console.log('[PRICING POPUP] User ID:', user.id);

        // Fetch session data
        const sessionUrl = `/api/Concierge/session?sessionId=${sessionId}`;
        console.log('[PRICING POPUP] Session API URL:', sessionUrl);

        const sessionResponse = await fetch(sessionUrl);

        console.log('[PRICING POPUP] Session response status:', sessionResponse.status);
        console.log('[PRICING POPUP] Session response ok:', sessionResponse.ok);

        if (!sessionResponse.ok) {
          const errorText = await sessionResponse.text();
          console.error('[PRICING POPUP] Session API error response:', errorText);

          let errorData: { error: string };
          try {
            errorData = JSON.parse(errorText) as { error: string };
          } catch {
            errorData = { error: errorText };
          }

          throw new Error(errorData.error || 'Failed to load session data');
        }

        console.log('[PRICING POPUP] Session response successful, parsing data...');
        const sessionData = (await sessionResponse.json()) as {
          assistantData: AssistantData;
          customerId: string;
        };

        console.log('[PRICING POPUP] Session data retrieved:', {
          assistantName: sessionData.assistantData?.name,
          customerId: sessionData.customerId,
          hasAssistantData: !!sessionData.assistantData,
        });

        setAssistantData(sessionData.assistantData);

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
        console.error('Error loading data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [sessionId, open]);

  const handleClose = useCallback(
    (paymentCompleted = false) => {
      onOpenChange(false);

      if (paymentCompleted && onPaymentSuccess) {
        onPaymentSuccess();
      } else if (!paymentCompleted && onPaymentCancel) {
        onPaymentCancel();
      }
    },
    [onOpenChange, onPaymentSuccess, onPaymentCancel]
  );

  useEffect(() => {
    // Listen for Stripe pricing table events
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://js.stripe.com') return;

      const data = event.data as { type?: string };
      if (data && data.type === 'stripe_checkout_session_completed') {
        console.log('[PRICING POPUP] Payment completed successfully');
        handleClose(true);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleClose]);

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Complete Your Assistant Setup</DialogTitle>
                <DialogDescription>Choose a plan to activate your AI assistant</DialogDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleClose(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="text-center py-12">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Loading pricing options...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Setup Error</DialogTitle>
                <DialogDescription>
                  There was an issue loading your assistant setup
                </DialogDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleClose(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="text-center py-12">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-red-600">{error}</h1>
              <p className="mt-2 text-muted-foreground">
                Please try creating your assistant again.
              </p>
            </div>
            <Button onClick={() => handleClose(false)}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Complete Your Assistant Setup</DialogTitle>
              <DialogDescription>Choose a plan to activate your AI assistant</DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => handleClose(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Assistant Preview */}
          {assistantData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {assistantData.name}
                  <Badge variant="secondary">Preview</Badge>
                </CardTitle>
                <CardDescription>Your assistant details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Assistant Name</p>
                    <p className="text-sm">{assistantData.conciergeName}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Personality</p>
                    <p className="text-sm">{assistantData.personality}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Business/Owner</p>
                    <p className="text-sm">{assistantData.businessName}</p>
                  </div>

                  {assistantData.description && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Description</p>
                      <p className="text-sm">{assistantData.description}</p>
                    </div>
                  )}

                  {assistantData.sharePhoneNumber && assistantData.phoneNumber && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                      <p className="text-sm">{assistantData.phoneNumber}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Stripe Pricing Table */}
          <div>
            {!isStripeConfigured ? (
              <div className="text-center py-12">
                <p className="text-red-500 text-lg">
                  Stripe configuration is missing. Please contact support.
                </p>
              </div>
            ) : customerSessionSecret ? (
              <>
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
              </>
            ) : (
              <div className="text-center py-12">
                <RefreshCw className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">Loading pricing options...</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
