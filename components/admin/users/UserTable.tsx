import { UserRow } from './UserRow';

import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { UserData } from '@/types/auth.types';


interface UserTableProps {
  users: UserData[];
  onDelete: (user: UserData) => void;
}

export function UserTable({ users, onDelete }: UserTableProps) {
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
