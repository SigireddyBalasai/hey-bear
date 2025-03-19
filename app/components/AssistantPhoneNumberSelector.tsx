"use client";

import { useState, useEffect } from 'react';
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
import { Phone, RefreshCw, PlusCircle, Check, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";

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
  const [availableNumbers, setAvailableNumbers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const supabase = createClient();

  // Fetch available phone numbers when dialog opens
  const fetchAvailablePhoneNumbers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/phone-numbers/available');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch available phone numbers');
      }
      
      const { numbers } = await response.json();
      setAvailableNumbers(numbers || []);
    } catch (error) {
      console.error('Error fetching phone numbers:', error);
      toast.error('Failed to load available phone numbers');
    } finally {
      setIsLoading(false);
    }
  };

  // Format phone number for display
  const formatPhoneNumber = (phoneNumber: string) => {
    if (phoneNumber.startsWith('+1') && phoneNumber.length === 12) {
      return `(${phoneNumber.substring(2, 5)}) ${phoneNumber.substring(5, 8)}-${phoneNumber.substring(8)}`;
    }
    return phoneNumber;
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
    if (!selectedNumber) {
      toast.error('Please select a phone number');
      return;
    }

    setIsAssigning(true);
    try {
      const response = await fetch('/api/phone-numbers/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assistantId,
          phoneNumber: selectedNumber,
          webhook: getDefaultWebhookUrl()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign phone number');
      }

      const result = await response.json();
      toast.success('Phone number assigned successfully!');
      onAssigned(selectedNumber);
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
    if (open) {
      fetchAvailablePhoneNumbers();
    } else {
      // Reset selection when closing dialog
      setSelectedNumber("");
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
                  Select a phone number to connect to this concierge. This will enable SMS conversations.
                </DialogDescription>
              </DialogHeader>
              
              {isLoading ? (
                <div className="py-4 text-center">
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Loading available numbers...</p>
                </div>
              ) : availableNumbers.length === 0 ? (
                <div>
                  <Alert className="my-2 border border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-200">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>No phone numbers available</AlertTitle>
                    <AlertDescription>
                      There are no unassigned phone numbers in the system.
                      Contact an administrator to add more phone numbers.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="py-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Select value={selectedNumber} onValueChange={setSelectedNumber}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a phone number" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableNumbers.map((phone) => (
                            <SelectItem key={phone.id} value={phone.number}>
                              {formatPhoneNumber(phone.number)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="bg-muted rounded-md p-3 text-sm">
                      <p>When you assign a phone number:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Users can interact with the concierge via SMS</li>
                        <li>SMS messages will be forwarded to your webhook</li>
                        <li>Standard messaging rates may apply to end users</li>
                        <li>One phone number can only be assigned to one concierge</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={assignPhoneNumber} 
                  disabled={isAssigning || !selectedNumber || availableNumbers.length === 0}
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
          <p>This concierge can receive and respond to SMS messages at this number.</p>
        ) : (
          <p>Assign a phone number to enable SMS interactions with this concierge.</p>
        )}
      </div>
    </div>
  );
}
