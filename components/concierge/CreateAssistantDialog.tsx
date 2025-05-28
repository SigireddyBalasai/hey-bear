import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RefreshCw, ChevronLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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
  };
  handleInputChange: (field: string, value: string | boolean) => void;
  handleCreateAssistant: () => void;
  isCreating: boolean;
}

export function CreateAssistantDialog({
  open,
  setOpen,
  formData,
  handleInputChange,
  handleCreateAssistant,
  isCreating,
}: CreateAssistantDialogProps) {
  const [customerSessionSecret, setCustomerSessionSecret] = useState<string>("");
  
  const personalityOptions = [
    "Business Casual",
    "Formal",
    "Friendly",
    "Professional",
    "Casual",
    "Enthusiastic",
    "Technical",
  ];

  // Fetch customer session when dialog opens
  useEffect(() => {
    const fetchCustomerSession = async () => {
      if (open) {
        try {
          const response = await fetch('/api/stripe/customer-session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            setCustomerSessionSecret(data.customer_session_client_secret);
          } else {
            console.error('Failed to fetch customer session');
          }
        } catch (error) {
          console.error('Error fetching customer session:', error);
        }
      }
    };
    
    fetchCustomerSession();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setOpen(false)}
              className="hover:bg-muted"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <DialogTitle>Create new no-show</DialogTitle>
              <DialogDescription>
                Create a new no-show to help with your tasks.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="assistantName" className="font-medium">
              No-show Display Name *
            </Label>
            <Input
              id="assistantName"
              placeholder="E.g., Sales Assistant, Support Bot"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className="w-full"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              This is what you&apos;ll see in your dashboard.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="conciergeName" className="font-medium">
              No-show Name
            </Label>
            <Input
              id="conciergeName"
              placeholder="E.g., Alex, Sales Team"
              value={formData.conciergeName}
              onChange={(e) => handleInputChange("conciergeName", e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Give it a name for others to address it by.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="conciergePersonality" className="font-medium">
              No-show Personality
            </Label>
            <Select
              value={formData.personality}
              onValueChange={(value) => handleInputChange("personality", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a personality style" />
              </SelectTrigger>
              <SelectContent className="max-h-[100px] overflow-y-auto">
                {personalityOptions.map((option) => (
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
              Your Name or Business Name
            </Label>
            <Input
              id="businessName"
              placeholder="E.g., Acme Inc., John Smith"
              value={formData.businessName}
              onChange={(e) => handleInputChange("businessName", e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              How others know you by.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Describe what this No-show does..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="min-h-[80px] w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sharePhoneNumber" className="font-medium">
                  Share Your Phone Number
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Enabling this lets your No-show share the inputted number.
                </p>
              </div>
              <Switch
                id="sharePhoneNumber"
                checked={formData.sharePhoneNumber}
                onCheckedChange={(checked) => handleInputChange("sharePhoneNumber", checked)}
              />
            </div>

            {formData.sharePhoneNumber && (
              <div className="mt-2">
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="E.g., +1 (555) 123-4567"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This is useful if you want your No-show to redirect others to another number if they request it.
                </p>
              </div>
            )}
          </div>
          
          <Separator className="my-4" />
        </div>

        {/* Stripe Pricing Table START */}
        <div>
          {customerSessionSecret ? (
            <>
              {/* @ts-ignore: Stripe pricing table is a custom element */}
              <stripe-pricing-table 
                pricing-table-id="prctbl_1RLSa3JBwNLaAmkcYljx7l0w"
                publishable-key="pk_test_51NLOGiJBwNLaAmkcBWq2YISD7PdDcFqArna2ejERSB0e6BgdOpB9KgSGW0aVi8FmIRNnLWtSooTJhI2BwIrkSwAi00uNXm3gOy"
                customer-session-client-secret={customerSessionSecret}
                success-url={`${window.location.origin}/dashboard?payment=success`}
                cancel-url={`${window.location.origin}/Concierge?payment=cancelled`}
              >
              {/* @ts-ignore: Stripe pricing table is a custom element */}
              </stripe-pricing-table>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading pricing options...</p>
            </div>
          )}
        </div>
        {/* Stripe Pricing Table END */}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateAssistant} 
            disabled={isCreating || !formData.name.trim()}
          >
            {isCreating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create No-show"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}