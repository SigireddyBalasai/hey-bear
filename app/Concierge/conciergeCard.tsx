import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, MoreHorizontal, Star, Trash, CreditCard, Phone } from "lucide-react";
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tables } from "@/lib/db.types";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { getAssistantData } from '@/utils/assistant-data';

type Assistant = Tables<'assistants'>;

// Extended assistant type that includes normalized data
interface ExtendedAssistant {
  assistant: Assistant;
  config?: Tables<'assistant_configs'> | null;
  subscription?: Tables<'assistant_subscriptions'> | null;
}

interface AssistantCardProps {
  assistant: Assistant;
  getInitials: (name: string) => string;
  getAvatarColor: (name: string) => string;
  handleDeleteAssistant: (id: string) => void;
  handleToggleStar: (id: string, isStarred: boolean) => void;
}

export function AssistantCard({ assistant, getInitials, getAvatarColor, handleDeleteAssistant, handleToggleStar }: AssistantCardProps) {
  const [extendedData, setExtendedData] = useState<ExtendedAssistant>({ assistant });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Fetch the normalized data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const assistantData = await getAssistantData(assistant.id);
        if (assistantData) {
          setExtendedData({
            assistant: assistantData.assistant,
            config: assistantData.config,
            subscription: assistantData.subscription
          });
        }
      } catch (error) {
        console.error('Error fetching assistant extended data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [assistant.id]);
  
  // Get description from normalized config or fallback to params
  const description = extendedData.config?.description || 
                     (typeof assistant.params === 'object' && 
                     assistant.params !== null && 
                     'description' in assistant.params ? 
                     String(assistant.params.description) : 
                     'No description provided');
  
  // Format the creation date
  const createdAt = assistant.created_at ? 
    format(new Date(assistant.created_at), 'MMM d, yyyy') : 
    'Unknown date';
    
  // Get subscription plan
  const subscriptionPlan = extendedData.subscription?.plan || 
                          (typeof assistant.params === 'object' && 
                          assistant.params !== null &&
                          'subscription' in assistant.params && 
                          typeof assistant.params.subscription === 'object' &&
                          assistant.params.subscription !== null &&
                          'plan' in assistant.params.subscription ?
                          assistant.params.subscription.plan : 
                          'personal');

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
              {/* Upgrade Plan button - show only for personal plans */}
              {subscriptionPlan === 'personal' && (
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
          {/* Subscription badge */}
          {subscriptionPlan && (
            <Badge 
              variant="outline" 
              className="gap-1 flex items-center" 
              color={subscriptionPlan === 'business' ? 'gold' : 'blue'}
            >
              <CreditCard className="h-3 w-3" />
              {subscriptionPlan === 'business' ? 'Business' : 'Personal'}
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
              Edit No-Show 
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
}