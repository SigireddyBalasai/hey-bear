import { useEffect, useState } from 'react';

import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

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
import { createClient } from '@/utils/supabase/client';

import { PricingTablePopup } from './PricingTablePopup';

interface CreateAssistantDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  formData: {
    name: string;
    description: string;
    conciergeName: string;
    personality: string;
    businessName: string;
    sharePhoneNumber: boolean;
    phoneNumber: string;
    selectedPlan: string;
  };
  handleInputChange: (field: string, value: string | boolean) => void;
  handleCreateAssistant: () => void;
  isCreating: boolean;
  userId?: string;
}

export function CreateAssistantDialog({
  open,
  setOpen,
  formData,
  handleInputChange,
  handleCreateAssistant: _handleCreateAssistant,
  isCreating: _isCreating,
  userId: _userIdProp,
}: CreateAssistantDialogProps) {
  const [showPricingPopup, setShowPricingPopup] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'details' | 'payment'>('details');
  const [_userId, _setUserId] = useState<string>('');
  const [isSavingSession, setIsSavingSession] = useState(false);

  // Get user ID when dialog opens
  useEffect(() => {
    async function getUserId() {
      if (!open) return;

      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          _setUserId(user.id);
        }
      } catch (error) {
        console.error('Error getting user:', error);
      }
    }

    getUserId();
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
      toast.error('Please enter an assistant display name');
      return false;
    }
    if (!formData.conciergeName.trim()) {
      toast.error('Please enter an assistant name');
      return false;
    }
    if (!formData.personality) {
      toast.error('Please select a personality');
      return false;
    }
    if (!formData.businessName.trim()) {
      toast.error('Please enter your name or business name');
      return false;
    }
    return true;
  };

  const _handleSaveSessionAndShowPayment = async () => {
    if (!_validateForm()) {
      return;
    }

    setIsSavingSession(true);

    try {
      console.log('🚀 Starting session save process...');
      console.log('📝 Form data to save:', formData);

      // Transform form data to match API interface
      const assistantData = {
        name: formData.name,
        description: formData.description,
        concierge_name: formData.conciergeName,
        personality: formData.personality,
        business_name: formData.businessName,
        business_phone: formData.phoneNumber,
        share_phone_number: formData.sharePhoneNumber,
        display_name: formData.name,
        plan_id: formData.selectedPlan || 'personal', // Default to personal plan
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
        console.error('❌ Response error text:', errorText);
        throw new Error('Failed to save assistant data');
      }

      const result = (await response.json()) as { session_id: string; checkoutUrl?: string };
      const { session_id: newSessionId } = result;

      console.log('✅ Session created successfully:', newSessionId);

      // Set session ID and move to payment step
      setSessionId(newSessionId);
      setCurrentStep('payment');

      console.log('🎯 Moving to payment step with session:', newSessionId);
    } catch (error: unknown) {
      console.error('Error saving session:', error);
      toast.error('Failed to save assistant data', {
        description: 'Please try again.',
      });
    } finally {
      setIsSavingSession(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPricingPopup(false);
    setSessionId(null);
    setCurrentStep('details');
    setOpen(false);
    toast.success('Payment successful!', {
      description: 'Your assistant has been activated and is ready to use.',
    });
    // Reset form data after successful payment
    handleInputChange('name', '');
    handleInputChange('description', '');
    handleInputChange('conciergeName', '');
    handleInputChange('personality', '');
    handleInputChange('businessName', '');
    handleInputChange('sharePhoneNumber', false);
    handleInputChange('phoneNumber', '');
    handleInputChange('selectedPlan', '');
  };

  const handlePaymentCancel = () => {
    // Keep the session and stay on payment step in case user wants to try again
    toast.info('Payment cancelled', {
      description: 'You can continue with payment or go back to edit details.',
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
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
                    setOpen(false);
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
                      handleInputChange('name', e.target.value);
                    }}
                    className="w-full"
                    autoFocus
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
                    id="conciergeName"
                    placeholder="E.g., Alex, Sales Team"
                    value={formData.conciergeName}
                    onChange={e => {
                      handleInputChange('conciergeName', e.target.value);
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
                    value={formData.personality}
                    onValueChange={value => {
                      handleInputChange('personality', value);
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
                    id="businessName"
                    placeholder="E.g., Acme Inc., John Smith"
                    value={formData.businessName}
                    onChange={e => {
                      handleInputChange('businessName', e.target.value);
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
                    value={formData.description}
                    onChange={e => {
                      handleInputChange('description', e.target.value);
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
                      id="sharePhoneNumber"
                      checked={formData.sharePhoneNumber}
                      onCheckedChange={checked => {
                        handleInputChange('sharePhoneNumber', checked);
                      }}
                    />
                  </div>

                  {formData.sharePhoneNumber && (
                    <div className="mt-2">
                      <Input
                        id="phoneNumber"
                        type="tel"
                        placeholder="E.g., +1 (555) 123-4567"
                        value={formData.phoneNumber}
                        onChange={e => {
                          handleInputChange('phoneNumber', e.target.value);
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
                    setOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    // Validate basic form first
                    if (!formData.name.trim()) {
                      toast.error('Please enter an assistant display name');
                      return;
                    }
                    if (!formData.conciergeName.trim()) {
                      toast.error('Please enter an assistant name');
                      return;
                    }
                    if (!formData.personality) {
                      toast.error('Please select a personality');
                      return;
                    }
                    if (!formData.businessName.trim()) {
                      toast.error('Please enter your name or business name');
                      return;
                    }
                    // Save session and proceed to payment
                    _handleSaveSessionAndShowPayment();
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
                    setOpen(false);
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

      {/* Pricing Table Popup - Keep this for alternative flow if needed */}
      {sessionId && (
        <PricingTablePopup
          open={showPricingPopup}
          onOpenChange={setShowPricingPopup}
          sessionId={sessionId}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentCancel={handlePaymentCancel}
        />
      )}
    </>
  );
}
