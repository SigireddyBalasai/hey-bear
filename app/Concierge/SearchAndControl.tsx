import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, LayoutGrid, LayoutList } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogTrigger } from "@/components/ui/dialog";

type SearchAndControlsProps = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  createDialogOpen: boolean;
  setCreateDialogOpen: (open: boolean) => void;
};

export function SearchAndControls({
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  createDialogOpen,
  setCreateDialogOpen,
}: SearchAndControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
      <div className="relative flex-grow">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search No-Shows..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="border rounded-md p-1 flex">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setViewMode('list')}
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>Change view</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              <span>New No-Show</span>
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>
    </div>
  );
}