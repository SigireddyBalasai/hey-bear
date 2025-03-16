"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { fetchAllUsers } from './utils/adminUtils';
import { 
  BarChart3, 
  CreditCard, 
  Download, 
  Home, 
  Settings, 
  Users,
  MessageSquare,
  HelpCircle,
  ChevronRight,
  Phone
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  badge?: number | string;
}

function SidebarLink({ href, icon, label, active, badge }: SidebarLinkProps) {
  return (
    <Link href={href} passHref>
      <Button
        variant={active ? "secondary" : "ghost"}
        className={cn(
          "w-full justify-start relative transition-all",
          active ? 'font-medium' : ''
        )}
      >
        <span className="flex items-center">
          {icon}
          <span className="ml-2">{label}</span>
        </span>
        
        {badge && (
          <span className={cn(
            "ml-auto text-xs rounded-full px-2 py-0.5",
            active 
              ? "bg-primary/20 text-primary" 
              : "bg-muted text-muted-foreground"
          )}>
            {badge}
          </span>
        )}
        
        {active && (
          <ChevronRight className="ml-auto h-4 w-4 opacity-70" />
        )}
      </Button>
    </Link>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [userCount, setUserCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUserCount = async () => {
      try {
        const users = await fetchAllUsers();
        setUserCount(users.length);
      } catch (error) {
        console.error('Error fetching user count for sidebar:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getUserCount();
  }, []);

  const links = [
    { href: '/admin', icon: <Home size={18} />, label: 'Overview' },
    { href: '/admin/users', icon: <Users size={18} />, label: 'Users', badge: isLoading ? '...' : userCount || 0 },
    { href: '/admin/usage', icon: <BarChart3 size={18} />, label: 'Usage Analytics' },
    { href: '/admin/conversations', icon: <MessageSquare size={18} />, label: 'Conversations' },
    { href: '/admin/billing', icon: <CreditCard size={18} />, label: 'Billing' },
    { href: '/admin/settings', icon: <Settings size={18} />, label: 'Settings' },
    { href: '/admin/phone-management', icon: <Phone size={18} />, label: 'Phone Numbers' },
  ];

  return (
    <div className="w-64 border-r min-h-screen p-6 bg-card flex flex-col">
      <div className="mb-8">
        <h1 className="text-xl font-bold mb-1">Hey Bear Admin</h1>
        <p className="text-sm text-muted-foreground">Management Dashboard</p>
      </div>
      
      <nav className="space-y-1 mb-8">
        {links.map((link) => (
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
      
      <div className="mt-auto pt-4 border-t">
        <div className="flex items-center text-xs text-muted-foreground mb-2">
          <HelpCircle size={14} className="mr-1" />
          <span>Data Quality</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Some visualizations use estimated data. Hover over charts for data source info.
        </p>
      </div>
    </div>
  );
}
