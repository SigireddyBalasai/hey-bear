'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  AlertCircle,
  CheckCircle,
  Edit,
  Mail,
  MessageSquare,
  MoreHorizontal,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  User,
  UserPlus,
  XCircle,
} from 'lucide-react';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Loading } from '@/components/concierge/Loading';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAdminAuth } from '@/hooks/useAuth';
import { useLoadingState } from '@/hooks/useLoadingState';
import { cn } from '@/lib/utils';
import type { UserData } from '@/types/auth.types';
import { showSuccess, withErrorHandling } from '@/utils/error-handling';
import { createClient } from '@/utils/supabase/client';

// Helper function to get user initials
const getInitials = (name: string = '') => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Helper function to get badge variant for user status
const getStatusBadgeVariant = (status: string) => {
  if (status === 'active') return 'default';
  if (status === 'inactive') return 'secondary';
  return 'outline';
};

// Helper function to get status badge content
const getStatusBadgeContent = (status: string) => {
  if (status === 'active') {
    return (
      <>
        <CheckCircle className="mr-1 h-3 w-3" /> Active
      </>
    );
  }
  if (status === 'inactive') {
    return (
      <>
        <XCircle className="mr-1 h-3 w-3" /> Inactive
      </>
    );
  }
  return (
    <>
      <AlertCircle className="mr-1 h-3 w-3" /> Pending
    </>
  );
};

export default function UsersPage() {
  const { user, isAdmin, isLoading } = useAdminAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const { isLoading: isRefreshing, setIsLoading: setIsRefreshing } = useLoadingState(false);

  const supabase = createClient();

  // Fetch real user data
  const fetchRealUsers = useCallback(async () => {
    const result = await withErrorHandling(
      async () => {
        // Fetch auth users directly from Supabase Auth
        const { data: authUsers, error } = await supabase.auth.admin.listUsers();

        if (error) {
          throw error;
        }

        // Transform auth users to match our UserData interface
        const transformedUsers: UserData[] = authUsers.users.map(authUser => ({
          id: authUser.id,
          auth_user_id: authUser.id,
          email: authUser.email,
          full_name:
            (authUser.user_metadata?.full_name as string) ||
            (authUser.user_metadata?.name as string) ||
            undefined,
          is_admin: Boolean(authUser.user_metadata?.is_admin),
          last_sign_in: authUser.last_sign_in_at,
          created_at: authUser.created_at,
          updated_at: authUser.updated_at,
          status: 'active', // Default to active since these are auth users
          subscription_plan: (authUser.user_metadata?.subscription_plan as string) || 'free',
          last_active: authUser.last_sign_in_at,
          total_interactions: (authUser.user_metadata?.total_interactions as number) || 0,
          total_tokens: (authUser.user_metadata?.total_tokens as number) || 0,
          cost_estimate: (authUser.user_metadata?.cost_estimate as number) || 0,
        }));

        return transformedUsers;
      },
      {
        toastTitle: 'Failed to fetch users',
      }
    );
    return result || [];
  }, [supabase]);

  // Load users when admin auth is complete
  useEffect(() => {
    if (!isLoading && isAdmin && user) {
      const loadUsers = async () => {
        const realUsers = await fetchRealUsers();
        setUsers(realUsers);
        setFilteredUsers(realUsers);
      };
      void loadUsers();
    }
  }, [isLoading, isAdmin, user, fetchRealUsers]);

  // Filter users based on search term and status
  useEffect(() => {
    const filtered = users.filter(user => {
      const matchesSearch =
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ??
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    setFilteredUsers(filtered);
  }, [searchTerm, statusFilter, users]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await withErrorHandling(
      async () => {
        const realUsers = await fetchRealUsers();
        setUsers(realUsers);
        setFilteredUsers(realUsers);
        showSuccess('User list refreshed');
      },
      {
        toastTitle: 'Failed to refresh user list',
      }
    );
    setIsRefreshing(false);
  };

  const handleDeleteUser = (userData: UserData) => {
    setUserToDelete(userData);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (!userToDelete) return;

    withErrorHandling(
      async () => {
        // Remove user from local state
        const updatedUsers = users.filter(u => u.id !== userToDelete.id);
        setUsers(updatedUsers);
        setFilteredUsers(
          updatedUsers.filter(user => {
            const matchesSearch =
              user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ??
              user.email?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
            return matchesSearch && matchesStatus;
          })
        );

        showSuccess('User deleted successfully');
      },
      {
        toastTitle: 'Failed to delete user',
      }
    );
    setShowDeleteDialog(false);
    setUserToDelete(null);
  };

  if (isLoading) {
    return <Loading />;
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Access Denied</h1>
          <p className="mb-6">You don't have permission to access this page.</p>
          <Button
            onClick={() => {
              window.location.href = '/';
            }}
          >
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="max-h-screen flex-1 overflow-y-auto p-8">
        <AdminHeader user={user} />

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
              onClick={() => handleRefresh()}
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

        <div className="mb-6 flex flex-col gap-4 md:flex-row">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                }}
                className="pl-9"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
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
              {filteredUsers.map(user => (
                <TableRow key={user.id}>
                  <TableCell>
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
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(user.status)}>
                      {getStatusBadgeContent(user.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {user.subscription_plan ?? 'No plan'}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.total_interactions?.toLocaleString() ?? '0'}</TableCell>
                  <TableCell>
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {user.last_active ? new Date(user.last_active).toLocaleDateString() : 'Never'}
                  </TableCell>
                  <TableCell className="text-right">
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
                          onClick={() => {
                            handleDeleteUser(user);
                          }}
                        >
                          <Trash2 className="h-4 w-4" /> Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete User</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this user? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-4 py-4">
                <Avatar className="h-10 w-10 border">
                  <AvatarImage src="" alt={userToDelete?.full_name} />
                  <AvatarFallback>{getInitials(userToDelete?.full_name)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{userToDelete?.full_name}</div>
                  <div className="text-sm text-muted-foreground">{userToDelete?.email}</div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteDialog(false);
                  }}
                >
                  Cancel
                </Button>
                <Button variant="destructive" onClick={confirmDelete}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Card>
      </div>
    </div>
  );
}
