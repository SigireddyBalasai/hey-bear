import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { ChevronDown, LogOut, Settings, Shield } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

interface HeaderProps {
  user: any;
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
          
        if (!userDataError && userData && userData.is_admin) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      }
    };
    
    checkAdminStatus();
  }, [user, supabase]);

  // Get user initials for avatar
  const userInitials = user.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'U';

  return (
    <header className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">No-show</h1>
        <p className="text-muted-foreground">Manage your AI No-show</p>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 hover:bg-accent hover:text-accent-foreground">
            <Avatar className="h-8 w-8">
              <AvatarImage src="" alt={user.email} />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
            <span>{user.email}</span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem asChild>
            <Link href="/dashboard" className="flex w-full cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
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