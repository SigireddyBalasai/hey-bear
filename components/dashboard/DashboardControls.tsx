'use client';

import { Calendar, Filter } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DashboardControlsProps {
  dateRange: string;
  showFilters: boolean;
  onToggleFilters: () => void;
  onDateRangeChange: (startDate: string, endDate: string) => void;
}

export function DashboardControls({
  dateRange,
  showFilters,
  onToggleFilters,
  onDateRangeChange,
}: DashboardControlsProps) {
  const today = new Date();
  const oneMonthAgo = new Date();

  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const handleApplyDateRange = () => {
    const startDate = (document.querySelector('#start-date') as HTMLInputElement).value;
    const endDate = (document.querySelector('#end-date') as HTMLInputElement).value;

    onDateRangeChange(startDate, endDate);
  };

  return (
    <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row">
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {dateRange}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="space-y-4 p-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium" htmlFor="start-date">
                    Start Date
                  </label>
                  <Input
                    id="start-date"
                    type="date"
                    defaultValue={oneMonthAgo.toISOString().split('T')[0]}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium" htmlFor="end-date">
                    End Date
                  </label>
                  <Input
                    id="end-date"
                    type="date"
                    defaultValue={today.toISOString().split('T')[0]}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" size="sm">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleApplyDateRange}>
                  Apply
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          size="sm"
          onClick={onToggleFilters}
          className={showFilters ? 'bg-gray-100' : ''}
        >
          <Filter className="mr-1 h-4 w-4" />
          Filters
        </Button>
      </div>
    </div>
  );
}
