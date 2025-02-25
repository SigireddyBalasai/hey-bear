import React from 'react';
import { Badge } from './badge';
import { Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

type FileStatus = "ready" | "processing" | "failed";

interface FileStatusBadgeProps {
  status: FileStatus;
  className?: string;
  percentDone?: number;
}

export function FileStatusBadge({ status, percentDone, className }: FileStatusBadgeProps) {
  switch (status) {
    case "ready":
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Ready
        </Badge>
      );
    case "processing":
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Processing
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          Failed
        </Badge>
      );
    default:
      return null;
  }
}
