import { useEffect, useState } from 'react';

import { Phone, Users } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { AssignPhoneNumberButton } from './assign-phone-number-button';
import { PurchasePhoneNumberButton } from './purchase-phone-number-button';

interface PhoneNumber {
  id: string;
  phoneNumber: string;
  country: string;
  isAssigned: boolean;
  assignedAssistant?: {
    id: string;
    name: string;
  };
  status: string;
  capabilities: {
    sms: boolean;
    voice: boolean;
  };
}

interface Assistant {
  id: string;
  name: string;
  assignedPhoneNumber?: string;
}

interface PhoneNumberManagementProps {
  assistants?: Assistant[];
  isAdmin?: boolean;
}

export function PhoneNumberManagement({
  assistants = [],
  isAdmin = false,
}: PhoneNumberManagementProps) {
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPhoneNumbers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/twilio/available-numbers');
      if (!response.ok) throw new Error('Failed to load phone numbers');

      const data = await response.json();
      setPhoneNumbers(data.data?.phoneNumbers ?? []);
    } catch (error) {
      toast.error('Failed to load phone numbers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPhoneNumbers();
  }, []);

  const handlePhoneNumberPurchased = () => {
    loadPhoneNumbers();
  };

  const handlePhoneNumberAssigned = (assistantId: string, phoneNumber: string) => {
    loadPhoneNumbers();
  };

  const unassignedNumbers = phoneNumbers.filter(num => !num.isAssigned);
  const assignedNumbers = phoneNumbers.filter(num => num.isAssigned);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Phone Numbers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading phone numbers...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Purchase Button for Admins */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Phone Number Management
            </CardTitle>
            {isAdmin && (
              <PurchasePhoneNumberButton onPhoneNumberPurchased={handlePhoneNumberPurchased} />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{phoneNumbers.length}</div>
              <div className="text-sm text-muted-foreground">Total Numbers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{assignedNumbers.length}</div>
              <div className="text-sm text-muted-foreground">Assigned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{unassignedNumbers.length}</div>
              <div className="text-sm text-muted-foreground">Available</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assistant Assignment Section */}
      {assistants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Assistant Phone Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assistants.map(assistant => (
                <div
                  key={assistant.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h3 className="font-medium">{assistant.name}</h3>
                    <p className="text-sm text-muted-foreground">Assistant ID: {assistant.id}</p>
                  </div>
                  <AssignPhoneNumberButton
                    assistant={assistant}
                    onPhoneNumberAssigned={handlePhoneNumberAssigned}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phone Numbers List */}
      <Card>
        <CardHeader>
          <CardTitle>All Phone Numbers</CardTitle>
        </CardHeader>
        <CardContent>
          {phoneNumbers.length === 0 ? (
            <div className="text-center py-8">
              <Phone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Phone Numbers</h3>
              <p className="text-muted-foreground mb-4">
                {isAdmin
                  ? 'Purchase your first phone number to get started with SMS and voice interactions.'
                  : 'No phone numbers are available. Contact an administrator to purchase phone numbers.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {phoneNumbers.map(number => (
                <div
                  key={number.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="font-medium">{number.phoneNumber}</div>
                    <div className="flex items-center gap-2">
                      <Badge variant={number.isAssigned ? 'default' : 'secondary'}>
                        {number.isAssigned ? 'Assigned' : 'Available'}
                      </Badge>
                      <Badge variant="outline">{number.country}</Badge>
                      <div className="flex gap-1">
                        {number.capabilities.sms && (
                          <Badge variant="outline" className="text-xs">
                            SMS
                          </Badge>
                        )}
                        {number.capabilities.voice && (
                          <Badge variant="outline" className="text-xs">
                            Voice
                          </Badge>
                        )}
                      </div>
                    </div>
                    {number.isAssigned && number.assignedAssistant && (
                      <div className="text-sm text-muted-foreground">
                        Assigned to: {number.assignedAssistant.name}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
