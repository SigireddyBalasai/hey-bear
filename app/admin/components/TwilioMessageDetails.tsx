"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Phone, 
  Clock, 
  User, 
  Bot, 
  Calendar,
  ChevronRight,
  ChevronLeft,
  Coins
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface TwilioMessageDetailsProps {
  phoneNumber: string;
  open: boolean;
  onClose: () => void;
}

export function TwilioMessageDetails({ phoneNumber, open, onClose }: TwilioMessageDetailsProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [assistant, setAssistant] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const supabase = createClient();
  const messagesPerPage = 10;

  // Fetch messages whenever phone number or page changes
  useEffect(() => {
    if (open && phoneNumber) {
      fetchMessages();
    }
  }, [open, phoneNumber, currentPage]);

  const fetchMessages = async () => {
    setIsLoading(true);
    
    try {
      const { data: assistantData, error: assistantError } = await supabase
        .from('assistants')
        .select('id, name, user_id, params')
        .eq('assigned_phone_number', phoneNumber)
        .single();
        
      if (assistantError) {
        console.error('Error fetching assistant:', assistantError);
      } else {
        setAssistant(assistantData);
      }
      
      // Calculate pagination
      const from = (currentPage - 1) * messagesPerPage;
      const to = from + messagesPerPage - 1;
      
      // Get message count for pagination
      const { count, error: countError } = await supabase
        .from('interactions')
        .select('id', { count: 'exact', head: true })
        .contains('chat', phoneNumber);
        
      if (!countError && count !== null) {
        setTotalPages(Math.ceil(count / messagesPerPage));
      }
      
      // Fetch messages for the current page
      const { data, error } = await supabase
        .from('interactions')
        .select('*, users(auth_user_id)')
        .contains('chat', phoneNumber)
        .order('interaction_time', { ascending: false })
        .range(from, to);
        
      if (error) {
        throw error;
      }
      
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load message history');
    } finally {
      setIsLoading(false);
    }
  };

  // Format phone number for display
  const formatPhoneNumber = (number: string) => {
    if (number.startsWith('+1') && number.length === 12) {
      return `(${number.substring(2, 5)}) ${number.substring(5, 8)}-${number.substring(8)}`;
    }
    return number;
  };

  // Parse chat data from JSON string
  const parseChatData = (chatStr: string) => {
    try {
      return JSON.parse(chatStr);
    } catch {
      return { from: 'unknown', to: 'unknown', body: '' };
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch {
      return dateString;
    }
  };
  
  // Navigate to the previous page
  const previousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  // Navigate to the next page
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            {formatPhoneNumber(phoneNumber)} Message History
          </DialogTitle>
          <DialogDescription>
            {assistant ? (
              <div className="flex items-center gap-1">
                <span>Connected to No-Show:</span>
                <Badge variant="secondary" className="ml-1">
                  <Bot className="h-3 w-3 mr-1" />
                  {assistant.name}
                </Badge>
              </div>
            ) : (
              <span>No No-show connected to this phone number</span>
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading message history...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-10 w-10 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No messages found for this phone number.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const chatData = parseChatData(message.chat);
              const isIncoming = chatData.to === phoneNumber;
              
              return (
                <div 
                  key={message.id} 
                  className={`border rounded-lg p-4 ${isIncoming ? 'border-blue-100 bg-blue-50' : 'border-green-100 bg-green-50'}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <Badge variant={isIncoming ? "secondary" : "default"} className="mb-2">
                      {isIncoming ? 'Incoming' : 'Outgoing'}
                    </Badge>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(message.interaction_time)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>From: {formatPhoneNumber(chatData.from)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                        <Phone className="h-3 w-3" />
                        <span>To: {formatPhoneNumber(chatData.to)}</span>
                      </div>
                      
                      <div className="bg-white border border-gray-200 rounded p-3">
                        <div className="text-xs text-muted-foreground mb-1">User Message:</div>
                        <div className="text-sm">{message.request}</div>
                      </div>
                      
                      <div className="bg-white border border-gray-200 rounded p-3">
                        <div className="text-xs text-muted-foreground mb-1">AI Response:</div>
                        <div className="text-sm">{message.response}</div>
                      </div>
                    </div>
                    
                    {message.token_usage > 0 && (
                      <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground mt-1">
                        <Coins className="h-3 w-3" />
                        <span>{message.token_usage.toLocaleString()} tokens</span>
                        {message.cost_estimate > 0 && (
                          <span className="border-l pl-2 border-muted-foreground/20">
                            ${message.cost_estimate.toFixed(5)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={previousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        )}
        
        <DialogFooter className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
