'use client';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { DeleteUserDialog } from '@/components/admin/users/DeleteUserDialog';
import { UsersHeader } from '@/components/admin/users/UsersHeader';
import { UsersSearchAndFilter } from '@/components/admin/users/UsersSearchAndFilter';
import { UserTable } from '@/components/admin/users/UserTable';
import { Loading } from '@/components/concierge/Loading';
import { useAdminAuth } from '@/hooks/useClientAuth';
import { useUserManagement } from '@/hooks/useUserManagement';

export const dynamic = 'force-dynamic';

export default function UsersPage() {
  const { user, isAdmin, isLoading } = useAdminAuth();
  const {
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
  } = useUserManagement();

  if (isLoading) {
    return <Loading />;
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Access Denied</h1>
          <p className="mb-6">You don&apos;t have permission to access this page.</p>
          <button
            className="btn"
            onClick={() => {
              window.location.href = '/';
            }}
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="max-h-screen flex-1 overflow-y-auto p-8">
        <AdminHeader
          user={{
            email: user.email ?? '',
            user_metadata: {
              full_name: (user.user_metadata?.full_name as string) ?? '',
              avatar_url: (user.user_metadata?.avatar_url as string) ?? '',
            },
          }}
        />
        <UsersHeader
          isRefreshing={isRefreshing}
          onRefresh={() => {
            void handleRefresh();
          }}
        />
        <UsersSearchAndFilter
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
        <div className="mb-6">
          <UserTable users={filteredUsers} onDelete={handleDeleteUser} />
        </div>
        <DeleteUserDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          user={userToDelete}
          onConfirm={confirmDelete}
        />
      </div>
    </div>
  );
}
