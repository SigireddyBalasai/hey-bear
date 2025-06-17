import { Loader2 } from 'lucide-react';

import type { FileStatusBadgeProps } from '@/types/ui.types';

import { Badge } from './badge';

type FileStatus = 'ready' | 'processing' | 'failed';

export function FileStatusBadge({
  status,
  percentDone: _percentDone,
  className: _className,
}: FileStatusBadgeProps) {
  switch (status) {
    case 'ready': {
      return (
        <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
          Ready
        </Badge>
      );
    }
    case 'processing': {
      return (
        <Badge variant="outline" className="gap-1 border-amber-200 bg-amber-50 text-amber-700">
          <Loader2 className="h-3 w-3 animate-spin" />
          Processing
        </Badge>
      );
    }
    case 'completed': {
      return (
        <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
          Completed
        </Badge>
      );
    }
    case 'failed':
    case 'error': {
      return (
        <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
          {status === 'failed' ? 'Failed' : 'Error'}
        </Badge>
      );
    }
    default: {
      return null;
    }
  }
}
