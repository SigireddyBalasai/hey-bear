import { Loader2 } from 'lucide-react';

import { Badge } from './badge';
import type { FileStatusBadgeProps } from '@/types/consolidated-interfaces';

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
    case 'failed': {
      return (
        <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
          Failed
        </Badge>
      );
    }
    default: {
      return null;
    }
  }
}
