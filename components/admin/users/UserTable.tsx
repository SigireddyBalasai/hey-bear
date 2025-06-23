import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { AdminUserTableProps } from '@/types/admin.types';
import type { UserData } from '@/types/auth.types';

import { UserRow } from './UserRow';

export function UserTable({ users, onDelete }: AdminUserTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead>Messages</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead>Last Active</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map(user => (
          <UserRow key={user.id} user={user} onDelete={onDelete} />
        ))}
      </TableBody>
    </Table>
  );
}
