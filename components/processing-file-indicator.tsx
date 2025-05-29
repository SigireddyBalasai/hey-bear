import { Loader2 } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ProcessingFileIndicatorProps {
  processingCount: number;
  className?: string;
}

export function ProcessingFileIndicator({
  processingCount,
  className,
}: ProcessingFileIndicatorProps) {
  if (processingCount <= 0) return null;

  return (
    <Card
      className={cn('border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950', className)}
    >
      <div className="flex items-center gap-3 p-3">
        <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">
            {processingCount === 1
              ? '1 file is being processed'
              : `${processingCount} files are being processed`}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Files are being processed. You can chat once they're ready.
          </p>
        </div>
      </div>
    </Card>
  );
}
