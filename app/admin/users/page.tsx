"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Loading } from '../../Concierge/Loading';
import { 
  Edit,
  Trash2,
  UserPlus,
  RefreshCw,
  Download,
  CheckCircle,
  XCircle,
  User,
  MessageSquare,
  Calendar,
  Mail,
  Search,
  MoreHorizontal,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdminSidebar } from '../AdminSidebar';
import { AdminHeader } from '../AdminHeader';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { fetchAllUsers } from '../utils/adminUtils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Tables } from '@/lib/db.types';

interface UserData extends Partial<Tables<'users'>> {
  email?: string;
  full_name?: string;
  last_sign_in?: string;
  plans?: {
    name: string;
    description: string;
  };
  userusage?: {
    interactions_used: number;
    assistants_used: number;
    token_usage: number;
    cost_estimate: number;
  };
  status?: 'active' | 'inactive' | 'pending';
}

export default function UsersPage() {
  const [user, setUser] = useState<any>(null);
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

  // Check if current user is an admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setIsLoading(true);
        
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error('Error fetching user:', userError);
          setUser(null);
          router.push('/sign-in');
          return;
        }
        
        setUser(user);
        
        // Fetch user record to check admin status
        const { data: userData, error: userDataError } = await supabase
          .from('users')
          .select('is_admin')
          .eq('auth_user_id', user.id)
          .single();
          
        if (userDataError || !userData?.is_admin) {
          toast("Access Denied", {
            description: "You don't have permission to access the admin dashboard",
          });
          setIsAdmin(false);
          router.push('/');
          return;
        }
        
        setIsAdmin(true);
        
        // Fetch users
        await fetchUsers();
        
      } catch (error) {
        console.error('Error in checking admin status:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAdminStatus();
  }, []);

  // Fetch all users with their data using utility function
  const fetchUsers = async () => {
    try {
      setIsRefreshing(true);
      
      // Use the utility function from adminUtils instead of direct API call
      const usersData = await fetchAllUsers();
      
      // Process users to add status field based on last_active
      const processedUsers: UserData[] = usersData.map((user: any) => {
        let status: 'active' | 'inactive' | 'pending' = 'inactive';
        
        if (user.last_active) {
          const lastActive = new Date(user.last_active);
          const now = new Date();
          const daysSinceActive = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysSinceActive < 7) {
            status = 'active';
          }
        } else if (user.created_at) {
          const created = new Date(user.created_at);
          const now = new Date();
          const daysSinceCreated = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysSinceCreated < 2) {
            status = 'pending';
          }
        }
        
        return {
          ...user,
          status
        };
      });
      
      setUsers(processedUsers);
      setFilteredUsers(processedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle search and filter changes
  useEffect(() => {
    const filtered = users.filter(user => {
      // Apply search term filter
      const matchesSearch = 
        (user.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      // Apply status filter
      const matchesStatus = 
        statusFilter === 'all' || 
        user.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
    
    setFilteredUsers(filtered);
  }, [searchTerm, statusFilter, users]);

  const handleRefresh = () => {
    fetchUsers();
  };

  const handleDeleteUser = (user: UserData) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      const response = await fetch(`/api/admin/users?id=${userToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      
      setUsers(users.filter(u => u.id !== userToDelete.id));
      setShowDeleteDialog(false);
      setUserToDelete(null);
      
      toast.success(`${userToDelete.full_name || 'User'} has been deleted`);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleUpdateUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: userId,
          is_active: isActive
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user');
      }
      
      // Update local user status
      setUsers(users.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            status: isActive ? 'active' : 'inactive'
          };
        }
        return u;
      }));
      
      toast.success(`User status updated successfully`);
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  // Format date nicely
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get initials for avatar
  const getInitials = (name: string = '') => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || 'U';
  };

  if (isLoading) {
    return <Loading />;
  }
  
  if (!user || !isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="mb-6">You don't have permission to access this page.</p>
          <Button onClick={() => router.push('/')}>Return to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 p-8 overflow-y-auto max-h-screen">
        <AdminHeader user={user} />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage your platform users and access rights</p>
          </div>
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" /> Add New User
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="icon" 
            title="Refresh"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>All Users</CardTitle>
            <CardDescription>
              Showing {filteredUsers.length} out of {users.length} total users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border">
                            <AvatarImage src="" alt={user.full_name} />
                            <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.full_name || 'Unnamed User'}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {user.email || 'No email'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.status === 'active' ? 'default' :
                            user.status === 'inactive' ? 'secondary' : 'outline'
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
                            'Pending'
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.is_admin ? (
                          <Badge variant="outline" className="border-amber-200 bg-amber-100 text-amber-800">
                            <Shield className="mr-1 h-3 w-3" /> Admin
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <User className="mr-1 h-3 w-3" /> User
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                          {user.plans?.name || 'Free'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {formatDate(user.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDate(user.last_active)}
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
                            <DropdownMenuItem className="gap-2" onClick={() => router.push(`/admin/user/${user.id}`)}>
                              <User className="h-4 w-4" /> View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <MessageSquare className="h-4 w-4" /> View Conversations
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <Edit className="h-4 w-4" /> Edit User
                            </DropdownMenuItem>
                            {user.status === 'active' ? (
                              <DropdownMenuItem 
                                className="gap-2 text-amber-600"
                                onClick={() => user.id && handleUpdateUserStatus(user.id, false)}
                              >
                                <XCircle className="h-4 w-4" /> Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                className="gap-2 text-green-600"
                                onClick={() => user.id && handleUpdateUserStatus(user.id, true)}
                              >
                                <CheckCircle className="h-4 w-4" /> Activate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600 gap-2"
                              onClick={() => handleDeleteUser(user)}
                            >
                              <Trash2 className="h-4 w-4" /> Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Search className="h-10 w-10 mb-3 opacity-20" />
                        <p className="text-lg mb-1">No users found</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4">
            <div className="text-sm text-muted-foreground">
              Showing {filteredUsers.length} of {users.length} users
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm" disabled>Next</Button>
            </div>
          </CardFooter>
        </Card>
        
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {userToDelete?.full_name || 'this user'}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex gap-2 items-start">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Warning</p>
                <p className="text-sm text-amber-700">
                  Deleting this user will remove all their No-Show , conversations, and associated data.
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDeleteUser}>
                <Trash2 className="h-4 w-4 mr-2" /> Delete User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
