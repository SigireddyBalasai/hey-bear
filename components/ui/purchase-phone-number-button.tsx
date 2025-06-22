import { useState } from 'react';

import { ShoppingCart } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PurchasePhoneNumberButtonProps {
  onPhoneNumberPurchased?: () => void;
}

export function PurchasePhoneNumberButton({
  onPhoneNumberPurchased,
}: PurchasePhoneNumberButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [areaCode, setAreaCode] = useState('');
  const [countryCode, setCountryCode] = useState('US');

  const handlePurchase = async () => {
    if (!phoneNumber && !areaCode) {
      toast.error('Please provide either a specific phone number or area code');
      return;
    }

    setIsLoading(true);
    try {
      const requestBody: any = { countryCode };

      if (phoneNumber) {
        requestBody.phoneNumber = phoneNumber;
      } else if (areaCode) {
        requestBody.areaCode = areaCode;
      }

      const response = await fetch('/api/twilio/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to purchase phone number');
      }

      const result = await response.json();
      toast.success(`Phone number ${result.data.phoneNumber} purchased successfully!`);

      onPhoneNumberPurchased?.();
      setIsOpen(false);
      setPhoneNumber('');
      setAreaCode('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to purchase phone number');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <ShoppingCart className="h-4 w-4 mr-2" />
          Purchase Phone Number
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Purchase Phone Number</DialogTitle>
          <DialogDescription>
            Purchase a new phone number from Twilio. You can specify a particular number or search
            by area code.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="country">Country</Label>
            <Select value={countryCode} onValueChange={setCountryCode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="US">United States</SelectItem>
                <SelectItem value="CA">Canada</SelectItem>
                <SelectItem value="GB">United Kingdom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone-number">Specific Phone Number (Optional)</Label>
            <Input
              id="phone-number"
              placeholder="+1234567890"
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
            />
          </div>

          <div className="text-center text-sm text-muted-foreground">OR</div>

          <div className="grid gap-2">
            <Label htmlFor="area-code">Area Code (Optional)</Label>
            <Input
              id="area-code"
              placeholder="415"
              value={areaCode}
              onChange={e => setAreaCode(e.target.value)}
              maxLength={3}
            />
          </div>

          <div className="text-xs text-muted-foreground">
            If you specify both a phone number and area code, the specific phone number takes
            priority. If you only specify an area code, we'll find an available number in that area.
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handlePurchase} disabled={isLoading || (!phoneNumber && !areaCode)}>
            {isLoading ? 'Purchasing...' : 'Purchase'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
