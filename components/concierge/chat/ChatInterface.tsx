'use client';

import React from 'react';

import { motion } from 'framer-motion';
import { Bot, Loader2, Paperclip, SendIcon, User } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

interface ChatInterfaceProps {
  displayName: string;
  chatHistory: ChatMessage[];
  message: string;
  setMessage: (message: string) => void;
  isChatDisabled: boolean;
  isSending: boolean;
  fileCount: number;
  user: { user_metadata?: { avatar_url?: string } } | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  onSubmit: (e?: React.FormEvent) => void;
  onSwitchToFiles: () => void;
}

const getInputPlaceholder = (fileCount: number, isChatDisabled: boolean) => {
  if (fileCount === 0) {
    return 'Add files to enable chat functionality...';
  }
  if (isChatDisabled) {
    return 'Chat disabled - waiting for files to process...';
  }
  return 'Type your message... (Press / to focus)';
};

export function ChatInterface({
  displayName,
  chatHistory,
  message,
  setMessage,
  isChatDisabled,
  isSending,
  fileCount,
  user,
  inputRef,
  chatEndRef,
  onSubmit,
  onSwitchToFiles,
}: ChatInterfaceProps) {
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSubmit(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Card className="flex-1 flex flex-col overflow-hidden border-muted shadow-lg">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8 ring-2 ring-primary/10">
            <AvatarImage src="/bot-avatar.png" alt="Concierge" />
            <AvatarFallback>
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">{displayName}</CardTitle>
            <CardDescription className="text-xs">Your AI assistant</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        {chatHistory.length === 0 ||
        (chatHistory.length === 1 && chatHistory[0].role === 'system') ? (
          <div className="flex items-center justify-center h-full p-6">
            <div className="text-center max-w-lg">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">
                {fileCount === 0 ? 'Add Files or links to Start' : 'Start a conversation'}
              </h3>
              <p className="text-muted-foreground max-w-md mt-2">
                {fileCount === 0
                  ? 'This No-Show needs information to work. Please add at least one file or link.'
                  : "Ask me anything about the documents you've provided. I'm here to help!"}
              </p>
              {fileCount === 0 && (
                <Button variant="default" className="mt-6" onClick={onSwitchToFiles}>
                  <Paperclip className="h-4 w-4 mr-2" />
                  Add
                </Button>
              )}
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {chatHistory
                .filter(msg => msg.role !== 'system')
                .map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      'flex gap-3',
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[80%] rounded-lg px-4 py-3 shadow-sm',
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground ml-auto'
                          : 'bg-muted'
                      )}
                    >
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-xs">
                              <Bot className="h-3 w-3" />
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground font-medium">
                            {displayName}
                          </span>
                        </div>
                      )}
                      {msg.role === 'user' && (
                        <div className="flex items-center gap-2 mb-2 justify-end">
                          <span className="text-xs text-primary-foreground/70 font-medium">
                            You
                          </span>
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={user?.user_metadata?.avatar_url} />
                            <AvatarFallback className="text-xs bg-primary-foreground/20">
                              <User className="h-3 w-3" />
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      )}
                      <div className="text-sm whitespace-pre-wrap break-words">{msg.content}</div>
                    </div>
                  </motion.div>
                ))}
              <div ref={chatEndRef} />
            </div>
          </ScrollArea>
        )}
      </CardContent>

      <CardFooter className="p-3 border-t bg-card/50">
        <form onSubmit={handleSubmit} className="w-full flex items-end gap-2">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              placeholder={getInputPlaceholder(fileCount, isChatDisabled)}
              value={message}
              onChange={e => setMessage(e.target.value)}
              disabled={isChatDisabled || isSending}
              className={cn(
                'pr-10 py-5 shadow-sm focus-visible:ring-primary',
                isChatDisabled ? 'bg-muted text-muted-foreground' : 'bg-background'
              )}
              onKeyDown={handleKeyDown}
            />
            <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-50">
              {isChatDisabled ? 'Disabled' : '/'}
            </kbd>
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={isChatDisabled || !message.trim() || isSending}
            className={cn('rounded-full shadow-sm p-3 h-auto', isSending && 'animate-pulse')}
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <SendIcon className="h-5 w-5" />
            )}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
