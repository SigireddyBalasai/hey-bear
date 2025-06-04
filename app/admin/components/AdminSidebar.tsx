'use client';

import React, { useEffect, useState } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Activity,
  BarChart3,
  ChevronRight,
  Database,
  Download,
  HelpCircle,
  Home,
  Phone,
  Settings,
  Users,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarLinkProps {
  readonly href: string;
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly active: boolean;
  readonly badge?: string | number;
}

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
  const [userCount, setUserCount] = useState<string | number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Use a fixed demo value instead of Math.random for consistency
    setUserCount(348); // Fixed demo value
    setIsLoading(false);
  }, []);

  const links = [
    { href: '/admin', icon: <Home size={18} />, label: 'Overview' },
    {
      href: '/admin/users',
      icon: <Users size={18} />,
      label: 'Users',
      badge: isLoading ? '-' : userCount,
    },
    { href: '/admin/usage', icon: <BarChart3 size={18} />, label: 'Usage Analytics' },
    { href: '/admin/monitoring', icon: <Activity size={18} />, label: 'Monitoring' },
    { href: '/admin/phone-management', icon: <Phone size={18} />, label: 'Phone Numbers' },
    { href: '/admin/database', icon: <Database size={18} />, label: 'Database' },
    { href: '/admin/settings', icon: <Settings size={18} />, label: 'Settings' },
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
