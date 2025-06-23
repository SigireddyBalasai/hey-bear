import { Button } from '@/components/ui/button';
import type { AdminTimeRangeSelectorProps } from '@/types/admin.types';

export function TimeRangeSelector({
  selectedTimeRange,
  onTimeRangeChange,
}: AdminTimeRangeSelectorProps) {
  return (
    <div className="flex gap-2">
      <Button
        variant={selectedTimeRange === '7d' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onTimeRangeChange('7d')}
        className="shadow-sm"
      >
        Week
      </Button>
      <Button
        variant={selectedTimeRange === '30d' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onTimeRangeChange('30d')}
        className="shadow-sm"
      >
        Month
      </Button>
      <Button
        variant={selectedTimeRange === '90d' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onTimeRangeChange('90d')}
        className="shadow-sm"
      >
        3 Months
      </Button>
    </div>
  );
}
