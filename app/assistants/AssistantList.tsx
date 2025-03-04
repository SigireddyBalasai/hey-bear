import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trash2, ChevronRight, MessageSquare, MoreHorizontal } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Assistant } from '@/lib/types-adapter';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface AssistantListProps {
  assistant: Assistant;
  getInitials: (name: string) => string;
  getAvatarColor: (name: string) => string;
  handleDeleteAssistant: (assistantId: string) => Promise<void>;
}

export function AssistantList({ 
  assistant, 
  getInitials, 
  getAvatarColor, 
  handleDeleteAssistant 
}: AssistantListProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const assistantName = assistant.name || assistant.assistantName || 'Unnamed Assistant';
  const createdAt = assistant.createdAt || assistant.started_at || new Date().toISOString();
  
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await handleDeleteAssistant(assistant.id || assistant.assistant_id);
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/10 transition-colors">
      <div className="flex items-center gap-3">
        <div 
          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${getAvatarColor(assistantName)}`}
        >
          {getInitials(assistantName)}
        </div>
        
        <div>
          <h3 className="font-medium">{assistantName}</h3>
          <p className="text-xs text-muted-foreground">
            Created {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MessageSquare className="h-3 w-3" />
          <span>{assistant.message_count || 0} messages</span>
        </div>
        
        <Link href={`/chat/${assistant.id || assistant.assistant_id}`} passHref>
          <Button size="sm" variant="outline">Chat</Button>
        </Link>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleDelete} disabled={isDeleting}>
              <Trash2 className="h-4 w-4 mr-2 text-destructive" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}