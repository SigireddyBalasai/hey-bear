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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
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
  LinkIcon,
  UserCircle,
  ShoppingCart,
  Search
} from "lucide-react";
import { toast } from "sonner";
import { Tables } from "@/lib/db.types";
import { 
  addPhoneNumber, 
  fetchAvailablePhoneNumbers, 
  fetchAssignedPhoneNumbers,
  assignPhoneNumber,
  unassignPhoneNumber,
  deletePhoneNumber,
  fetchAssistantsWithoutPhoneNumbers
} from "../utils/twilioUtils";

interface PhoneNumberManagementProps {
  initialTab?: string;
}

export function PhoneNumberManagement({ initialTab = "assigned" }: PhoneNumberManagementProps) {
  const [availableNumbers, setAvailableNumbers] = useState<any[]>([]);
  const [assignedNumbers, setAssignedNumbers] = useState<any[]>([]);
  const [assistants, setAssistants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [selectedAssistantId, setSelectedAssistantId] = useState('');
  const [selectedPhoneId, setSelectedPhoneId] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [areaCode, setAreaCode] = useState('');
  const [isPurchasing, setIsPurchasing] = useState(false);
  
  // Fetch all data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [available, assigned, unassignedAssistants] = await Promise.all([
        fetchAvailablePhoneNumbers(),
        fetchAssignedPhoneNumbers(),
        fetchAssistantsWithoutPhoneNumbers()
      ]);
      
      setAvailableNumbers(available);
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

  // Assign a phone number to an assistant
  const handleAssignPhoneNumber = async () => {
    if (!selectedPhoneId || !selectedAssistantId) {
      toast.error('Please select both a phone number and an assistant');
      return;
    }

    const success = await assignPhoneNumber(selectedPhoneId, selectedAssistantId);
    if (success) {
      setSelectedPhoneId('');
      setSelectedAssistantId('');
      loadData();
    }
  };

  // Unassign a phone number
  const handleUnassignPhoneNumber = async (phoneNumber: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to unassign this phone number: ${phoneNumber}?`
    );
    
    if (confirmed) {
      const success = await unassignPhoneNumber(phoneNumber);
      if (success) {
        loadData();
      }
    }
  };

  // Delete a phone number
  const handleDeletePhoneNumber = async (phoneNumberId: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this phone number? This action cannot be undone.'
    );
    
    if (confirmed) {
      const success = await deletePhoneNumber(phoneNumberId);
      if (success) {
        loadData();
      }
    }
  };

  // Search for available phone numbers
  const searchPhoneNumbers = async () => {
    if (!areaCode || areaCode.length < 3) {
      toast.error('Please enter a valid area code');
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await fetch('/api/twilio/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          areaCode: areaCode,
          country: 'US',
          smsEnabled: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to search for phone numbers');
      }

      const { numbers } = await response.json();
      setSearchResults(numbers || []);
    } catch (error) {
      console.error('Error searching for phone numbers:', error);
      toast.error('Failed to search for available numbers');
    } finally {
      setIsSearching(false);
    }
  };

  // Purchase a phone number
  const purchasePhoneNumber = async (phoneNumber: string) => {
    setIsPurchasing(true);
    try {
      const response = await fetch('/api/twilio/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to purchase number');
      }

      const data = await response.json();
      toast.success(`Phone number ${data.number?.number || phoneNumber} purchased successfully`);
      
      // Refresh phone number list
      loadData();
      
      // Clear search results after successful purchase
      setSearchResults([]);
      setAreaCode('');
    } catch (error) {
      console.error('Error purchasing phone number:', error);
      toast.error(`Failed to purchase number: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <Card className="w-full shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            <span>Phone Number Management</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>
          Manage Twilio phone numbers for your assistants
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={initialTab}>
          <TabsList className="mb-4 w-full grid grid-cols-4">
            <TabsTrigger value="assigned">Assigned Numbers</TabsTrigger>
            <TabsTrigger value="available">Unassigned Numbers</TabsTrigger>
            <TabsTrigger value="purchase">Purchase Numbers</TabsTrigger>
            <TabsTrigger value="add">Add Manually</TabsTrigger>
          </TabsList>
          
          {/* Assigned Numbers Tab */}
          <TabsContent value="assigned">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground mb-2">
                These phone numbers are currently assigned to assistants.
              </div>
              
              {isLoading ? (
                <div className="py-8 text-center">Loading assigned numbers...</div>
              ) : assignedNumbers.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No phone numbers are currently assigned to any assistants.
                </div>
              ) : (
                <div className="rounded-md border">
                  <div className="grid grid-cols-3 px-4 py-3 bg-muted font-medium">
                    <div>Phone Number</div>
                    <div>Assigned Assistant</div>
                    <div className="text-right">Actions</div>
                  </div>
                  <div className="divide-y">
                    {assignedNumbers.map((phone) => (
                      <div key={phone.id} className="grid grid-cols-3 px-4 py-3 items-center">
                        <div className="font-mono">{phone.number}</div>
                        <div>
                          <div className="font-medium">{phone.assistants?.name || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <UserCircle className="h-3 w-3" />
                            {phone.assistants?.owner_name || 'Unknown owner'}
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
          
          {/* Available Numbers Tab */}
          <TabsContent value="available">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground mb-2">
                These phone numbers are available for assignment to assistants.
              </div>
              
              <div className="flex justify-between mb-4">
                <span className="text-sm font-medium">
                  {availableNumbers.length} available phone number{availableNumbers.length !== 1 ? 's' : ''}
                </span>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1" disabled={availableNumbers.length === 0}>
                      <LinkIcon className="h-3.5 w-3.5" />
                      Assign Number
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Assign Phone Number</DialogTitle>
                      <DialogDescription>
                        Select a phone number and an assistant to connect them.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                      <div>
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <Select value={selectedPhoneId} onValueChange={setSelectedPhoneId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a phone number" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableNumbers.map(phone => (
                              <SelectItem key={phone.id} value={phone.id}>
                                {phone.number}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="assistant">Assistant</Label>
                        <Select value={selectedAssistantId} onValueChange={setSelectedAssistantId}>
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
                    </div>
                    
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button 
                        onClick={handleAssignPhoneNumber} 
                        disabled={!selectedPhoneId || !selectedAssistantId}
                      >
                        Assign Number
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              {isLoading ? (
                <div className="py-8 text-center">Loading available numbers...</div>
              ) : availableNumbers.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <p>No phone numbers are available.</p>
                  <div className="mt-4">
                    <Button variant="outline" onClick={() => (document.querySelector('[data-value="purchase"]') as HTMLElement)?.click()}>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Purchase New Numbers
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border">
                  <div className="grid grid-cols-2 px-4 py-3 bg-muted font-medium">
                    <div>Phone Number</div>
                    <div className="text-right">Actions</div>
                  </div>
                  <div className="divide-y">
                    {availableNumbers.map((phone) => (
                      <div key={phone.id} className="grid grid-cols-2 px-4 py-3 items-center">
                        <div className="font-mono">{phone.number}</div>
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePhoneNumber(phone.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-4 text-sm text-muted-foreground">
                <p>Need to assign numbers? Make sure you have assistants without assigned phone numbers available.</p>
              </div>
            </div>
          </TabsContent>
          
          {/* Purchase Numbers Tab */}
          <TabsContent value="purchase">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                Search and purchase phone numbers directly from Twilio.
              </div>
              
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="areaCode">Area Code</Label>
                  <div className="flex gap-2 mt-1.5">
                    <Input
                      id="areaCode"
                      placeholder="e.g. 415"
                      value={areaCode}
                      onChange={(e) => setAreaCode(e.target.value)}
                      className="font-mono"
                      disabled={isSearching}
                    />
                    <Button onClick={searchPhoneNumbers} disabled={isSearching || !areaCode}>
                      {isSearching ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4 mr-2" />
                      )}
                      {isSearching ? "Searching..." : "Search"}
                    </Button>
                  </div>
                </div>
                
                {searchResults.length > 0 && (
                  <div className="rounded-md border mt-4">
                    <div className="grid grid-cols-3 px-4 py-3 bg-muted font-medium">
                      <div>Phone Number</div>
                      <div>Location</div>
                      <div className="text-right">Actions</div>
                    </div>
                    <div className="divide-y">
                      {searchResults.map((phone, index) => (
                        <div key={index} className="grid grid-cols-3 px-4 py-3 items-center">
                          <div className="font-mono">{phone.phoneNumber}</div>
                          <div>{phone.locality || phone.region || 'Unknown'}, {phone.isoCountry}</div>
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm"
                              onClick={() => purchasePhoneNumber(phone.phoneNumber)}
                              disabled={isPurchasing}
                            >
                              {isPurchasing ? (
                                <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />
                              ) : (
                                <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                              )}
                              {isPurchasing ? "Purchasing..." : "Purchase"}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {searchResults.length === 0 && !isSearching && areaCode && (
                  <div className="text-center py-8 text-muted-foreground border rounded-md">
                    No phone numbers found for area code {areaCode}. Try a different area code.
                  </div>
                )}
                
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-md text-sm text-blue-800">
                  <p className="font-medium">Important Note</p>
                  <p className="mt-1">
                    Purchasing numbers will immediately charge your Twilio account. Make sure you have proper billing setup in your Twilio account.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Add New Number Tab (Manual Entry) */}
          <TabsContent value="add">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                Add a new Twilio phone number to your pool of available numbers.
              </div>
              
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="newPhoneNumber">Phone Number (E.164 format)</Label>
                  <div className="flex gap-2 mt-1.5">
                    <Input
                      id="newPhoneNumber"
                      placeholder="+12345678901"
                      value={newPhoneNumber}
                      onChange={(e) => setNewPhoneNumber(e.target.value)}
                      className="font-mono"
                    />
                    <Button onClick={handleAddPhoneNumber} disabled={!newPhoneNumber}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Number
                    </Button>
                  </div>
                </div>
                
                <div className="bg-muted p-4 rounded-md mt-4">
                  <h4 className="font-medium mb-2">Format Requirements</h4>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>Must be in E.164 format (e.g., +12345678901)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>Include country code with + prefix</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <X className="h-4 w-4 text-red-600" />
                      <span>No spaces, hyphens, or special characters</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-md text-sm text-blue-800">
                  <p className="font-medium">Important Note</p>
                  <p className="mt-1">
                    These phone numbers should be provisioned and configured in your Twilio account before adding them here.
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
