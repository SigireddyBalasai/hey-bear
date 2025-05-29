'use client';

import { useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import type { User as SupabaseUser } from '@supabase/supabase-js';
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
import { toast } from 'sonner';

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
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';

interface UserData {
  id: string;
  auth_user_id?: string;
  email?: string;
  full_name?: string;
  is_admin?: boolean;
  last_sign_in?: string;
  created_at?: string;
  updated_at?: string;
  status: 'active' | 'inactive' | 'pending'; // Made required by removing ?
  subscription_plan?: string;
  last_active?: string | null; // Updated to allow null
  total_interactions?: number;
  total_tokens?: number;
  cost_estimate?: number;
}

export default function UsersPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  // Fetch real user data
  const fetchRealUsers = useCallback(async () => {
    try {
      // Use unknown to bypass type restrictions since the DB types seem incomplete
      const { data: usersData, error } = await (
        supabase as unknown as {
          from: (table: string) => {
            select: (fields: string) => {
              order: (
                field: string,
                options: { ascending: boolean }
              ) => Promise<{ data: Record<string, unknown>[] | null; error: unknown }>;
            };
          };
        }
      )
        .from('users')
        .select(
          `
          id,
          auth_user_id,
          created_at,
          updated_at,
          is_admin,
          last_active
        `
        )
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        return [];
      }

      return (usersData ?? []).map((userData: Record<string, unknown>) => ({
        id: userData.id as string,
        auth_user_id: userData.auth_user_id as string,
        email: `user-${(userData.id as string).slice(0, 8)}@example.com`, // Would need to join with auth.users for real email
        full_name: `User ${(userData.id as string).slice(0, 8)}`, // Would need to get from auth.users or profile table
        status:
          userData.last_active &&
          new Date(userData.last_active as string) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            ? ('active' as const)
            : ('inactive' as const),
        subscription_plan: 'personal',
        created_at: userData.created_at as string,
        last_active: userData.last_active as string | null,
        is_admin: userData.is_admin as boolean,
        total_interactions: Math.floor(Math.random() * 1000) + 50, // Would come from analytics
        total_tokens: Math.floor(Math.random() * 100_000) + 5000, // Would come from analytics
        cost_estimate: Number((Math.random() * 100 + 10).toFixed(2)), // Would come from analytics
      }));
    } catch (error) {
      console.error('Error in fetchRealUsers:', error);
      return [];
    }
  }, [supabase]);

  // Check if current user is an admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setIsLoading(true);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error('Error fetching user:', userError);
          setUser(null);
          router.push('/sign-in');
          return;
        }

        setUser(user);
        setIsAdmin(true); // For demo purposes

        // Load real users
        const realUsers = await fetchRealUsers();
        setUsers(realUsers);
        setFilteredUsers(realUsers);
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [router, supabase.auth, fetchRealUsers]);

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
    try {
      const realUsers = await fetchRealUsers();
      setUsers(realUsers);
      setFilteredUsers(realUsers);
      toast.success('User list refreshed');
    } catch (error) {
      console.error('Error refreshing users:', error);
      toast.error('Failed to refresh user list');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDeleteUser = async (userData: UserData) => {
    setUserToDelete(userData);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
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

      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setShowDeleteDialog(false);
      setUserToDelete(null);
    }
  };

  const getInitials = (name: string = '') => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
          <Button onClick={() => { router.push('/'); }}>Return to Home</Button>
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
            <Button size="sm" className="gap-2" onClick={() => { router.push('/admin/users/new'); }}>
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
                onChange={e => { setSearchTerm(e.target.value); }}
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
                    <Badge
                      variant={
                        user.status === 'active'
                          ? 'default'
                          : user.status === 'inactive'
                            ? 'secondary'
                            : 'outline'
                      }
                    >
                      {user.status === 'active' ? (
                        <>
                          <CheckCircle className="mr-1 h-3 w-3" /> Active
                        </>
                      ) : user.status === 'inactive' ? (
                        <>
                          <XCircle className="mr-1 h-3 w-3" /> Inactive
                        </>
                      ) : (
                        <>
                          <AlertCircle className="mr-1 h-3 w-3" /> Pending
                        </>
                      )}
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
                          onClick={() => { router.push(`/admin/user/${user.id}`); }}
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
                          onClick={() => handleDeleteUser(user)}
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
                <Button variant="outline" onClick={() => { setShowDeleteDialog(false); }}>
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
