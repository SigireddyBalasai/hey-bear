"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, 
  RefreshCw, 
  Plus,
  AlertTriangle,
  Check,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { fetchAllPhoneNumbers, importPhoneNumber } from '@/app/admin/utils/twilioUtils';

interface TwilioNumber {
  phoneNumber: string;
  friendlyName: string;
  capabilities: {
    sms?: boolean;
    voice?: boolean;
    mms?: boolean;
  };
}

interface DatabaseNumber {
  number: string;
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
      setTwilioNumbers(data.twilioNumbers);
      setDbNumbers(data.dbNumbers);
      setUnmanagedNumbers(data.unmanagedNumbers);
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
      fetchPhoneNumbers(); // Refresh data
    } catch (error) {
      console.error('Error adding phone number:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add number');
    } finally {
      setIsImporting(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchPhoneNumbers();
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
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>
          All phone numbers from your Twilio account
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {error ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium">Connection Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        ) : isLoading ? (
          <div className="py-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">Loading phone numbers...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Unmanaged Numbers Section */}
            {unmanagedNumbers.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Unmanaged Twilio Numbers
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  These phone numbers exist in your Twilio account but are not yet added to the database.
                </p>
                
                <div className="rounded-md border">
                  <div className="grid grid-cols-3 px-4 py-3 bg-muted font-medium text-sm">
                    <div>Phone Number</div>
                    <div>Friendly Name</div>
                    <div className="text-right">Actions</div>
                  </div>
                  <div className="divide-y">
                    {unmanagedNumbers.map((phone, index) => (
                      <div key={index} className="grid grid-cols-3 px-4 py-3 items-center">
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
                              <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />
                            ) : (
                              <Plus className="h-3.5 w-3.5 mr-1" />
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
              <h3 className="text-sm font-medium mb-2">All Twilio Account Numbers</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Complete list of phone numbers in your Twilio account.
              </p>
              
              {twilioNumbers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border rounded-md">
                  No phone numbers found in your Twilio account.
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <div className="grid grid-cols-4 px-4 py-3 bg-muted font-medium text-sm">
                    <div>Phone Number</div>
                    <div>Friendly Name</div>
                    <div>Capabilities</div>
                    <div>Status</div>
                  </div>
                  <div className="divide-y max-h-96 overflow-y-auto">
                    {twilioNumbers.map((phone, index) => {
                      const isInDatabase = dbNumbers.some(dbPhone => dbPhone.number === phone.phoneNumber);
                      
                      return (
                        <div key={index} className="grid grid-cols-4 px-4 py-3 items-center">
                          <div className="font-mono text-sm">{phone.phoneNumber}</div>
                          <div className="text-sm">{phone.friendlyName}</div>
                          <div className="flex flex-wrap gap-1">
                            {phone.capabilities?.sms && (
                              <Badge variant="secondary" className="text-xs">SMS</Badge>
                            )}
                            {phone.capabilities?.voice && (
                              <Badge variant="secondary" className="text-xs">Voice</Badge>
                            )}
                            {phone.capabilities?.mms && (
                              <Badge variant="secondary" className="text-xs">MMS</Badge>
                            )}
                          </div>
                          <div>
                            {isInDatabase ? (
                              <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                                <Check className="h-3.5 w-3.5" /> Managed
                              </span>
                            ) : (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 text-xs">
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
      
      <CardFooter className="border-t pt-4 flex justify-between">
        <p className="text-xs text-muted-foreground">
          {twilioNumbers.length} total number{twilioNumbers.length !== 1 ? 's' : ''} in your Twilio account
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open('https://www.twilio.com/console/phone-numbers/incoming', '_blank')}
        >
          <ExternalLink className="h-3.5 w-3.5 mr-1" />
          Manage in Twilio Console
        </Button>
      </CardFooter>
    </Card>
  );
}
