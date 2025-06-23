import { FileSpreadsheet } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AdminUsageFilterControlsProps } from '@/types/admin.types';

export function UsageFilterControls({
  selectedTimeframe,
  selectedAssistant,
  selectedPlan,
  selectedModel,
  assistants,
  onTimeframeChange,
  onAssistantChange,
  onPlanChange,
  onModelChange,
}: AdminUsageFilterControlsProps) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 className="text-3xl font-bold">Usage Analytics</h1>
        <p className="text-muted-foreground">
          Analyze usage patterns and costs across your organization
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={selectedAssistant} onValueChange={onAssistantChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Assistants" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assistants</SelectItem>
            {assistants.map(assistant => (
              <SelectItem key={assistant.id} value={assistant.id}>
                {assistant.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedPlan} onValueChange={onPlanChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Plans" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="personal">Personal</SelectItem>
            <SelectItem value="business">Business</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedModel} onValueChange={onModelChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Models" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Models</SelectItem>
            <SelectItem value="gpt-4">GPT-4</SelectItem>
            <SelectItem value="claude">Claude</SelectItem>
            <SelectItem value="gpt-3.5">GPT-3.5</SelectItem>
            <SelectItem value="mistral">Mistral</SelectItem>
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" /> Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Export Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Excel (.xlsx)</DropdownMenuItem>
            <DropdownMenuItem>CSV (.csv)</DropdownMenuItem>
            <DropdownMenuItem>PDF Report (.pdf)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={selectedTimeframe === '7d' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onTimeframeChange('7d')}
        >
          7 days
        </Button>
        <Button
          variant={selectedTimeframe === '30d' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onTimeframeChange('30d')}
        >
          30 days
        </Button>
        <Button
          variant={selectedTimeframe === '90d' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onTimeframeChange('90d')}
        >
          90 days
        </Button>
        <Button
          variant={selectedTimeframe === '180d' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onTimeframeChange('180d')}
        >
          180 days
        </Button>
      </div>
    </div>
  );
}
