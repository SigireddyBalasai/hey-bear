'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { ChevronLeft, RefreshCw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');

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
    async function loadData() {
      if (!sessionId) {
        setError('No session ID provided');
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

        console.log('[PRICING PAGE] Fetching session data from API...');
        console.log('[PRICING PAGE] Session ID:', sessionId);
        console.log('[PRICING PAGE] User ID:', user.id);

        // Fetch session data
        const sessionUrl = `/api/Concierge/session?sessionId=${sessionId}`;
        console.log('[PRICING PAGE] Session API URL:', sessionUrl);

        const sessionResponse = await fetch(sessionUrl);

        console.log('[PRICING PAGE] Session response status:', sessionResponse.status);
        console.log('[PRICING PAGE] Session response ok:', sessionResponse.ok);

        if (!sessionResponse.ok) {
          const errorText = await sessionResponse.text();
          console.error('[PRICING PAGE] Session API error response:', errorText);

          let errorData: { error: string };
          try {
            errorData = JSON.parse(errorText) as { error: string };
          } catch {
            errorData = { error: errorText };
          }

          throw new Error(errorData.error || 'Failed to load session data');
        }

        console.log('[PRICING PAGE] Session response successful, parsing data...');
        const sessionData = (await sessionResponse.json()) as {
          assistantData: AssistantData;
          customerId: string;
        };

        console.log('[PRICING PAGE] Session data retrieved:', {
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
  }, [sessionId]);

  const handleGoBack = () => {
    router.push('/Concierge');
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <div className="text-center py-12">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Loading pricing options...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <div className="text-center py-12">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-red-600">{error}</h1>
            <p className="mt-2 text-muted-foreground">Please try creating your assistant again.</p>
          </div>
          <Button onClick={handleGoBack}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Concierge
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={handleGoBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Complete Your Assistant Setup</h1>
            <p className="text-muted-foreground">Choose a plan to activate your AI assistant</p>
          </div>
        </div>
      </div>

      {/* Assistant Preview */}
      {assistantData && (
        <div className="mb-8">
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
        </div>
      )}

      <Separator className="mb-8" />

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
  );
}

// Suspense boundary loading component
function PricingPageLoading() {
  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="text-center py-12">
        <RefreshCw className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Loading pricing options...</p>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function PricingPage() {
  return (
    <Suspense fallback={<PricingPageLoading />}>
      <PricingContent />
    </Suspense>
  );
}
