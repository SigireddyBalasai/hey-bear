import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface FileErrorDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  details?: string;
}

export function FileErrorDialog({
  open,
  onClose,
  title,
  description,
  details
}: FileErrorDialogProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" /> 
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        {details && (
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full flex justify-between"
              onClick={() => setShowDetails(!showDetails)}
            >
              <span>Technical Details</span>
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            
            {showDetails && (
              <div className="bg-muted p-3 rounded-md text-sm font-mono whitespace-pre-wrap max-h-[200px] overflow-auto">
                {details}
              </div>
            )}
          </div>
        )}
        
        <DialogFooter>
          <Button onClick={onClose}>Dismiss</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
