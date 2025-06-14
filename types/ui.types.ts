// UI component interfaces and types
import type { VariantProps } from 'class-variance-authority';

import type { badgeVariants } from '@/components/ui/badge';
import type { buttonVariants } from '@/components/ui/button';

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
  status: 'processing' | 'completed' | 'error';
  className?: string;
}

// File error dialog interfaces
export interface FileErrorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  error: string;
  fileName?: string;
}

// Date range picker interfaces
export interface DateRangePickerProps {
  value?: {
    from: Date;
    to: Date;
  };
  onChange?: (range: { from: Date; to: Date } | undefined) => void;
  placeholder?: string;
  className?: string;
}

// Stripe pricing table interfaces
export interface StripePricingTableProps {
  customerId?: string;
  className?: string;
}

// Header interfaces
export interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

// Create assistant dialog interfaces
export interface CreateAssistantDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}
