'use client';

import React, { useEffect } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { BarChart3, ChevronRight, Download, HelpCircle, Home, Users } from 'lucide-react';

import { fetchAllUsers } from '@/components/admin/utils/adminUtils';
import { Button } from '@/components/ui/button';
import { useLoadingState } from '@/hooks/useLoadingState';
import { cn } from '@/lib/utils';
import { withErrorHandling } from '@/utils/error-handling';
import { createClient } from '@/utils/supabase/client';
import { SidebarLinkProps } from '@/types/admin.types';

function SidebarLink({ href, icon, label, active, badge }: SidebarLinkProps) {
  return (
    <Link href={href} passHref>
      <Button
        variant={active ? 'secondary' : 'ghost'}
        className={cn('relative w-full justify-start transition-all', active ? 'font-medium' : '')}
      >
        <span className="flex items-center">
          {icon}
          <span className="ml-2">{label}</span>
        </span>

        {badge && (
          <span
            className={cn(
              'ml-auto rounded-full px-2 py-0.5 text-xs',
              active ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
            )}
          >
            {badge}
          </span>
        )}

        {active && <ChevronRight className="ml-auto h-4 w-4 opacity-70" />}
      </Button>
    </Link>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [userCount, setUserCount] = React.useState<number | null>(null);
  const { isLoading, setIsLoading } = useLoadingState(true);

  useEffect(() => {
    const getUserCount = async () => {
      await withErrorHandling(
        async () => {
          try {
            // Use fetchAllUsers function to get the users array and its length
            const users = await fetchAllUsers();

            setUserCount(Array.isArray(users) ? users.length : 0);
          } catch (error) {
            // Fallback to direct auth user count if fetchAllUsers fails
            try {
              const supabase = createClient();
              const { data: authUsersData, error } = await supabase.auth.admin.listUsers();

              if (!error && authUsersData?.users) {
                setUserCount(authUsersData.users.length);
              }
            } catch (error_) {
              console.error('Fallback count also failed:', error_);
            }
            throw error; // Re-throw to trigger the error handling
          } finally {
            setIsLoading(false);
          }
        },
        {
          fallbackMessage: 'Failed to fetch user count for sidebar',
          context: 'AdminSidebar',
        }
      );
    };

    void getUserCount();
  }, [setIsLoading]);

  const links = [
    { href: '/admin', icon: <Home size={18} />, label: 'Overview' },
    {
      href: '/admin/users',
      icon: <Users size={18} />,
      label: 'Users',
      badge: isLoading ? '...' : (userCount ?? 0),
    },
    { href: '/admin/usage', icon: <BarChart3 size={18} />, label: 'Usage Analytics' },
  ];

  return (
    <div className="min-h-screen w-64 border-r bg-card p-6">
      <div className="mb-8">
        <h1 className="mb-1 text-xl font-bold">Hey Bear Admin</h1>
        <p className="text-sm text-muted-foreground">Management Dashboard</p>
      </div>

      <nav className="mb-8 space-y-1">
        {links.map(link => (
          <SidebarLink
            key={link.href}
            href={link.href}
            icon={link.icon}
            label={link.label}
            active={pathname === link.href}
            badge={link.badge}
          />
        ))}
      </nav>

      <div className="mt-4 rounded-md bg-muted/50 p-4">
        <h3 className="mb-2 text-sm font-medium">Need help?</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Check our documentation or contact support for assistance.
        </p>
        <Button variant="outline" size="sm" className="w-full justify-start border-dashed">
          <HelpCircle size={16} className="mr-2" />
          View Documentation
        </Button>
      </div>

      <div className="mt-8 space-y-3 border-t pt-4">
        <Button variant="outline" className="w-full justify-start gap-2">
          <Download size={16} />
          <span>Export Data</span>
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground">
          <HelpCircle size={16} />
          <span>Help & Support</span>
        </Button>
      </div>
    </div>
  );
}
