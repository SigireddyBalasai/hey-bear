import { Edit, Mail, MessageSquare, MoreHorizontal, Shield, Trash2, User } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { AdminUserRowProps } from '@/types/admin.types';
import type { UserData } from '@/types/auth.types';

import { getInitials, getStatusBadgeContent, getStatusBadgeVariant } from './utils';

export function UserRow({ user, onDelete }: AdminUserRowProps) {
  return (
    <tr>
      <td>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border">
            <AvatarImage src="" alt={user.full_name} />
            <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{user.full_name ?? 'Unnamed User'}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" /> {user.email ?? 'No email'}
            </div>
          </div>
        </div>
      </td>
      <td>
        <Badge variant={getStatusBadgeVariant(user.status) as 'default' | 'secondary' | 'outline'}>
          {getStatusBadgeContent(user.status)}
        </Badge>
      </td>
      <td>
        <Badge variant="outline" className="capitalize">
          {user.subscription_plan ?? 'No plan'}
        </Badge>
      </td>
      <td>{user.total_interactions?.toLocaleString() ?? '0'}</td>
      <td>{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</td>
      <td>{user.last_active ? new Date(user.last_active).toLocaleDateString() : 'Never'}</td>
      <td className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              className="gap-2"
              onClick={() => {
                window.location.href = `/admin/user/${user.id}`;
              }}
            >
              <User className="h-4 w-4" /> View Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2">
              <MessageSquare className="h-4 w-4" /> View Conversations
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2">
              <Edit className="h-4 w-4" /> Edit User
            </DropdownMenuItem>
            {user.status === 'active' ? (
              <DropdownMenuItem className="gap-2 text-amber-600">
                <Shield className="h-4 w-4" /> Deactivate
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem className="gap-2 text-green-600">
                <Shield className="h-4 w-4" /> Activate
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 text-destructive focus:text-destructive"
              onClick={() => onDelete(user)}
            >
              <Trash2 className="h-4 w-4" /> Delete User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
