"use client";

import React, { useState, useCallback, type ChangeEvent } from 'react';
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

type CountryCode = 'US' | 'CA' | 'GB' | 'AU';

interface AssistantPhoneNumberSelectorProps {
  assistantId: string;
  onPhoneNumberAssigned?: (phoneNumber: string) => void;
}

const COUNTRY_CODES: Record<CountryCode, { name: string, prefix: string }> = {
  US: { name: 'United States', prefix: '+1' },
  CA: { name: 'Canada', prefix: '+1' },
  GB: { name: 'United Kingdom', prefix: '+44' },
  AU: { name: 'Australia', prefix: '+61' }
};

export function AssistantPhoneNumberSelector({
  assistantId: _assistantId,
  onPhoneNumberAssigned,
}: AssistantPhoneNumberSelectorProps) {
  const [isAssigning, setIsAssigning] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>('US');
  const [areaCode, setAreaCode] = useState('');
  const [currentPhoneNumber, setCurrentPhoneNumber] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const formatPhoneNumber = useCallback((phoneNumber: string): string => {
    if (phoneNumber.startsWith('+1') && phoneNumber.length === 12) {
      return `(${phoneNumber.substring(2, 5)}) ${phoneNumber.substring(5, 8)}-${phoneNumber.substring(8)}`;
    }
    return phoneNumber;
  }, []);

  const getCountryFromNumber = useCallback((phoneNumber: string): string => {
    const countryMatch = Object.entries(COUNTRY_CODES).find(([_, { prefix }]) => 
      phoneNumber.startsWith(prefix)
    );
    
    if (countryMatch) {
      return countryMatch[1].name;
    }
    
    // Get country code for unknown prefixes
    const countryCode = phoneNumber.substring(0, 3); // +XX format
    return `International (${countryCode})`;
  }, []);

  const handleDialogOpenChange = useCallback((open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setSelectedCountry('US');
      setAreaCode('');
    }
  }, []);

  const handleCountryChange = useCallback((value: string) => {
    setSelectedCountry(value as CountryCode);
  }, []);

  const handleAreaCodeChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 3) {
      setAreaCode(value);
    }
  }, []);

  const assignPhoneNumber = useCallback(async () => {
    if (!selectedCountry) {
      toast.error('Please select a country');
      return;
    }

    setIsAssigning(true);
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate a random phone number based on the country code
      let phoneNumber: string;
      
      switch (selectedCountry) {
        case 'US':
        case 'CA': {
          const areaCodeToUse = areaCode || '415';
          const randomNumber = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
          phoneNumber = `+1${areaCodeToUse}${randomNumber}`;
          break;
        }
        case 'GB': {
          const randomNumber = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
          phoneNumber = `+447${randomNumber}`;
          break;
        }
        case 'AU': {
          const randomNumber = Math.floor(Math.random() * 10000000).toString().padStart(8, '0');
          phoneNumber = `+614${randomNumber}`;
          break;
        }
        default: {
          const randomNumber = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
          phoneNumber = `+1${randomNumber}`;
        }
      }
      
      setCurrentPhoneNumber(phoneNumber);
      setDialogOpen(false);
      
      toast.success('Phone number assigned successfully!');

      onPhoneNumberAssigned?.(phoneNumber);
    } catch (error) {
      console.error('Error assigning phone number:', error);
      toast.error('Failed to assign phone number');
    } finally {
      setIsAssigning(false);
    }
  }, [selectedCountry, areaCode, onPhoneNumberAssigned]);

  // Clear/Unassign the current phone number (mock implementation)
  const unassignPhoneNumber = useCallback(async () => {
    if (!currentPhoneNumber) return;
    
    const confirmed = window.confirm('Are you sure you want to remove this phone number?');
    if (!confirmed) return;
    
    setIsLoading(true);
    try {
      // Add API call here when implementing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCurrentPhoneNumber(null);
      toast.success('Phone number unassigned successfully');
      
      onPhoneNumberAssigned?.('');
    } catch (error) {
      console.error('Error unassigning phone number:', error);
      toast.error('Failed to unassign phone number');
    } finally {
      setIsLoading(false);
    }
  }, [currentPhoneNumber, onPhoneNumberAssigned]);

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
              disabled={isLoading}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
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
                    <Select value={selectedCountry} onValueChange={handleCountryChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a country" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(COUNTRY_CODES).map(([code, { name }]) => (
                          <SelectItem key={code} value={code}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {(selectedCountry === 'US' || selectedCountry === 'CA') && (
                    <div className="space-y-2">
                      <Label htmlFor="areaCode">Area Code (Optional)</Label>
                      <Input
                        id="areaCode"
                        value={areaCode}
                        onChange={handleAreaCodeChange}
                        className="col-span-3"
                        placeholder="e.g. 415"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={assignPhoneNumber} 
                  disabled={isAssigning}
                >
                  {isAssigning ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Assign Number
                    </>
                  )}
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
