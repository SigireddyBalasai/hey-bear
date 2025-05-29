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
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// Define a clean interface for the assistant data
export interface AssistantCardData {
  id: string;
  name: string;
  is_starred: boolean;
  created_at?: string;
  description?: string;
  has_phone_number?: boolean;
  subscription_plan?: 'personal' | 'business';
  total_messages?: number;
  last_used_at?: string;
}

interface AssistantCardProps {
  assistant: AssistantCardData;
  isLoading?: boolean;
  isActionInProgress?: boolean;
  onToggleStar?: (id: string, isStarred: boolean) => void;
  onDelete?: (id: string) => void;
  onUpgrade?: (id: string) => void;
}

export function AssistantCard({
  assistant,
  isLoading = false,
  isActionInProgress = false,
  onToggleStar,
  onDelete,
  onUpgrade,
}: AssistantCardProps) {
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

  // Handle upgrade action
  const handleUpgrade = (id: string) => {
    if (onUpgrade) {
      onUpgrade(id);
      return;
    }

    setIsActionInProgressState(true);
    // Mock functionality without data fetching
    setTimeout(() => {
      toast('Starting upgrade process', {
        description: `Upgrading ${assistant.name}`,
      });
      globalThis.location.href = `/upgrade?assistant_id=${id}`;
    }, 500);
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="flex h-full flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
          <Skeleton className="mt-2 h-4 w-full" />
        </CardHeader>
        <CardContent className="flex-1">
          <div className="mb-3 flex flex-wrap gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="mb-2 h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-9 w-full" />
        </CardFooter>
      </Card>
    );
  }

  const createdAt = assistant.created_at
    ? format(new Date(assistant.created_at), 'MMM d, yyyy')
    : 'Unknown date';

  const lastUsedDate = assistant.last_used_at
    ? format(new Date(assistant.last_used_at), 'MMM d, yyyy')
    : null;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{assistant.name}</CardTitle>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 p-0"
                  onClick={() => { handleToggleStar(assistant.id, !assistant.is_starred); }}
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
              <TooltipContent>{assistant.is_starred ? 'Unstar' : 'Star'} Concierge</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription className="mt-1 line-clamp-2">
          {assistant.description ?? 'No description provided'}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="mb-3 flex flex-wrap gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Bot className="h-3 w-3" />
            Concierge
          </Badge>

          {assistant.has_phone_number && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              SMS
            </Badge>
          )}

          {assistant.subscription_plan && (
            <Badge
              variant={assistant.subscription_plan === 'business' ? 'default' : 'outline'}
              className="flex items-center gap-1"
            >
              <CreditCard className="h-3 w-3" />
              {assistant.subscription_plan === 'business' ? 'Business' : 'Personal'}
            </Badge>
          )}
        </div>

        {assistant.total_messages && assistant.total_messages > 0 && (
          <div className="flex items-center text-sm text-muted-foreground">
            <MessageSquare className="mr-1 h-4 w-4" />
            <span>{assistant.total_messages} messages</span>
          </div>
        )}

        <div className="mt-3">
          <div className="text-xs text-muted-foreground">Created {createdAt}</div>
          {lastUsedDate && (
            <div className="text-xs text-muted-foreground">Last used {lastUsedDate}</div>
          )}
        </div>

        {assistant.subscription_plan === 'personal' && (
          <div className="mt-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => { handleUpgrade(assistant.id); }}
              disabled={isActionInProgressState}
            >
              {isActionInProgressState ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
              Upgrade to Business
            </Button>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
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

        <Link href={`/Concierge/${assistant.id}`} className="ml-2 w-full">
          <Button variant="default" className="flex w-full items-center justify-center gap-1">
            Open Concierge
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
