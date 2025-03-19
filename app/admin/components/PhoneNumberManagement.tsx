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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Phone, 
  Plus, 
  Unplug, 
  Trash2, 
  RefreshCw, 
  Check, 
  X, 
  UserCircle,
  ShoppingCart,
  Globe
} from "lucide-react";
import { toast } from "sonner";
import { Tables } from "@/lib/db.types";
import { 
  addPhoneNumber, 
  fetchAvailablePhoneNumbers, 
  fetchAssignedPhoneNumbers,
  unassignPhoneNumber,
  fetchAssistantsWithoutPhoneNumbers
} from "../utils/twilioUtils";

interface PhoneNumberManagementProps {
  initialTab?: string;
}

export function PhoneNumberManagement({ initialTab = "assigned" }: PhoneNumberManagementProps) {
  const [assignedNumbers, setAssignedNumbers] = useState<any[]>([]);
  const [assistants, setAssistants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [areaCode, setAreaCode] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [selectedAssistantForCountry, setSelectedAssistantForCountry] = useState('');
  
  // Fetch all data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [assigned, unassignedAssistants] = await Promise.all([
        fetchAssignedPhoneNumbers(),
        fetchAssistantsWithoutPhoneNumbers()
      ]);
      
      setAssignedNumbers(assigned);
      setAssistants(unassignedAssistants);
    } catch (error) {
      console.error('Error loading phone number data:', error);
      toast.error('Failed to load phone number data');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Add a new phone number
  const handleAddPhoneNumber = async () => {
    if (!newPhoneNumber) {
      toast.error('Please enter a phone number');
      return;
    }

    const success = await addPhoneNumber(newPhoneNumber);
    if (success) {
      setNewPhoneNumber('');
      loadData();
    }
  };

  // Unassign a phone number
  const handleUnassignPhoneNumber = async (phoneNumber: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to unassign this phone number?`
    );
    
    if (confirmed) {
      const success = await unassignPhoneNumber(phoneNumber);
      if (success) {
        loadData();
      }
    }
  };

  // Assign a phone number based on country
  const handleAssignFromCountry = async () => {
    if (!selectedCountry || !selectedAssistantForCountry) {
      toast.error('Please select both a country and an assistant');
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
        assistantId: selectedAssistantForCountry,
        countryCode: selectedCountry,
        webhookUrl: `${window.location.origin}/api/twilio/webhook?assistantId=${selectedAssistantForCountry}`
      };

      // Only add areaCode to the request if it's not empty
      if (areaCode && areaCode.trim() !== '') {
        requestBody.areaCode = areaCode.trim();
      }

      // Send request to assign a phone number for the selected country
      const response = await fetch('/api/phone-numbers/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign phone number');
      }

      const data = await response.json();
      toast.success(`Phone number assigned successfully to assistant`);
      
      // Reset selection
      setSelectedAssistantForCountry('');
      setAreaCode('');
      
      // Refresh phone number list
      loadData();
    } catch (error) {
      console.error('Error assigning phone number from country:', error);
      toast.error(`Failed to assign number: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Card className="w-full shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            <span>Phone Number Management</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>
          Manage phone numbers for your assistants
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={initialTab}>
          <TabsList className="mb-4 w-full grid grid-cols-2">
            <TabsTrigger value="assigned">Assigned Numbers</TabsTrigger>
            <TabsTrigger value="assign">Assign Number</TabsTrigger>
          </TabsList>
          
          {/* Assigned Numbers Tab */}
          <TabsContent value="assigned">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground mb-2">
                These assistants have assigned phone numbers.
              </div>
              
              {isLoading ? (
                <div className="py-8 text-center">Loading assigned numbers...</div>
              ) : assignedNumbers.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No phone numbers are currently assigned to any assistant.
                </div>
              ) : (
                <div className="rounded-md border">
                  <div className="grid grid-cols-3 px-4 py-3 bg-muted font-medium">
                    <div>Assistant</div>
                    <div>Phone Info</div>
                    <div className="text-right">Actions</div>
                  </div>
                  <div className="divide-y">
                    {assignedNumbers.map((phone) => (
                      <div key={phone.id} className="grid grid-cols-3 px-4 py-3 items-center">
                        <div>
                          <div className="font-medium">{phone.assistants?.name || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <UserCircle className="h-3 w-3" />
                            {phone.assistants?.owner_name || 'Unknown owner'}
                          </div>
                        </div>
                        <div>
                          <div className="font-mono">{formatPhoneNumber(phone.number)}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              {formatCountryFromNumber(phone.number)}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnassignPhoneNumber(phone.number)}
                          >
                            <Unplug className="h-3.5 w-3.5 mr-1" />
                            Unassign
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Assign Number Tab */}
          <TabsContent value="assign">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                Assign a phone number from a selected country to your assistant.
              </div>
              
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="assistant">Assistant</Label>
                  <Select value={selectedAssistantForCountry} onValueChange={setSelectedAssistantForCountry}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an assistant" />
                    </SelectTrigger>
                    <SelectContent>
                      {assistants.map(assistant => (
                        <SelectItem key={assistant.id} value={assistant.id}>
                          {assistant.name} ({assistant.owner_name || 'Unknown'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="country">Country</Label>
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger className="w-full">
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

                <div>
                  <Label htmlFor="areaCode">Area Code (Optional)</Label>
                  <Input
                    id="areaCode"
                    placeholder="e.g. 415"
                    value={areaCode}
                    onChange={(e) => setAreaCode(e.target.value)}
                    className="font-mono"
                  />
                </div>
                
                <Button 
                  onClick={handleAssignFromCountry} 
                  disabled={isAssigning || !selectedCountry || !selectedAssistantForCountry}
                >
                  {isAssigning ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ShoppingCart className="h-4 w-4 mr-2" />
                  )}
                  {isAssigning ? "Assigning Number..." : "Assign Number from Country"}
                </Button>
                
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-md text-sm text-blue-800">
                  <p className="font-medium">Important Note</p>
                  <p className="mt-1">
                    A phone number will be automatically selected from the chosen country and assigned to your assistant.
                    If no number is available in our pool, one will be purchased from Twilio.
                  </p>
                  <p className="mt-1">
                    Purchasing numbers will immediately charge your Twilio account. Make sure you have proper billing setup in your Twilio account.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Helper function to format country code from phone number
function formatCountryFromNumber(phoneNumber: string): string {
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
}

// Add this helper function if it doesn't exist yet
function formatPhoneNumber(phoneNumber: string): string {
  if (phoneNumber.startsWith('+1') && phoneNumber.length === 12) {
    return `(${phoneNumber.substring(2, 5)}) ${phoneNumber.substring(5, 8)}-${phoneNumber.substring(8)}`;
  }
  return phoneNumber;
}
