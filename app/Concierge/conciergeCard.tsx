import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Bot, Star, Trash, Phone, CreditCard } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Tables } from '@/lib/db.types';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type Assistant = Tables<'assistants'>;

interface AssistantCardProps {
  assistant: Assistant;
  getInitials: (name: string) => string;
  getAvatarColor: (name: string) => string;
  handleDeleteAssistant: (id: string) => void;
  handleToggleStar: (id: string, isStarred: boolean) => void;
}

export function AssistantCard({ assistant, getInitials, getAvatarColor, handleDeleteAssistant, handleToggleStar }: AssistantCardProps) {
  // Parse description from params if available
  const description = typeof assistant.params === 'object' && 
                     assistant.params !== null && 
                     'description' in assistant.params ? 
                     String(assistant.params.description) : 
                     'No description provided';
  
  // Format the creation date
  const createdAt = assistant.created_at ? 
    format(new Date(assistant.created_at), 'MMM d, yyyy') : 
    'Unknown date';

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="space-y-2">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            {assistant.name}
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
                  >
                    <Star 
                      className={cn(
                        "h-4 w-4", 
                        assistant.is_starred 
                          ? "fill-yellow-400 text-yellow-400" 
                          : "text-muted-foreground"
                      )} 
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {assistant.is_starred ? "Unstar" : "Star"} assistant
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* Upgrade Plan button */}
              {typeof assistant.params === 'object' && 
               assistant.params !== null && 
               'subscription' in assistant.params && 
               typeof assistant.params.subscription === 'object' &&
               assistant.params.subscription !== null &&
               'plan' in assistant.params.subscription &&
               assistant.params.subscription.plan === 'personal' && (
                <>
                  <DropdownMenuItem 
                    onClick={() => window.location.href=`/api/subscriptions/upgrade?assistantId=${assistant.id}`}
                    className="cursor-pointer"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Upgrade to Business
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem 
                onClick={() => handleDeleteAssistant(assistant.id)}
                className="text-red-600 focus:text-red-600 dark:focus:text-red-400 cursor-pointer"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                Created: {createdAt}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription className="line-clamp-2 mt-1">
          {description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="flex items-center">
            <Bot className="mr-1 h-3 w-3" /> No-Show 
          </Badge>
          {assistant.assigned_phone_number && (
            <Badge variant="outline" className="gap-1 flex items-center">
              <Phone className="h-3 w-3" />
              SMS
            </Badge>
          )}
          {typeof assistant.params === 'object' && 
           assistant.params !== null && 
           'subscription' in assistant.params && 
           typeof assistant.params.subscription === 'object' &&
           assistant.params.subscription !== null &&
           'plan' in assistant.params.subscription && (
            <Badge 
              variant="outline" 
              className="gap-1 flex items-center" 
              color={assistant.params.subscription.plan === 'business' ? 'gold' : 'blue'}
            >
              <CreditCard className="h-3 w-3" />
              {assistant.params.subscription.plan === 'business' ? 'Business' : 'Personal'}
            </Badge>
          )}
        </div>
      </CardContent>
      
      <CardFooter>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={`/Concierge/${assistant.id}`} className="w-full">
                <Button className="w-full">
                  Open and Edit
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              Chat with {assistant.name}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
}