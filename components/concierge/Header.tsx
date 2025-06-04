import { useEffect, useState } from 'react';

import Link from 'next/link';

import { ChevronDown, LogOut, Settings, Shield } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createClient } from '@/utils/supabase/client';

interface HeaderProps {
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  } | null;
  handleSignOut: () => void;
}

export function Header({ user, handleSignOut }: HeaderProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        // Fetch user record to check admin status
        const { data: userData, error: userDataError } = await supabase

          .from('users')
          .select('is_admin')
          .eq('auth_user_id', user.id)
          .single();

        if (userDataError) {
          setIsAdmin(false);
        } else {
          setIsAdmin(userData.is_admin ?? false);
        }
      }
    };

    checkAdminStatus();
  }, [user, supabase]);

  // Get user initials for avatar
  const userInitials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'U';

  return (
    <header className="mb-8 flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">No-Show</h1>
        <p className="text-muted-foreground">Manage your no-show</p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 hover:bg-accent hover:text-accent-foreground"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src="" alt={user?.email ?? 'User'} />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
            <span>{user?.email ?? 'User'}</span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <Link href="/dashboard" className="flex w-full cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Interaction Dashboard</span>
            </Link>
          </DropdownMenuItem>

          {isAdmin && (
            <DropdownMenuItem asChild>
              <Link href="/admin" className="flex w-full cursor-pointer">
                <Shield className="mr-2 h-4 w-4" />
                <span>Admin Dashboard</span>
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
