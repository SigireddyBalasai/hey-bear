import React from 'react';

import { CreditCard } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface PlanInfoHeaderProps {
  planType: string;
  isLoading: boolean;
  /**
   * Optional link for upgrading plan
   */
  upgradePath?: string;
  /**
   * Optional callback for upgrading plan
   */
  onUpgrade?: () => void;
  /**
   * Optional display variant
   */
  variant?: 'default' | 'compact' | 'badge';
}

/**
 * Component for displaying the plan type information
 */
export const PlanInfoHeader: React.FC<PlanInfoHeaderProps> = ({
  planType,
  isLoading,
  upgradePath,
  onUpgrade,
  variant = 'default',
}) => {
  // Function to determine badge variant based on plan type
  const getPlanBadgeVariant = () => {
    const normalized = planType?.toLowerCase() || '';
    if (normalized.includes('pro')) return 'default';
    if (normalized.includes('business')) return 'default';
    if (normalized.includes('enterprise')) return 'default';
    return 'secondary'; // free plan
  };

  // Badge style display
  if (variant === 'badge') {
    if (isLoading) {
      return <Skeleton className="h-6 w-16" />;
    }
    return <Badge variant={getPlanBadgeVariant()}>{planType}</Badge>;
  }

  // Compact style - just plan name
  if (variant === 'compact') {
    return (
      <div className="flex items-center">
        {isLoading ? (
          <Skeleton className="h-4 w-20" />
        ) : (
          <span className="font-semibold">{planType}</span>
        )}
      </div>
    );
  }

  // Default style - full info with potential upgrade button
  return (
    <div className="flex items-center justify-between">
      <CardDescription>
        Your current plan:{' '}
        {isLoading ? (
          <Skeleton className="inline-block h-4 w-20" />
        ) : (
          <span className="font-semibold">{planType}</span>
        )}
      </CardDescription>

      {!isLoading && (upgradePath || onUpgrade) && planType.toLowerCase() !== 'enterprise' && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={onUpgrade}
          asChild={!!upgradePath}
        >
          {upgradePath ? (
            <a href={upgradePath}>
              <CreditCard className="mr-1 h-3 w-3" /> Upgrade
            </a>
          ) : (
            <>
              <CreditCard className="mr-1 h-3 w-3" /> Upgrade
            </>
          )}
        </Button>
      )}
    </div>
  );
};
