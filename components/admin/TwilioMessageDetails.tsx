'use client';

import { format } from 'date-fns';
import {
  Bot,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  MessageSquare,
  Phone,
  User,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface MessageData {
  id: string;
  interaction_time: string;
  request?: string;
  response?: string;
  chat: string;
  token_usage?: number;
  cost_estimate?: number;
}

export interface AssistantData {
  id: string;
  name: string;
  user_id: string;
  params?: Record<string, unknown>;
}

interface ChatData {
  from: string;
  to: string;
  body: string;
}

interface TwilioMessageDetailsProps {
  phoneNumber: string;
  open: boolean;
  onClose: () => void;
  messages: MessageData[];
  assistant: AssistantData | null;
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

export function TwilioMessageDetails({
  phoneNumber,
  open,
  onClose,
  messages,
  assistant,
  isLoading,
  currentPage,
  totalPages,
  onPreviousPage,
  onNextPage,
}: TwilioMessageDetailsProps) {
  // Format phone number for display
  const formatPhoneNumber = (number: string) => {
    if (number.startsWith('+1') && number.length === 12) {
      return `(${number.slice(2, 5)}) ${number.slice(5, 8)}-${number.slice(8)}`;
    }
    return number;
  };

  // Parse chat data from JSON string
  const parseChatData = (chatStr: string): ChatData => {
    try {
      return JSON.parse(chatStr) as ChatData;
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            {formatPhoneNumber(phoneNumber)} Message History
          </DialogTitle>
          <DialogDescription>
            {assistant ? (
              <div className="flex items-center gap-1">
                <span>Connected to Assistant:</span>
                <Badge variant="secondary" className="ml-1">
                  <Bot className="mr-1 h-3 w-3" />
                  {assistant.name}
                </Badge>
              </div>
            ) : (
              <span>No assistant connected to this phone number</span>
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <p className="text-muted-foreground">Loading message history...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="py-8 text-center">
            <MessageSquare className="mx-auto mb-4 h-10 w-10 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No messages found for this phone number.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map(message => {
              const chatData = parseChatData(message.chat);
              const isIncoming = chatData.to === phoneNumber;

              return (
                <div
                  key={message.id}
                  className={`rounded-lg border p-4 ${isIncoming ? 'border-blue-100 bg-blue-50' : 'border-green-100 bg-green-50'}`}
                >
                  <div className="mb-3 flex items-start justify-between">
                    <Badge variant={isIncoming ? 'secondary' : 'default'} className="mb-2">
                      {isIncoming ? 'Incoming' : 'Outgoing'}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
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
                      <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>To: {formatPhoneNumber(chatData.to)}</span>
                      </div>

                      <div className="rounded border border-gray-200 bg-white p-3">
                        <div className="mb-1 text-xs text-muted-foreground">User Message:</div>
                        <div className="text-sm">{message.request}</div>
                      </div>

                      <div className="rounded border border-gray-200 bg-white p-3">
                        <div className="mb-1 text-xs text-muted-foreground">AI Response:</div>
                        <div className="text-sm">{message.response}</div>
                      </div>
                    </div>

                    {message.token_usage && message.token_usage > 0 && (
                      <div className="mt-1 flex items-center justify-end gap-2 text-xs text-muted-foreground">
                        <Coins className="h-3 w-3" />
                        <span>{message.token_usage.toLocaleString()} tokens</span>
                        {message.cost_estimate && message.cost_estimate > 0 && (
                          <span className="border-l border-muted-foreground/20 pl-2">
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
              <div className="flex items-center justify-between border-t pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>

                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
