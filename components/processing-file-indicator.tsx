import React from 'react';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProcessingFileIndicatorProps {
  processingCount: number;
  className?: string;
}

export function ProcessingFileIndicator({ processingCount, className }: ProcessingFileIndicatorProps) {
  if (processingCount <= 0) return null;
  
  return (
    <Card className={cn("bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-900", className)}>
      <div className="p-3 flex items-center gap-3">
        <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-2">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">
            {processingCount === 1 ? '1 file is being processed' : `${processingCount} files are being processed`}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Files are being processed. You can chat once they're ready.
          </p>
        </div>
      </div>
    </Card>
  );
}
