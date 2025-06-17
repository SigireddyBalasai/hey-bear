import { DollarSign, Users } from 'lucide-react';

import { Card } from '@/components/ui/card';

export function QuickActions() {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Quick Actions</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card
          className="cursor-pointer p-6 shadow-sm transition-all hover:shadow-md"
          onClick={() => {
            window.location.href = '/admin/users';
          }}
        >
          <h3 className="mb-2 flex items-center font-medium">
            <Users className="mr-2 h-5 w-5" /> Manage Users
          </h3>
          <p className="text-sm text-muted-foreground">
            View and manage user accounts, permissions, and usage
          </p>
        </Card>

        <Card
          className="cursor-pointer p-6 shadow-sm transition-all hover:shadow-md"
          onClick={() => {
            window.location.href = '/admin/usage';
          }}
        >
          <h3 className="mb-2 flex items-center font-medium">
            <DollarSign className="mr-2 h-5 w-5" /> Usage Analytics
          </h3>
          <p className="text-sm text-muted-foreground">Detailed usage reports and cost analysis</p>
        </Card>
      </div>
    </div>
  );
}
