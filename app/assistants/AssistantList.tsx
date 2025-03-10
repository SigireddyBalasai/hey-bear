import React from 'react';
import { Card, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bot, Star, Trash, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tables } from '@/lib/db.types';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

type Assistant = Tables<'assistants'>;

interface AssistantListProps {
  assistant: Assistant;
  getInitials: (name: string) => string;
  getAvatarColor: (name: string) => string;
  handleDeleteAssistant: (id: string) => void;
}

export function AssistantList({ assistant, getInitials, getAvatarColor, handleDeleteAssistant }: AssistantListProps) {
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
            {assistant.is_starred && (
              <Star className="h-4 w-4 flex-shrink-0 fill-yellow-400 text-yellow-400" />
            )}
          </div>
          
          <CardDescription className="line-clamp-1 text-sm">
            {description}
          </CardDescription>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant="outline" className="hidden md:flex items-center">
            <Bot className="mr-1 h-3 w-3" /> Assistant
          </Badge>
          
          <p className="text-xs text-muted-foreground hidden lg:block">
            Created {createdAt}
          </p>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="text-red-600" onClick={() => handleDeleteAssistant(assistant.id)}>
                  <Trash className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Delete assistant
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={`/assistants/${assistant.id}`}>
                  <Button size="sm">
                    Open <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                Chat with {assistant.name}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </Card>
  );
}