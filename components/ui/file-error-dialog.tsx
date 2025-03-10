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
            <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-destructive" /> 
            </div>
            {title}
          </DialogTitle>
          <DialogDescription className="pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        {details && (
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full flex justify-between items-center"
              onClick={() => setShowDetails(!showDetails)}
            >
              <span>Technical Details</span>
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            
            {showDetails && (
              <div className="bg-muted p-3 rounded-md text-sm font-mono whitespace-pre-wrap max-h-[200px] overflow-auto shadow-inner">
                {details}
              </div>
            )}
          </div>
        )}
        
        <DialogFooter>
          <Button onClick={onClose} className="w-full sm:w-auto">
            Dismiss
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
