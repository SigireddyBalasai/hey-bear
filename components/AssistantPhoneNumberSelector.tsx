"use client";

import { useState, useEffect } from 'react';
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
  onPhoneNumberAssigned?: (phoneNumber: string) => void;
}

export function AssistantPhoneNumberSelector({
  assistantId,
  onPhoneNumberAssigned,
}: AssistantPhoneNumberSelectorProps) {
  const [isAssigning, setIsAssigning] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [areaCode, setAreaCode] = useState('');
  const [currentPhoneNumber, setCurrentPhoneNumber] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  // Handle dialog open state
  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      // Reset selection when closing dialog
      setSelectedCountry('US');
      setAreaCode('');
    }
  };

  // Handle phone number assignment (mock implementation)
  const assignPhoneNumber = async () => {
    if (!selectedCountry) {
      toast.error('Please select a country');
      return;
    }

    setIsAssigning(true);
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate a random phone number based on the country code
      let phoneNumber = '';
      switch (selectedCountry) {
        case 'US':
        case 'CA':
          const areaCodeToUse = areaCode || '415';
          const randomNumber = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
          phoneNumber = `+1${areaCodeToUse}${randomNumber}`;
          break;
        case 'GB':
          phoneNumber = `+447${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`;
          break;
        case 'AU':
          phoneNumber = `+614${Math.floor(Math.random() * 10000000).toString().padStart(8, '0')}`;
          break;
        default:
          phoneNumber = `+1${Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')}`;
      }
      
      setCurrentPhoneNumber(phoneNumber);
      setDialogOpen(false);
      
      toast.success('Phone number assigned successfully!');

      // Call the onPhoneNumberAssigned callback if provided
      if (onPhoneNumberAssigned) {
        onPhoneNumberAssigned(phoneNumber);
      }
    } catch (error) {
      console.error('Error assigning phone number:', error);
      toast.error('Failed to assign phone number');
    } finally {
      setIsAssigning(false);
    }
  };

  // Clear/Unassign the current phone number (mock implementation)
  const unassignPhoneNumber = async () => {
    if (!currentPhoneNumber) return;
    
    setIsAssigning(true);
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCurrentPhoneNumber(null);
      toast.success('Phone number removed successfully');
      
      // Call the onPhoneNumberAssigned callback with empty string if provided
      if (onPhoneNumberAssigned) {
        onPhoneNumberAssigned('');
      }
    } catch (error) {
      console.error('Error unassigning phone number:', error);
      toast.error('Failed to unassign phone number');
    } finally {
      setIsAssigning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">SMS Phone Number</h3>
        </div>
        <div className="h-6 w-32 bg-muted animate-pulse rounded"></div>
      </div>
    );
  }

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
