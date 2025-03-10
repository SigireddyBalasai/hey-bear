import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Bot, Star, Trash } from "lucide-react";
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
}

export function AssistantCard({ assistant, getInitials, getAvatarColor, handleDeleteAssistant }: AssistantCardProps) {
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
        <div className="flex items-start justify-between">
          <Avatar className={cn("h-12 w-12", getAvatarColor(assistant.name))}>
            <AvatarFallback>{getInitials(assistant.name)}</AvatarFallback>
          </Avatar>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
        
        <div>
          <CardTitle className="flex items-center gap-2">
            {assistant.name}
            {assistant.is_starred && (
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            )}
          </CardTitle>
          <CardDescription className="line-clamp-2 mt-1">
            {description}
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="flex items-center">
            <Bot className="mr-1 h-3 w-3" /> Assistant
          </Badge>
        </div>
      </CardContent>
      
      <CardFooter>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={`/assistants/${assistant.id}`} className="w-full">
                <Button className="w-full">
                  Open Assistant
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