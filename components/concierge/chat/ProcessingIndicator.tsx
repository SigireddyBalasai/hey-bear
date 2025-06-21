'use client';

import { Loader2 } from 'lucide-react';
import React from 'react';


import { Card, CardContent } from '@/components/ui/card';

interface ProcessingIndicatorProps {
  fileList: { files: Array<{ id: string; status?: string }> };
  processingFileIds: string[];
}

export function ProcessingIndicator({ fileList, processingFileIds }: ProcessingIndicatorProps) {
  const processingFilesCount = fileList.files.filter(
    file => file.status === 'Processing' || processingFileIds.includes(file.id)
  ).length;

  if (processingFilesCount <= 0) return null;

  return (
    <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950/70 dark:border-blue-800 shadow-sm">
      <CardContent className="p-3 flex items-center gap-2">
        <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
        <p className="text-sm">
          {processingFilesCount} file(s) being processed. Chat will be available once processing
          completes.
        </p>
      </CardContent>
    </Card>
  );
}
