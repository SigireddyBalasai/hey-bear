// UI component interfaces and types
import type { DateRange } from 'react-day-picker';

import type { VariantProps } from 'class-variance-authority';

import type { badgeVariants } from '@/components/ui/badge';
import type { buttonVariants } from '@/components/ui/button';
import type { Database } from '@/types/db.types';

// Database types for UI usage
type AssistantRow = Database['public']['Tables']['assistants']['Row'];
type AssistantConfigRow = Database['public']['Tables']['assistant_configs']['Row'];

// Badge component interfaces
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

// Button component interfaces
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

// File status badge interfaces
export interface FileStatusBadgeProps {
  status: 'ready' | 'processing' | 'failed' | 'completed' | 'error';
  className?: string;
  percentDone?: number;
}

// File error dialog interfaces
export interface FileErrorDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  details?: string;
}

// Date range picker interfaces
export interface DateRangePickerProps {
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
}

// Header interfaces
export interface HeaderProps {
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  } | null;
  onCreateNew?: () => void;
}

//  Create Assistant Dialog interfaces
export interface CreateAssistantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: Pick<AssistantRow, 'name'> &
    Pick<
      AssistantConfigRow,
      | 'description'
      | 'personality'
      | 'business_name'
      | 'share_phone_number'
      | 'business_phone'
      | 'concierge_name'
    >;
  onInputChange: (field: string, value: string | boolean) => void;
}

// Stripe pricing table interfaces
export interface StripePricingTableProps {
  sessionId: string;
  onPaymentSuccess?: () => void;
  onPaymentCancel?: () => void;
  className?: string;
}
