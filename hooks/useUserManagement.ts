import { useCallback, useEffect, useState } from 'react';

import type { UserData } from '@/types/auth.types';
import { showSuccess, withErrorHandling } from '@/utils/error-handling';
import { createClient } from '@/utils/supabase/client';

export function useUserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);

  const supabase = createClient();

  // Fetch real user data
  const fetchRealUsers = useCallback(async () => {
    const result = await withErrorHandling(
      async () => {
        const { data: authUsers, error } = await supabase.auth.admin.listUsers();
        if (error) throw error;
        const transformedUsers: UserData[] = authUsers.users.map((authUser: any) => ({
          id: authUser.id,
          auth_user_id: authUser.id,
          email: authUser.email || '',
          full_name:
            (authUser.user_metadata?.full_name as string) ||
            (authUser.user_metadata?.name as string) ||
            '',
          is_admin: Boolean(authUser.user_metadata?.is_admin),
          last_sign_in: authUser.last_sign_in_at || '',
          created_at: authUser.created_at,
          updated_at: authUser.updated_at || '',
          status: 'active',
          subscription_plan: (authUser.user_metadata?.subscription_plan as string) || 'free',
          last_active: authUser.last_sign_in_at || '',
          total_interactions: (authUser.user_metadata?.total_interactions as number) || 0,
          total_tokens: (authUser.user_metadata?.total_tokens as number) || 0,
          cost_estimate: (authUser.user_metadata?.cost_estimate as number) || 0,
        }));
        return transformedUsers;
      },
      { toastTitle: 'Failed to fetch users' }
    );
    return result || [];
  }, [supabase]);

  // Load users
  useEffect(() => {
    const loadUsers = async () => {
      const realUsers = await fetchRealUsers();
      setUsers(realUsers);
      setFilteredUsers(realUsers);
    };
    void loadUsers();
  }, [fetchRealUsers]);

  // Filter users
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
      { toastTitle: 'Failed to refresh user list' }
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
      { toastTitle: 'Failed to delete user' }
    );
    setShowDeleteDialog(false);
    setUserToDelete(null);
  };

  return {
    users,
    filteredUsers,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    isRefreshing,
    handleRefresh,
    showDeleteDialog,
    setShowDeleteDialog,
    userToDelete,
    handleDeleteUser,
    confirmDelete,
  };
}
