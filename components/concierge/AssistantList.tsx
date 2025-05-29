'use client';

import { useState } from 'react';

import Link from 'next/link';

import { format } from 'date-fns';
import {
  ArrowRight,
  Bot,
  CreditCard,
  Loader2,
  MessageSquare,
  Phone,
  Star,
  Trash,
} from 'lucide-react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface AssistantData {
  id: string;
  name: string;
  is_starred: boolean;
  created_at?: string;
  description?: string;
  has_phone_number?: boolean;
  subscription_plan?: string;
  total_messages?: number;
  last_used_at?: string;
}

interface AssistantListProps {
  assistant: AssistantData;
  isLoading?: boolean;
  isActionInProgress?: boolean;
  onToggleStar?: (id: string, isStarred: boolean) => void;
  onDelete?: (id: string) => void;
}

export function AssistantList({
  assistant,
  isLoading = false,
  isActionInProgress = false,
  onToggleStar,
  onDelete,
}: AssistantListProps) {
  const [isActionInProgressState, setIsActionInProgressState] = useState(isActionInProgress);

  // Handle toggle star action
  const handleToggleStar = (id: string, isStarred: boolean) => {
    if (onToggleStar) {
      onToggleStar(id, isStarred);
      return;
    }

    setIsActionInProgressState(true);
    // Mock functionality without data fetching
    setTimeout(() => {
      toast(`Assistant ${isStarred ? 'starred' : 'unstarred'}`, {
        description: `${assistant.name} has been ${isStarred ? 'starred' : 'unstarred'}`,
      });
      setIsActionInProgressState(false);
    }, 500);
  };

  // Handle delete action
  const handleDelete = (id: string) => {
    if (onDelete) {
      onDelete(id);
      return;
    }

    setIsActionInProgressState(true);
    // Mock functionality without data fetching
    setTimeout(() => {
      toast('Assistant deleted', {
        description: `${assistant.name} has been removed`,
      });
      setIsActionInProgressState(false);
    }, 500);
  };

  // Get initials from name (e.g. "John Doe" -> "JD")
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get a consistent color based on the name
  const getAvatarColor = (name: string): string => {
    const colors = [
      'bg-red-100 text-red-800',
      'bg-green-100 text-green-800',
      'bg-blue-100 text-blue-800',
      'bg-yellow-100 text-yellow-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-gray-100 text-gray-800',
    ];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  if (isLoading) {
    return (
      <Card className="w-full p-4">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 animate-pulse rounded-full bg-muted"></div>
          <div className="flex-1 space-y-2">
            <div className="h-5 w-1/4 animate-pulse rounded bg-muted"></div>
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-8 animate-pulse rounded bg-muted"></div>
            <div className="h-8 w-8 animate-pulse rounded bg-muted"></div>
          </div>
        </div>
      </Card>
    );
  }

  // Format the creation date
  const createdAt = assistant.created_at
    ? format(new Date(assistant.created_at), 'MMM d, yyyy')
    : 'Unknown date';

  return (
    <Card className="w-full p-4">
      <div className="flex items-center gap-4">
        <Avatar className={cn('h-10 w-10', getAvatarColor(assistant.name))}>
          <AvatarFallback>{getInitials(assistant.name)}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-medium">{assistant.name}</h3>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 p-0"
                    onClick={e => {
                      e.preventDefault();
                      handleToggleStar(assistant.id, !assistant.is_starred);
                    }}
                    disabled={isActionInProgressState}
                  >
                    {isActionInProgressState ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Star
                        className={cn(
                          'h-4 w-4',
                          assistant.is_starred
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground'
                        )}
                      />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {assistant.is_starred ? 'Unstar' : 'Star'} Concierge
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex items-center">
            <CardDescription className="mr-2 line-clamp-1 text-sm">
              {assistant.description ?? 'No description provided'}
            </CardDescription>

            {/* Show message count if available */}
            {assistant.total_messages && assistant.total_messages > 0 && (
              <Badge variant="outline" className="gap-1 text-xs">
                <MessageSquare className="h-3 w-3" />
                {assistant.total_messages}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          <Badge variant="outline" className="hidden items-center md:flex">
            <Bot className="mr-1 h-3 w-3" /> Concierge
          </Badge>

          {assistant.has_phone_number && (
            <Badge variant="outline" className="hidden items-center gap-1 md:flex">
              <Phone className="h-3 w-3" />
              SMS
            </Badge>
          )}

          {assistant.subscription_plan && (
            <Badge
              variant="outline"
              className={cn(
                'hidden items-center gap-1 md:flex',
                assistant.subscription_plan === 'business'
                  ? 'text-amber-600 dark:text-amber-400'
                  : ''
              )}
            >
              <CreditCard className="h-3 w-3" />
              {assistant.subscription_plan === 'business' ? 'Business' : 'Personal'}
            </Badge>
          )}

          <p className="hidden text-xs text-muted-foreground lg:block">Created {createdAt}</p>

          {assistant.last_used_at && (
            <p className="hidden text-xs text-muted-foreground lg:block">
              Last used {format(new Date(assistant.last_used_at), 'MMM d, yyyy')}
            </p>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-600"
                  onClick={() => { handleDelete(assistant.id); }}
                  disabled={isActionInProgressState}
                >
                  {isActionInProgressState ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete Concierge</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={`/Concierge/${assistant.id}`}>
                  <Button variant="default" size="icon" className="flex items-center">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>Open Concierge</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </Card>
  );
}
