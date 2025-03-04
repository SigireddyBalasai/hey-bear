import { Assistant } from '@/lib/types-adapter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, MessageSquare, Trash2 } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import Link from 'next/link';

interface AssistantCardProps {
  assistant: Assistant;
  getInitials: (name: string) => string;
  getAvatarColor: (name: string) => string;
  handleDeleteAssistant: (assistantId: string) => Promise<void>;
}

export function AssistantCard({ 
  assistant, 
  getInitials, 
  getAvatarColor, 
  handleDeleteAssistant 
}: AssistantCardProps) {
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
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div 
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${getAvatarColor(assistantName)}`}
            >
              {getInitials(assistantName)}
            </div>
            <div>
              <CardTitle className="text-lg">{assistantName}</CardTitle>
              <CardDescription className="text-xs">
                Created {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
              </CardDescription>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="p-1 h-auto" aria-label="Options">
                <MoreHorizontal className="h-5 w-5" />
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
      </CardHeader>
      
      <CardContent className="pb-2">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {assistant.description || 'No description provided.'}
        </p>
      </CardContent>
      
      <CardFooter className="pt-1 flex justify-between items-center">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MessageSquare className="h-3 w-3" />
          <span>{assistant.message_count || 0} messages</span>
        </div>
        
        <Link href={`/chat/${assistant.id || assistant.assistant_id}`} passHref>
          <Button size="sm">Chat</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}