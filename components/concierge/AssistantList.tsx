"use client";
import React, { useState } from 'react';
import { Card, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bot, Star, Trash, ArrowRight, Phone, CreditCard, MessageSquare, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

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
  onDelete
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
      toast(`Assistant ${isStarred ? "starred" : "unstarred"}`, {
        description: `${assistant.name} has been ${isStarred ? "starred" : "unstarred"}`,
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
      toast("Assistant deleted", {
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
      .substring(0, 2);
  };

  // Get a consistent color based on the name
  const getAvatarColor = (name: string): string => {
    const colors = [
      "bg-red-100 text-red-800",
      "bg-green-100 text-green-800",
      "bg-blue-100 text-blue-800",
      "bg-yellow-100 text-yellow-800",
      "bg-purple-100 text-purple-800",
      "bg-pink-100 text-pink-800",
      "bg-indigo-100 text-indigo-800",
      "bg-gray-100 text-gray-800",
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
      <Card className="p-4 w-full">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-muted animate-pulse"></div>
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-muted rounded w-1/4 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
            <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
          </div>
        </div>
      </Card>
    );
  }

  // Format the creation date
  const createdAt = assistant.created_at ? 
    format(new Date(assistant.created_at), 'MMM d, yyyy') : 
    'Unknown date';

  return (
    <Card className="p-4 w-full">
      <div className="flex items-center gap-4">
        <Avatar className={cn("h-10 w-10", getAvatarColor(assistant.name))}>
          <AvatarFallback>{getInitials(assistant.name)}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate">
              {assistant.name}
            </h3>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
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
                          "h-4 w-4", 
                          assistant.is_starred 
                            ? "fill-yellow-400 text-yellow-400" 
                            : "text-muted-foreground"
                        )} 
                      />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {assistant.is_starred ? "Unstar" : "Star"} Concierge
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="flex items-center">
            <CardDescription className="line-clamp-1 text-sm mr-2">
              {assistant.description || 'No description provided'}
            </CardDescription>
            
            {/* Show message count if available */}
            {assistant.total_messages && assistant.total_messages > 0 && (
              <Badge variant="outline" className="text-xs gap-1">
                <MessageSquare className="h-3 w-3" />
                {assistant.total_messages}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant="outline" className="hidden md:flex items-center">
            <Bot className="mr-1 h-3 w-3" /> Concierge
          </Badge>
          
          {assistant.has_phone_number && (
            <Badge variant="outline" className="hidden md:flex items-center gap-1">
              <Phone className="h-3 w-3" />
              SMS
            </Badge>
          )}
          
          {assistant.subscription_plan && (
            <Badge 
              variant="outline" 
              className={cn(
                "hidden md:flex items-center gap-1", 
                assistant.subscription_plan === 'business' ? "text-amber-600 dark:text-amber-400" : ""
              )}
            >
              <CreditCard className="h-3 w-3" />
              {assistant.subscription_plan === 'business' ? 'Business' : 'Personal'}
            </Badge>
          )}
          
          <p className="text-xs text-muted-foreground hidden lg:block">
            Created {createdAt}
          </p>
          
          {assistant.last_used_at && (
            <p className="text-xs text-muted-foreground hidden lg:block">
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
                  onClick={() => handleDelete(assistant.id)}
                  disabled={isActionInProgressState}
                >
                  {isActionInProgressState ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Delete Concierge
              </TooltipContent>
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
              <TooltipContent>
                Open Concierge
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </Card>
  );
}