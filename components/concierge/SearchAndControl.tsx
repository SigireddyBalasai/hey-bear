import { LayoutGrid, LayoutList, Plus, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type ViewMode = 'grid' | 'list';

type SearchAndControlsProps = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onCreateNew: () => void;
};

export function SearchAndControls({
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  onCreateNew,
}: SearchAndControlsProps) {
  return (
    <div className="mb-6 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
      <div className="relative flex-grow">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search no-shows..."
          className="pl-10"
          value={searchQuery}
          onChange={e => {
            setSearchQuery(e.target.value);
          }}
        />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex rounded-md border p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => {
                    setViewMode('grid');
                  }}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => {
                    setViewMode('list');
                  }}
                  aria-label="List view"
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>Change view</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button className="gap-2" onClick={onCreateNew}>
          <Plus className="h-4 w-4" />
          <span>New no-show</span>
        </Button>
      </div>
    </div>
  );
}
