import { ChevronLeft } from 'lucide-react';
import { useEffect, useState } from 'react';


import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StripePricingTable } from '@/components/ui/stripe-pricing-table';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useLoadingState } from '@/hooks/useLoadingState';
import type { CreateAssistantDialogProps } from '@/types/ui.types';
import { handleError, showInfo, showSuccess, withErrorHandling } from '@/utils/error-handling';
import { createClient } from '@/utils/supabase/client';

export function CreateAssistantDialog({
  open,
  onOpenChange,
  formData,
  onInputChange,
}: CreateAssistantDialogProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'details' | 'payment'>('details');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_userId, _setUserId] = useState<string>('');
  const { isLoading: isSavingSession, setIsLoading: setIsSavingSession } = useLoadingState(false);

  // Get user ID when dialog opens
  useEffect(() => {
    const getUserId = async () => {
      await withErrorHandling(
        async () => {
          if (!open) return;

          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user) {
            _setUserId(user.id);
          }
        },
        {
          toastTitle: 'Authentication Error',
          fallbackMessage: 'Failed to get user information',
        }
      );
    };

    void getUserId();
  }, [open]);

  const personalityOptions = [
    'Business Casual',
    'Formal',
    'Friendly',
    'Professional',
    'Casual',
    'Enthusiastic',
    'Technical',
  ];

  const _validateForm = () => {
    if (!formData.name.trim()) {
      handleError('Please enter an assistant display name', {
        fallbackMessage: 'Please enter an assistant display name',
      });

      return false;
    }
    if (!formData.concierge_name?.trim()) {
      handleError('Please enter an assistant name', {
        fallbackMessage: 'Please enter an assistant name',
      });

      return false;
    }
    if (!formData.personality) {
      handleError('Please select a personality', {
        fallbackMessage: 'Please select a personality',
      });

      return false;
    }
    if (!formData.business_name?.trim()) {
      handleError('Please enter your name or business name', {
        fallbackMessage: 'Please enter your name or business name',
      });

      return false;
    }

    return true;
  };

  const _handleSaveSessionAndShowPayment = async () => {
    if (!_validateForm()) {
      return;
    }

    setIsSavingSession(true);

    const saveSession = async () => {
      await withErrorHandling(
        async () => {
          console.log('🚀 Starting session save process...');
          console.log('📝 Form data to save:', formData);

          // Transform form data to match API interface
          const assistantData = {
            name: formData.name,
            description: formData.description,
            concierge_name: formData.concierge_name,
            personality: formData.personality,
            business_name: formData.business_name,
            business_phone: formData.business_phone,
            share_phone_number: formData.share_phone_number,
            display_name: formData.name,
          };

          console.log('🔄 Transformed assistant data:', assistantData);

          // Save assistant data to session
          const url = '/api/Concierge/session';

          console.log('🌐 Making POST request to:', url);

          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(assistantData),
          });

          console.log('📊 Response status:', response.status);
          console.log('📊 Response ok:', response.ok);

          if (!response.ok) {
            const errorText = await response.text();

            throw new Error(`Failed to save assistant data: ${errorText}`);
          }

          const result = (await response.json()) as { session_id: string; checkoutUrl?: string };
          const { session_id: newSessionId } = result;

          console.log('✅ Session created successfully:', newSessionId);

          // Set session ID and move to payment step
          setSessionId(newSessionId);
          setCurrentStep('payment');

          console.log('🎯 Moving to payment step with session:', newSessionId);
        },
        {
          toastTitle: 'Save Error',
          fallbackMessage: 'Failed to save assistant data',
        }
      );
    };

    try {
      await saveSession();
    } finally {
      setIsSavingSession(false);
    }
  };

  const handlePaymentSuccess = () => {
    setSessionId(null);
    setCurrentStep('details');
    onOpenChange(false);
    showSuccess('Payment successful!', 'Your assistant has been activated and is ready to use.');
    // Reset form data after successful payment
    onInputChange('name', '');
    onInputChange('description', '');
    onInputChange('conciergeName', '');
    onInputChange('personality', '');
    onInputChange('businessName', '');
    onInputChange('sharePhoneNumber', false);
    onInputChange('phoneNumber', '');
    onInputChange('selectedPlan', '');
  };

  const handlePaymentCancel = () => {
    // Keep the session and stay on payment step in case user wants to try again
    showInfo('Payment cancelled', 'You can continue with payment or go back to edit details.');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={`max-h-[85vh] overflow-y-auto ${currentStep === 'payment' ? 'sm:max-w-[900px]' : 'sm:max-w-[600px]'}`}
        >
          <DialogHeader>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (currentStep === 'payment') {
                    setCurrentStep('details');
                  } else {
                    onOpenChange(false);
                  }
                }}
                className="hover:bg-muted"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                <DialogTitle>
                  {currentStep === 'details' ? 'Create new no-show' : 'Complete payment'}
                </DialogTitle>
                <DialogDescription>
                  {currentStep === 'details'
                    ? 'Create a new no-show to help with your tasks.'
                    : 'Choose a plan and complete payment to activate your assistant.'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {currentStep === 'details' ? (
            // Details step content
            <>
              <div className="grid gap-4 py-4">
                {/* ...existing form fields... */}
                <div className="space-y-2">
                  <Label htmlFor="assistantName" className="font-medium">
                    No-show Display Name *
                  </Label>
                  <Input
                    id="assistantName"
                    placeholder="E.g., Sales Assistant, Support Bot"
                    value={formData.name}
                    onChange={e => {
                      onInputChange('name', e.target.value);
                    }}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    This is what you&apos;ll see in your dashboard.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="conciergeName" className="font-medium">
                    No-show Name *
                  </Label>
                  <Input
                    id="concierge_name"
                    placeholder="E.g., Alex, Sales Team"
                    value={formData.concierge_name ?? ''}
                    onChange={e => {
                      onInputChange('concierge_name', e.target.value);
                    }}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Give it a name for others to address it by.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="conciergePersonality" className="font-medium">
                    No-show Personality *
                  </Label>
                  <Select
                    value={formData.personality ?? ''}
                    onValueChange={value => {
                      onInputChange('personality', value);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a personality style" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[100px] overflow-y-auto">
                      {personalityOptions.map(option => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    This is the style and tone in which it would engage in dialogue with others.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessName" className="font-medium">
                    Your Name or Business Name *
                  </Label>
                  <Input
                    id="business_name"
                    placeholder="E.g., Acme Inc., John Smith"
                    value={formData.business_name ?? ''}
                    onChange={e => {
                      onInputChange('business_name', e.target.value);
                    }}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">How others know you by.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what this No-show does..."
                    value={formData.description ?? ''}
                    onChange={e => {
                      onInputChange('description', e.target.value);
                    }}
                    className="min-h-[80px] w-full"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sharePhoneNumber" className="font-medium">
                        Share Your Phone Number
                      </Label>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Enabling this lets your No-show share the inputted number.
                      </p>
                    </div>
                    <Switch
                      id="share_phone_number"
                      checked={formData.share_phone_number ?? false}
                      onCheckedChange={checked => {
                        onInputChange('share_phone_number', checked);
                      }}
                    />
                  </div>

                  {formData.share_phone_number && (
                    <div className="mt-2">
                      <Input
                        id="business_phone"
                        type="tel"
                        placeholder="E.g., +1 (555) 123-4567"
                        value={formData.business_phone ?? ''}
                        onChange={e => {
                          onInputChange('business_phone', e.target.value);
                        }}
                        className="w-full"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        This is useful if you want your No-show to redirect others to another number
                        if they request it.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    // Validate basic form first
                    if (!formData.name.trim()) {
                      handleError(new Error('Please enter an assistant display name'), {
                        toastTitle: 'Validation Error',
                      });

                      return;
                    }
                    if (!formData.concierge_name?.trim()) {
                      handleError(new Error('Please enter an assistant name'), {
                        toastTitle: 'Validation Error',
                      });

                      return;
                    }
                    if (!formData.personality) {
                      handleError(new Error('Please select a personality'), {
                        toastTitle: 'Validation Error',
                      });

                      return;
                    }
                    if (!formData.business_name?.trim()) {
                      handleError(new Error('Please enter your name or business name'), {
                        toastTitle: 'Validation Error',
                      });

                      return;
                    }
                    // Save session and proceed to payment
                    void _handleSaveSessionAndShowPayment();
                  }}
                  disabled={!formData.name.trim() || isSavingSession}
                >
                  {isSavingSession ? 'Saving...' : 'Continue to Payment'}
                </Button>
              </DialogFooter>
            </>
          ) : (
            // Payment step content
            <>
              <div className="py-4">
                {sessionId ? (
                  <StripePricingTable
                    sessionId={sessionId}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentCancel={handlePaymentCancel}
                    className="w-full"
                  />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Loading payment options...</p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentStep('details');
                  }}
                  disabled={isSavingSession}
                >
                  Back to Details
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    // Reset state when closing
                    setCurrentStep('details');
                    setSessionId(null);
                  }}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
