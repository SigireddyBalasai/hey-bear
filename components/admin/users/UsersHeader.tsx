import { RefreshCw, UserPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UsersHeaderProps {
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function UsersHeader({ isRefreshing, onRefresh }: UsersHeaderProps) {
  return (
    <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground">Manage user accounts and permissions</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={isRefreshing}
          onClick={onRefresh}
        >
          <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
          Refresh
        </Button>
        <Button
          size="sm"
          className="gap-2"
          onClick={() => {
            window.location.href = '/admin/users/new';
          }}
        >
          <UserPlus className="h-4 w-4" />
          Add User
        </Button>
      </div>
    </div>
  );
}
