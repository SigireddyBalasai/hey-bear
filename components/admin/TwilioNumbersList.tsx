'use client';

import { useEffect, useState } from 'react';

import { AlertTriangle, Check, ExternalLink, Phone, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { IncomingPhoneNumberInstance } from 'twilio/lib/rest/api/v2010/account/incomingPhoneNumber';

import { fetchAllPhoneNumbers, importPhoneNumber } from '@/app/admin/utils/twilioUtils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Use Twilio SDK type instead of custom interface
type TwilioNumber = IncomingPhoneNumberInstance;

interface DatabaseNumber {
  phone_number: string;
  isAssigned: boolean;
}

export function TwilioNumbersList() {
  const [isLoading, setIsLoading] = useState(true);
  const [twilioNumbers, setTwilioNumbers] = useState<TwilioNumber[]>([]);
  const [dbNumbers, setDbNumbers] = useState<DatabaseNumber[]>([]);
  const [unmanagedNumbers, setUnmanagedNumbers] = useState<TwilioNumber[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Fetch phone numbers from Twilio and database
  const fetchPhoneNumbers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchAllPhoneNumbers();
      // Type safety checks
      if (data && typeof data === 'object') {
        if (Array.isArray(data.twilioNumbers)) {
          setTwilioNumbers(data.twilioNumbers as TwilioNumber[]);
        }
        if (Array.isArray(data.dbNumbers)) {
          setDbNumbers(data.dbNumbers as DatabaseNumber[]);
        }
        if (Array.isArray(data.unmanagedNumbers)) {
          setUnmanagedNumbers(data.unmanagedNumbers as TwilioNumber[]);
        }
      }
    } catch (error) {
      console.error('Error fetching phone numbers:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      toast.error('Failed to fetch phone numbers');
    } finally {
      setIsLoading(false);
    }
  };

  // Add unmanaged number to database
  const addToDatabase = async (phoneNumber: string) => {
    setIsImporting(true);
    try {
      await importPhoneNumber(phoneNumber);
      toast.success('Phone number added to database');
      void fetchPhoneNumbers(); // Refresh data
    } catch (error) {
      console.error('Error adding phone number:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add number');
    } finally {
      setIsImporting(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    void fetchPhoneNumbers();
  }, []);

  return (
    <Card className="w-full shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            <span>Twilio Account Phone Numbers</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchPhoneNumbers} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>All phone numbers from your Twilio account</CardDescription>
      </CardHeader>

      <CardContent>
        {error ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium">Connection Error</p>
                <p className="mt-1 text-sm">{error}</p>
              </div>
            </div>
          </div>
        ) : isLoading ? (
          <div className="py-8 text-center">
            <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-muted-foreground/50" />
            <p className="text-muted-foreground">Loading phone numbers...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Unmanaged Numbers Section */}
            {unmanagedNumbers.length > 0 && (
              <div>
                <h3 className="mb-2 flex items-center gap-1 text-sm font-medium">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Unmanaged Twilio Numbers
                </h3>
                <p className="mb-4 text-xs text-muted-foreground">
                  These phone numbers exist in your Twilio account but are not yet added to the
                  database.
                </p>

                <div className="rounded-md border">
                  <div className="grid grid-cols-3 bg-muted px-4 py-3 text-sm font-medium">
                    <div>Phone Number</div>
                    <div>Friendly Name</div>
                    <div className="text-right">Actions</div>
                  </div>
                  <div className="divide-y">
                    {unmanagedNumbers.map((phone, index) => (
                      <div key={index} className="grid grid-cols-3 items-center px-4 py-3">
                        <div className="font-mono text-sm">{phone.phoneNumber}</div>
                        <div className="text-sm">{phone.friendlyName}</div>
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addToDatabase(phone.phoneNumber)}
                            disabled={isImporting}
                          >
                            {isImporting ? (
                              <RefreshCw className="mr-1 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Plus className="mr-1 h-3.5 w-3.5" />
                            )}
                            Import
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* All Twilio Numbers */}
            <div>
              <h3 className="mb-2 text-sm font-medium">All Twilio Account Numbers</h3>
              <p className="mb-4 text-xs text-muted-foreground">
                Complete list of phone numbers in your Twilio account.
              </p>

              {twilioNumbers.length === 0 ? (
                <div className="rounded-md border py-8 text-center text-muted-foreground">
                  No phone numbers found in your Twilio account.
                </div>
              ) : (
                <div className="overflow-hidden rounded-md border">
                  <div className="grid grid-cols-4 bg-muted px-4 py-3 text-sm font-medium">
                    <div>Phone Number</div>
                    <div>Friendly Name</div>
                    <div>Capabilities</div>
                    <div>Status</div>
                  </div>
                  <div className="max-h-96 divide-y overflow-y-auto">
                    {twilioNumbers.map((phone, index) => {
                      const isInDatabase = dbNumbers.some(
                        dbPhone => dbPhone.phone_number === phone.phoneNumber
                      );

                      return (
                        <div key={index} className="grid grid-cols-4 items-center px-4 py-3">
                          <div className="font-mono text-sm">{phone.phoneNumber}</div>
                          <div className="text-sm">{phone.friendlyName}</div>
                          <div className="flex flex-wrap gap-1">
                            {phone.capabilities.sms && (
                              <Badge variant="secondary" className="text-xs">
                                SMS
                              </Badge>
                            )}
                            {phone.capabilities.voice && (
                              <Badge variant="secondary" className="text-xs">
                                Voice
                              </Badge>
                            )}
                            {phone.capabilities.mms && (
                              <Badge variant="secondary" className="text-xs">
                                MMS
                              </Badge>
                            )}
                          </div>
                          <div>
                            {isInDatabase ? (
                              <span className="inline-flex items-center gap-1 text-sm text-green-600">
                                <Check className="h-3.5 w-3.5" /> Managed
                              </span>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-amber-50 text-xs text-amber-700"
                              >
                                Not Imported
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-4">
        <p className="text-xs text-muted-foreground">
          {twilioNumbers.length} total number{twilioNumbers.length === 1 ? '' : 's'} in your Twilio
          account
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // Use noopener for security when opening external links
            const newWindow = window.open(
              'https://www.twilio.com/console/phone-numbers/incoming',
              '_blank'
            );
            if (newWindow) {
              newWindow.opener = null;
            }
          }}
        >
          <ExternalLink className="mr-1 h-3.5 w-3.5" />
          Manage in Twilio Console
        </Button>
      </CardFooter>
    </Card>
  );
}
