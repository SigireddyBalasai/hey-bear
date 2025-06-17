'use client';

import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { format } from 'date-fns';
import { CalendarIcon, FilterIcon, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { useMultipleLoadingStates } from '@/hooks/useLoadingState';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/db.types';
import type { FilterComponentProps, FilterValues } from '@/types/interaction.types';
import { withErrorHandling } from '@/utils/error-handling';
import { createClient } from '@/utils/supabase/client';

import { useData } from './DataContext';

type Assistant = Database['public']['Tables']['assistants']['Row'];

// Memoized sub-components
const DatePicker = memo<{
  date: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  placeholder: string;
  disabled?: boolean;
}>(({ date, onSelect, placeholder, disabled = false }) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        className={cn(
          'w-full justify-start text-left font-normal',
          !date && 'text-muted-foreground'
        )}
        disabled={disabled}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {date ? format(date, 'PPP') : placeholder}
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0" align="start">
      <Calendar mode="single" selected={date} onSelect={onSelect} initialFocus />
    </PopoverContent>
  </Popover>
));

DatePicker.displayName = 'DatePicker';

const AssistantSelector = memo<{
  assistants: Assistant[];
  isLoading: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
}>(({ assistants, isLoading, selectedId, onSelect }) => {
  const assistantOptions = useMemo(
    () => (
      <>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="all" id="assistant-all" />
          <Label htmlFor="assistant-all">All Assistants</Label>
        </div>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        ) : assistants.length > 0 ? (
          assistants.map(assistant => (
            <div key={assistant.id} className="flex items-center space-x-2">
              <RadioGroupItem value={assistant.id} id={`assistant-${assistant.id}`} />
              <Label htmlFor={`assistant-${assistant.id}`}>{assistant.name}</Label>
            </div>
          ))
        ) : (
          <div className="text-sm text-muted-foreground">No assistants found</div>
        )}
      </>
    ),
    [assistants, isLoading]
  );

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Assistant</Label>
      <RadioGroup value={selectedId} onValueChange={onSelect}>
        {assistantOptions}
      </RadioGroup>
    </div>
  );
});

AssistantSelector.displayName = 'AssistantSelector';

const QuickDateRanges = memo<{
  onSelect: (range: { from: Date; to: Date; label: string }) => void;
  disabled?: boolean;
}>(({ onSelect, disabled = false }) => {
  const dateRanges = useMemo(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const last3Months = new Date(today);
    last3Months.setMonth(last3Months.getMonth() - 3);

    return [
      { from: yesterday, to: today, label: 'Last 24 hours' },
      { from: lastWeek, to: today, label: 'Last 7 days' },
      { from: lastMonth, to: today, label: 'Last 30 days' },
      { from: last3Months, to: today, label: 'Last 3 months' },
    ];
  }, []);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Quick Ranges</Label>
      <div className="grid grid-cols-2 gap-2">
        {dateRanges.map(range => (
          <Button
            key={range.label}
            variant="outline"
            size="sm"
            onClick={() => onSelect(range)}
            disabled={disabled}
            className="text-xs"
          >
            {range.label}
          </Button>
        ))}
      </div>
    </div>
  );
});

QuickDateRanges.displayName = 'QuickDateRanges';

// Main component
const FilterComponent: React.FC<FilterComponentProps> = memo(
  ({ onClose, className = '', setShowFilters }) => {
    const { filterInteractions, assistantId, setAssistantId } = useData();

    // Local state for filter values
    const [filterValues, setFilterValues] = useState<FilterValues>({
      fromDate: undefined,
      toDate: undefined,
      assistantId: assistantId || 'all',
      searchTerm: '',
      dateRange: 'last30days',
    });

    const [assistants, setAssistants] = useState<Assistant[]>([]);
    const { loadingStates, setLoadingState } = useMultipleLoadingStates([
      'loading',
      'applying',
    ] as const);

    // Memoized update functions
    const updateFilterValue = useCallback(
      <K extends keyof FilterValues>(key: K, value: FilterValues[K]) => {
        setFilterValues(prev => ({ ...prev, [key]: value }));
      },
      []
    );

    // Fetch assistants
    const fetchAssistants = useCallback(async () => {
      setLoadingState('loading', true);

      await withErrorHandling(
        async () => {
          const supabase = createClient();
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();
          if (userError || !user) {
            console.error('Error fetching user:', userError);
            return;
          }

          const { data: assistantsData, error: assistantsError } = await supabase
            .from('assistants')
            .select('*')
            .eq('user_id', user.id)
            .order('name');

          if (assistantsError) {
            console.error('Error fetching assistants:', assistantsError);
            return;
          }

          if (assistantsData) {
            setAssistants(assistantsData);
          }
        },
        {
          toastTitle: 'Failed to load assistants',
          fallbackMessage: 'Unable to fetch assistant list',
        }
      );

      setLoadingState('loading', false);
    }, [setLoadingState]);

    // Load assistants on mount
    useEffect(() => {
      fetchAssistants();
    }, [fetchAssistants]);

    // Apply filters
    const handleApplyFilters = useCallback(async () => {
      setLoadingState('applying', true);

      try {
        // Update assistant ID in context
        if (filterValues.assistantId !== assistantId) {
          setAssistantId(filterValues.assistantId === 'all' ? null : filterValues.assistantId);
        }

        // Apply date filters
        const filters: { fromDate?: string; toDate?: string } = {};

        if (filterValues.fromDate) {
          filters.fromDate = filterValues.fromDate.toISOString();
        }

        if (filterValues.toDate) {
          filters.toDate = filterValues.toDate.toISOString();
        }

        // Add required FilterOptions properties
        const completeFilters = {
          ...filters,
          assistantId: filterValues.assistantId === 'all' ? '' : filterValues.assistantId,
          searchTerm: filterValues.searchTerm,
        };

        await filterInteractions(completeFilters);

        // Close filter panel
        onClose?.();
        setShowFilters?.(false);
      } catch (error) {
        console.error('Failed to apply filters:', error);
      } finally {
        setLoadingState('applying', false);
      }
    }, [
      filterValues,
      assistantId,
      setAssistantId,
      filterInteractions,
      onClose,
      setShowFilters,
      setLoadingState,
    ]);

    // Reset filters
    const handleResetFilters = useCallback(() => {
      setFilterValues({
        fromDate: undefined,
        toDate: undefined,
        assistantId: 'all',
        searchTerm: '',
        dateRange: 'last30days',
      });
      setAssistantId(null);
    }, [setAssistantId]);

    // Quick date range handler
    const handleQuickDateRange = useCallback((range: { from: Date; to: Date; label: string }) => {
      setFilterValues(prev => ({
        ...prev,
        fromDate: range.from,
        toDate: range.to,
      }));
    }, []);

    // Memoized form content
    const formContent = useMemo(
      () => (
        <div className="space-y-6">
          {/* Date Range Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Date Range</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-xs text-muted-foreground"
              >
                Reset All
              </Button>
            </div>

            <QuickDateRanges onSelect={handleQuickDateRange} disabled={loadingStates.applying} />

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label className="text-xs">From Date</Label>
                <DatePicker
                  date={filterValues.fromDate}
                  onSelect={date => updateFilterValue('fromDate', date || undefined)}
                  placeholder="Select start date"
                  disabled={loadingStates.applying}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">To Date</Label>
                <DatePicker
                  date={filterValues.toDate}
                  onSelect={date => updateFilterValue('toDate', date || undefined)}
                  placeholder="Select end date"
                  disabled={loadingStates.applying}
                />
              </div>
            </div>
          </div>

          {/* Assistant Section */}
          <AssistantSelector
            assistants={assistants}
            isLoading={loadingStates.loading}
            selectedId={filterValues.assistantId}
            onSelect={id => updateFilterValue('assistantId', id)}
          />

          {/* Search Section */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Search</Label>
            <Input
              placeholder="Search interactions..."
              value={filterValues.searchTerm}
              onChange={e => updateFilterValue('searchTerm', e.target.value)}
              disabled={loadingStates.applying}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleApplyFilters}
              disabled={loadingStates.applying}
              className="flex-1"
            >
              {loadingStates.applying ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Applying...
                </>
              ) : (
                <>
                  <FilterIcon className="mr-2 h-4 w-4" />
                  Apply Filters
                </>
              )}
            </Button>

            {(onClose != null || setShowFilters != null) && (
              <Button
                variant="outline"
                onClick={() => {
                  onClose?.();
                  setShowFilters?.(false);
                }}
                disabled={loadingStates.applying}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ),
      [
        filterValues,
        assistants,
        loadingStates.loading,
        loadingStates.applying,
        handleQuickDateRange,
        updateFilterValue,
        handleApplyFilters,
        handleResetFilters,
        onClose,
        setShowFilters,
      ]
    );

    return (
      <Card className={className}>
        <CardContent className="p-6">{formContent}</CardContent>
      </Card>
    );
  }
);

FilterComponent.displayName = 'FilterComponent';

export default FilterComponent;
