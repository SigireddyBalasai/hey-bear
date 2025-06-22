'use client';


import { format } from 'date-fns';
import {
  ArrowRight,
  BarChart3,
  Bot,
  CreditCard,
  Loader2,
  MessageSquare,
  Phone,
  Star,
  Trash,
} from 'lucide-react';
import Link from 'next/link';

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
import { useLoadingState } from '@/hooks/useLoadingState';
import { cn } from '@/lib/utils';
import type { AssistantCardProps } from '@/types/assistant.types';
import { getDashboardUrl } from '@/utils/dashboard-urls';
import { showSuccess, withErrorHandling } from '@/utils/error-handling';
import { createClient } from '@/utils/supabase/client';

export function AssistantCard({
  assistant,
  isLoading = false,
  isActionInProgress = false,
  onToggleStar,
  onDelete,
  onUpgrade,
}: AssistantCardProps) {
  const { isLoading: isActionInProgressState, setIsLoading: setIsActionInProgressState } =
    useLoadingState(isActionInProgress);

  // Handle toggle star action
  const handleToggleStar = async (id: string, isStarred: boolean) => {
    if (onToggleStar) {
      onToggleStar(id, isStarred);

      return;
    }

    setIsActionInProgressState(true);

    await withErrorHandling(
      async () => {
        const supabase = createClient();
        const { error } = await supabase
          .from('assistants')
          .update({ is_starred: isStarred })
          .eq('id', id);

        if (error) {
          throw error;
        }

        showSuccess(
          `Assistant ${isStarred ? 'starred' : 'unstarred'}`,
          `${assistant.name} has been ${isStarred ? 'starred' : 'unstarred'}`
        );
      },
      {
        toastTitle: 'Failed to update star status',
      }
    );

    setIsActionInProgressState(false);
  };

  // Handle delete action
  const handleDelete = async (id: string) => {
    if (onDelete) {
      onDelete(id);

      return;
    }

    const confirmed = globalThis.confirm('Are you sure you want to delete this assistant?');

    if (!confirmed) return;

    setIsActionInProgressState(true);

    await withErrorHandling(
      async () => {
        // Call the proper delete API endpoint instead of direct Supabase deletion
        const response = await fetch('/api/Concierge/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            assistantName: assistant.name,
          }),
        });

        if (!response.ok) {
          const errorData = (await response.json().catch(() => ({}))) as { error?: string };

          throw new Error((errorData.error) ?? 'Failed to delete assistant');
        }

        showSuccess('Assistant deleted', `${assistant.name} has been removed`);
      },
      {
        toastTitle: 'Failed to delete assistant',
      }
    );

    setIsActionInProgressState(false);
  };

  // Handle upgrade action
  const handleUpgrade = async (id: string) => {
    if (onUpgrade) {
      onUpgrade(id);

      return;
    }

    setIsActionInProgressState(true);

    await withErrorHandling(
      async () => {
        showSuccess('Starting upgrade process', `Upgrading ${assistant.name}`);
        // Navigate to upgrade page
        globalThis.location.href = `/upgrade?assistant_id=${id}`;
      },
      {
        toastTitle: 'Failed to start upgrade process',
      }
    );

    setIsActionInProgressState(false);
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
    : 'Recently created';

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
                  onClick={() => {
                    void handleToggleStar(assistant.id, !assistant.is_starred);
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

          {(assistant.assigned_phone_number ?? assistant.description) && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              SMS
            </Badge>
          )}

          {assistant.plan_name && (
            <Badge
              variant={assistant.plan_name === 'business' ? 'default' : 'outline'}
              className="flex items-center gap-1"
            >
              <CreditCard className="h-3 w-3" />
              {assistant.plan_name === 'business' ? 'Business' : 'Personal'}
            </Badge>
          )}
        </div>

        <div className="flex items-center text-sm text-muted-foreground">
          <MessageSquare className="mr-1 h-4 w-4" />
          <span>
            {assistant.total_messages ? `${assistant.total_messages} messages` : 'No messages yet'}
          </span>
        </div>

        <div className="mt-3">
          <div className="text-xs text-muted-foreground">Created {createdAt}</div>
          {lastUsedDate && (
            <div className="text-xs text-muted-foreground">Last used {lastUsedDate}</div>
          )}
        </div>

        {assistant.plan_name === 'personal' && (
          <div className="mt-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                void handleUpgrade(assistant.id);
              }}
              disabled={isActionInProgressState}
            >
              {isActionInProgressState ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
              Upgrade to Business
            </Button>
          </div>
        )}
      </CardContent>

      <CardFooter className="gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-red-600"
                onClick={() => {
                  void handleDelete(assistant.id);
                }}
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
              <Link href={getDashboardUrl(assistant.name)} className="flex-1">
                <Button variant="outline" className="w-full">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>View detailed analytics</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Link href={`/Concierge/${assistant.id}`} className="flex-1">
          <Button variant="default" className="w-full">
            Open Concierge
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
