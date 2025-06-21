import { ChevronDown, LogOut, Settings, Shield } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';


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
import type { HeaderProps } from '@/types/ui.types';
import { createClient } from '@/utils/supabase/client';

export function Header({ user }: HeaderProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        // Check admin status using the database role via RPC
        const { data: adminCheck, error } = await supabase.rpc('is_admin');

        if (!error) {
          setIsAdmin(Boolean(adminCheck));
        }
      }
    };

    checkAdminStatus();
  }, [user, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/sign-in');
  };

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
          <DropdownMenuItem asChild>
            <button
              onClick={handleSignOut}
              className="flex w-full cursor-pointer items-center px-2 py-1.5 text-sm text-red-600 hover:bg-accent hover:text-red-600 focus:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
