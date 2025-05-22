"use client";
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export interface Assistant {
  id: string;
  name: string;
}

export interface FilterComponentProps {
  assistants?: Assistant[];
  isLoading?: boolean;
  selectedAssistantId?: string | null;
  fromDate?: string;
  toDate?: string;
  onFromDateChange?: (date: string) => void;
  onToDateChange?: (date: string) => void;
  onAssistantChange?: (assistantId: string) => void;
  onApplyFilters?: () => void;
  onClose?: () => void;
  setShowFilters?: React.Dispatch<React.SetStateAction<boolean>>;
}

const FilterComponent = ({ 
  assistants = [],
  isLoading = false,
  selectedAssistantId = null,
  fromDate = "",
  toDate = "",
  onFromDateChange = () => {},
  onToDateChange = () => {},
  onAssistantChange = () => {},
  onApplyFilters = () => {},
  onClose = () => {},
  setShowFilters
}: FilterComponentProps) => {
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-sm font-medium block mb-1">From Date</label>
            <Input 
              type="date" 
              value={fromDate} 
              onChange={(e) => onFromDateChange(e.target.value)} 
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">To Date</label>
            <Input 
              type="date" 
              value={toDate} 
              onChange={(e) => onToDateChange(e.target.value)} 
            />
          </div>
          <div>
            <h3 className="mb-2 font-medium">Concierge</h3>
            <RadioGroup 
              value={selectedAssistantId || 'all'} 
              className="flex flex-col space-y-1"
              onValueChange={onAssistantChange}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="Concierge-all" />
                <Label htmlFor="Concierge-all">All Concierges</Label>
              </div>
              
              {isLoading ? (
                <div className="text-sm text-muted-foreground">Loading concierges...</div>
              ) : assistants.length > 0 ? (
                assistants.map(assistant => (
                  <div key={assistant.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={assistant.id} id={`assistant-${assistant.id}`} />
                    <Label htmlFor={`assistant-${assistant.id}`}>{assistant.name}</Label>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No concierges found</div>
              )}
            </RadioGroup>
          </div>
          <div>
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" onClick={onApplyFilters}>
              Apply Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FilterComponent;
