import { useState } from 'react';

import { Phone, PhoneOff } from 'lucide-react';
import { toast } from 'sonner';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PhoneNumber {
  id: string;
  phoneNumber: string;
  country: string;
  isAssigned: boolean;
}

interface Assistant {
  id: string;
  name: string;
  assignedPhoneNumber?: string;
}

interface AssignPhoneNumberButtonProps {
  assistant: Assistant;
  onPhoneNumberAssigned?: (assistantId: string, phoneNumber: string) => void;
}

export function AssignPhoneNumberButton({
  assistant,
  onPhoneNumberAssigned,
}: AssignPhoneNumberButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [availableNumbers, setAvailableNumbers] = useState<PhoneNumber[]>([]);
  const [selectedNumberId, setSelectedNumberId] = useState<string>('');

  const loadAvailableNumbers = async () => {
    try {
      const response = await fetch('/api/twilio/available-numbers');
      if (!response.ok) throw new Error('Failed to load phone numbers');

      const data = await response.json();
      setAvailableNumbers(data.data?.phoneNumbers ?? []);
    } catch (error) {
      toast.error('Failed to load available phone numbers');
    }
  };

  const handleAssignNumber = async () => {
    if (!selectedNumberId) {
      toast.error('Please select a phone number');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/twilio/assign-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assistantId: assistant.id,
          phoneNumberId: selectedNumberId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign phone number');
      }

      const result = await response.json();
      toast.success('Phone number assigned successfully!');

      onPhoneNumberAssigned?.(assistant.id, result.data.phoneNumber);
      setIsOpen(false);
      setSelectedNumberId('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to assign phone number');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnassignNumber = async () => {
    if (!assistant.assignedPhoneNumber) return;

    setIsLoading(true);
    try {
      // Find the phone number record to get its ID
      const numbersResponse = await fetch('/api/twilio/available-numbers');
      const numbersData = await numbersResponse.json();
      const allNumbers = numbersData.data?.phoneNumbers ?? [];

      const phoneRecord = allNumbers.find(
        (num: PhoneNumber) => num.phoneNumber === assistant.assignedPhoneNumber
      );

      if (!phoneRecord) {
        throw new Error('Phone number record not found');
      }

      const response = await fetch('/api/twilio/unassign-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumberId: phoneRecord.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to unassign phone number');
      }

      toast.success('Phone number unassigned successfully!');
      onPhoneNumberAssigned?.(assistant.id, '');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to unassign phone number');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogOpen = (open: boolean) => {
    setIsOpen(open);
    if (open && !assistant.assignedPhoneNumber) {
      loadAvailableNumbers();
    }
  };

  // If assistant already has a phone number, show unassign button
  if (assistant.assignedPhoneNumber) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Phone className="h-4 w-4" />
          {assistant.assignedPhoneNumber}
        </div>
        <Button variant="outline" size="sm" onClick={handleUnassignNumber} disabled={isLoading}>
          <PhoneOff className="h-4 w-4 mr-1" />
          Unassign
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Phone className="h-4 w-4 mr-1" />
          Assign Phone Number
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Phone Number</DialogTitle>
          <DialogDescription>
            Assign a phone number to {assistant.name} for SMS and voice interactions.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="phone-number" className="text-sm font-medium">
              Available Phone Numbers
            </label>
            <Select value={selectedNumberId} onValueChange={setSelectedNumberId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a phone number" />
              </SelectTrigger>
              <SelectContent>
                {availableNumbers.length === 0 ? (
                  <SelectItem value="" disabled>
                    No available phone numbers
                  </SelectItem>
                ) : (
                  availableNumbers.map(number => (
                    <SelectItem key={number.id} value={number.id}>
                      {number.phoneNumber} ({number.country})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {availableNumbers.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Purchase phone numbers from the admin panel to assign them to assistants.
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleAssignNumber}
            disabled={isLoading || !selectedNumberId || availableNumbers.length === 0}
          >
            {isLoading ? 'Assigning...' : 'Assign Number'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
