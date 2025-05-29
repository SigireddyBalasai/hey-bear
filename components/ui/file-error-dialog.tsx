import { useState } from 'react';

import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  details,
}: FileErrorDialogProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-4 w-4 text-destructive" />
            </div>
            {title}
          </DialogTitle>
          <DialogDescription className="pt-2">{description}</DialogDescription>
        </DialogHeader>

        {details && (
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="flex w-full items-center justify-between"
              onClick={() => { setShowDetails(!showDetails); }}
            >
              <span>Technical Details</span>
              {showDetails ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {showDetails && (
              <div className="max-h-[200px] overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 font-mono text-sm shadow-inner">
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
