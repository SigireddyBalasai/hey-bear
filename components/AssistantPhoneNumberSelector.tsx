'use client';

import { useCallback, useState } from 'react';
import type { ChangeEvent } from 'react';

import { Check, Phone, PlusCircle, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

type CountryCode = 'US' | 'CA' | 'GB' | 'AU';

interface AssistantPhoneNumberSelectorProps {
  assistantId: string;
  onPhoneNumberAssigned?: (phoneNumber: string) => void;
}

// Add interfaces for API responses
interface AssignPhoneNumberResponse {
  error?: string;
  data?: {
    phoneNumber: string;
  };
  phoneNumber?: string;
}

interface UnassignPhoneNumberResponse {
  error?: string;
  success?: boolean;
}

const COUNTRY_CODES: Record<CountryCode, { name: string; prefix: string }> = {
  US: { name: 'United States', prefix: '+1' },
  CA: { name: 'Canada', prefix: '+1' },
  GB: { name: 'United Kingdom', prefix: '+44' },
  AU: { name: 'Australia', prefix: '+61' },
};

export function AssistantPhoneNumberSelector({
  assistantId: _assistantId,
  onPhoneNumberAssigned,
}: Readonly<AssistantPhoneNumberSelectorProps>) {
  const [isAssigning, setIsAssigning] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>('US');
  const [areaCode, setAreaCode] = useState('');
  const [currentPhoneNumber, setCurrentPhoneNumber] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const formatPhoneNumber = useCallback((phoneNumber: string): string => {
    if (phoneNumber.startsWith('+1') && phoneNumber.length === 12) {
      return `(${phoneNumber.slice(2, 5)}) ${phoneNumber.slice(5, 8)}-${phoneNumber.slice(8)}`;
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
    const countryCode = phoneNumber.slice(0, 3); // +XX format
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
    const value = e.target.value.replaceAll(/[^0-9]/g, '');
    if (value.length <= 3) {
      setAreaCode(value);
    }
  }, []);

  const assignPhoneNumber = useCallback(async () => {
    setIsAssigning(true);
    try {
      if (!selectedCountry) {
        toast.error('Please select a country');
        return;
      }

      // Build request body for real phone number assignment
      const requestBody: {
        assistantId: string;
        countryCode: string;
        areaCode?: string;
      } = {
        assistantId: _assistantId,
        countryCode: selectedCountry,
      };

      // Only add areaCode if it's provided
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
        const errorData = (await response.json()) as AssignPhoneNumberResponse;
        throw new Error(errorData.error || 'Failed to assign phone number');
      }

      const result = (await response.json()) as AssignPhoneNumberResponse;
      const assignedNumber = result.data?.phoneNumber || result.phoneNumber;

      if (!assignedNumber) {
        throw new Error('No phone number received from assignment');
      }

      setCurrentPhoneNumber(assignedNumber);
      setDialogOpen(false);

      toast.success('Phone number assigned successfully!');
      onPhoneNumberAssigned?.(assignedNumber);
    } catch (error) {
      console.error('Error assigning phone number:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to assign phone number');
    } finally {
      setIsAssigning(false);
    }
  }, [selectedCountry, areaCode, _assistantId, onPhoneNumberAssigned]);

  // Unassign the current phone number
  const unassignPhoneNumber = useCallback(async () => {
    if (!currentPhoneNumber) return;

    const confirmed = globalThis.confirm('Are you sure you want to remove this phone number?');
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/phone-numbers/unassign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assistantId: _assistantId,
          phoneNumber: currentPhoneNumber,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as UnassignPhoneNumberResponse;
        throw new Error(errorData.error || 'Failed to unassign phone number');
      }

      setCurrentPhoneNumber(null);
      toast.success('Phone number unassigned successfully');
      onPhoneNumberAssigned?.('');
    } catch (error) {
      console.error('Error unassigning phone number:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to unassign phone number');
    } finally {
      setIsLoading(false);
    }
  }, [currentPhoneNumber, _assistantId, onPhoneNumberAssigned]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">SMS Phone Number</h3>
        </div>
        <div className="h-6 w-32 animate-pulse rounded bg-muted"></div>
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
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <X className="h-4 w-4" />
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
                <Button
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={assignPhoneNumber} disabled={isAssigning}>
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
          <p>
            This No-show can receive and respond to SMS messages at this phone number.{' '}
            <span className="text-xs text-muted-foreground">
              ({getCountryFromNumber(currentPhoneNumber)})
            </span>
          </p>
        ) : (
          <p>Assign a phone number to enable SMS interactions with this No-show.</p>
        )}
      </div>
    </div>
  );
}
