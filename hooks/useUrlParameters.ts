'use client';

import { useEffect } from 'react';

import type { ConciergeFormData } from '@/types/concierge.types';
import { showInfo, showSuccess } from '@/utils/error-handling';

// Utility function to get URL parameters
const getUrlParameter = (name: string): string | null => {
  if (typeof globalThis === 'undefined') return null;
  return new URLSearchParams(globalThis.location.search).get(name);
};

interface UseUrlParametersProps {
  setFormData: (data: ConciergeFormData) => void;
  setCreateDialogOpen: (open: boolean) => void;
  fetchAssistants: () => void;
}

export function useUrlParameters({
  setFormData,
  setCreateDialogOpen,
  fetchAssistants,
}: UseUrlParametersProps) {
  // Check for Stripe redirect parameters on component mount
  useEffect(() => {
    const success = getUrlParameter('success');
    const canceled = getUrlParameter('canceled');
    const assistantId = getUrlParameter('assistant_id');

    if (success === 'true' && assistantId) {
      showSuccess('Subscription successful', 'Your No-Show has been successfully activated!');
      fetchAssistants();
    } else if (canceled === 'true' && assistantId) {
      showInfo(
        'Checkout canceled',
        'Your payment was not completed. The No-Show will remain inactive.'
      );
      fetchAssistants();
    }
  }, [fetchAssistants]);

  // Effect to handle return from Stripe checkout
  useEffect(() => {
    const paymentStatus = getUrlParameter('payment');
    const openDialog = getUrlParameter('openDialog');

    // Handle new payment flow with bot data
    if ((paymentStatus === 'success' || paymentStatus === 'cancelled') && openDialog === 'true') {
      // Extract bot data from URL parameters
      const botData: ConciergeFormData = {
        name: getUrlParameter('name') || '',
        description: getUrlParameter('description') || '',
        conciergeName: getUrlParameter('conciergeName') || '',
        personality: getUrlParameter('personality') || '',
        businessName: getUrlParameter('businessName') || '',
        sharePhoneNumber: getUrlParameter('sharePhoneNumber') === 'true',
        phoneNumber: getUrlParameter('phoneNumber') || '',
        selectedPlan: getUrlParameter('selectedPlan') || 'personal',
      };

      // Populate form data with bot data
      setFormData(botData);

      if (paymentStatus === 'success') {
        showSuccess(
          'Payment successful!',
          'Your subscription is active. Complete creating your assistant.'
        );
      } else {
        showInfo(
          'Payment cancelled',
          'You can complete the payment later. Your assistant details have been preserved.'
        );
      }

      // Open the create dialog with preserved data
      setCreateDialogOpen(true);

      // Clean up URL parameters
      globalThis.history.replaceState({}, document.title, globalThis.location.pathname);
    }

    // Handle legacy payment flow (keep for backward compatibility)
    const success = getUrlParameter('success');
    const canceled = getUrlParameter('canceled');
    const assistantId = getUrlParameter('assistant_id');

    if (success === 'true' && assistantId) {
      showSuccess(
        'Payment successful',
        'Your No-Show has been activated with your subscription plan'
      );
    } else if (canceled === 'true' && assistantId) {
      showInfo('Payment canceled', 'You can complete the payment later to activate your No-Show');
    }

    // Clear URL parameters and refresh list in both legacy cases
    if ((success === 'true' || canceled === 'true') && assistantId) {
      globalThis.history.replaceState({}, document.title, globalThis.location.pathname);
      fetchAssistants();
    }
  }, [setFormData, setCreateDialogOpen, fetchAssistants]);
}
