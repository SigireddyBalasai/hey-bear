"use client";

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Phone, RefreshCw, PlusCircle, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface AssistantPhoneNumberSelectorProps {
  assistantId: string;
  onAssigned: (phoneNumber: string) => void;
  currentPhoneNumber?: string | null;
}

export function AssistantPhoneNumberSelector({
  assistantId,
  onAssigned,
  currentPhoneNumber
}: AssistantPhoneNumberSelectorProps) {
  const [isAssigning, setIsAssigning] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [areaCode, setAreaCode] = useState('');
  const supabase = createClient();

  // Format phone number for display
  const formatPhoneNumber = (phoneNumber: string) => {
    if (phoneNumber.startsWith('+1') && phoneNumber.length === 12) {
      return `(${phoneNumber.substring(2, 5)}) ${phoneNumber.substring(5, 8)}-${phoneNumber.substring(8)}`;
    }
    return phoneNumber;
  };

  // Get country name from phone number
  const getCountryFromNumber = (phoneNumber: string): string => {
    if (phoneNumber.startsWith('+1')) return 'United States/Canada';
    if (phoneNumber.startsWith('+44')) return 'United Kingdom';
    if (phoneNumber.startsWith('+61')) return 'Australia';
    if (phoneNumber.startsWith('+49')) return 'Germany';
    if (phoneNumber.startsWith('+33')) return 'France';
    if (phoneNumber.startsWith('+34')) return 'Spain';
    if (phoneNumber.startsWith('+39')) return 'Italy';
    if (phoneNumber.startsWith('+81')) return 'Japan';
    
    // Get country code
    const countryCode = phoneNumber.substring(0, 3); // +XX format
    return `International (${countryCode})`;
  };

  // Get origin for default webhook
  const getOrigin = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return '';
  };

  // Build default webhook URL
  const getDefaultWebhookUrl = () => {
    // Ensure the URL is properly formatted with the assistantId as a query parameter
    const baseUrl = `${getOrigin()}/api/twilio/webhook`;
    const url = new URL(baseUrl);
    url.searchParams.append('assistantId', assistantId);
    return url.toString();
  };

  // Handle phone number assignment
  const assignPhoneNumber = async () => {
    if (!selectedCountry) {
      toast.error('Please select a country');
      return;
    }

    setIsAssigning(true);
    try {
      // Build request body, only including areaCode if it's not empty
      const requestBody: {
        assistantId: string;
        countryCode: string;
        webhookUrl: string;
        areaCode?: string;
      } = {
        assistantId,
        countryCode: selectedCountry,
        webhookUrl: getDefaultWebhookUrl()
      };

      // Only add areaCode to the request if it's not empty
      if (areaCode && areaCode.trim() !== '') {
        requestBody.areaCode = areaCode.trim();
      }

      const response = await fetch('/api/phone-numbers/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign phone number');
      }

      const result = await response.json();
      const assignedNumber = result.data?.phoneNumber || '';
      toast.success('Phone number assigned successfully!');
      onAssigned(assignedNumber);
      setDialogOpen(false);
    } catch (error) {
      console.error('Error assigning phone number:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to assign phone number');
    } finally {
      setIsAssigning(false);
    }
  };

  // Handle dialog open state
  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      // Reset selection when closing dialog
      setSelectedCountry('US');
      setAreaCode('');
    }
  };

  // Clear/Unassign the current phone number
  const unassignPhoneNumber = async () => {
    if (!currentPhoneNumber) return;
    
    setIsAssigning(true);
    try {
      const response = await fetch('/api/phone-numbers/unassign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assistantId,
          phoneNumber: currentPhoneNumber
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unassign phone number');
      }

      toast.success('Phone number removed successfully');
      onAssigned("");
    } catch (error) {
      console.error('Error unassigning phone number:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to unassign phone number');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">SMS Phone Number</h3>
        </div>
        
        {currentPhoneNumber ? (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5">
              <Phone className="h-3 w-3" />
              {formatPhoneNumber(currentPhoneNumber)}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={unassignPhoneNumber} 
              disabled={isAssigning}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {isAssigning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            </Button>
          </div>
        ) : (
          <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                Add Phone Number
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Assign Phone Number</DialogTitle>
                <DialogDescription>
                  Choose a country to automatically assign a phone number to this No-show.
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="CA">Canada</SelectItem>
                        <SelectItem value="GB">United Kingdom</SelectItem>
                        <SelectItem value="AU">Australia</SelectItem>
                        <SelectItem value="DE">Germany</SelectItem>
                        <SelectItem value="FR">France</SelectItem>
                        <SelectItem value="ES">Spain</SelectItem>
                        <SelectItem value="IT">Italy</SelectItem>
                        <SelectItem value="JP">Japan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="areaCode">Area Code (Optional)</Label>
                    <Input
                      id="areaCode"
                      placeholder="e.g. 415"
                      value={areaCode}
                      onChange={(e) => setAreaCode(e.target.value)}
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground">
                      Area code is only used for some countries like the US and Canada
                    </p>
                  </div>
                  
                  <div className="bg-muted rounded-md p-3 text-sm">
                    <p>When you assign a phone number:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>A number will be automatically selected from the chosen country</li>
                      <li>The number will be set up to receive SMS messages</li>
                      <li>Standard messaging rates may apply to end users</li>
                      <li>One phone number can only be assigned to one No-show</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={assignPhoneNumber} 
                  disabled={isAssigning || !selectedCountry}
                >
                  {isAssigning ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Assign Number
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      <div className="text-sm text-muted-foreground">
        {currentPhoneNumber ? (
          <p>This No-show can receive and respond to SMS messages at this phone number. <span className="text-xs text-muted-foreground">({getCountryFromNumber(currentPhoneNumber)})</span></p>
        ) : (
          <p>Assign a phone number to enable SMS interactions with this No-show.</p>
        )}
      </div>
    </div>
  );
}
