"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { fetchAllUsers } from '../utils/adminUtils';
import { 
  BarChart3, 
  CreditCard, 
  Download, 
  Home, 
  Settings, 
  Users,
  MessageSquare,
  HelpCircle,
  ChevronRight
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
    { href: '/admin/monitoring', icon: <MessageSquare size={18} />, label: 'System Monitoring' },
    { href: '/admin/billing', icon: <CreditCard size={18} />, label: 'Billing' },
    { href: '/admin/settings', icon: <Settings size={18} />, label: 'Settings' },
  ];

  return (
    <div className="w-64 border-r min-h-screen p-6 bg-card">
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
      
      <div className="rounded-md bg-muted/50 p-4 mt-4">
        <h3 className="text-sm font-medium mb-2">Need help?</h3>
        <p className="text-xs text-muted-foreground mb-4">Check our documentation or contact support for assistance.</p>
        <Button variant="outline" size="sm" className="w-full justify-start border-dashed">
          <HelpCircle size={16} className="mr-2" />
          View Documentation
        </Button>
      </div>
      
      <div className="border-t mt-8 pt-4 space-y-3">
        <Button variant="outline" className="w-full justify-start gap-2">
          <Download size={16} />
          <span>Export Data</span>
        </Button>
        <Button variant="ghost" className="w-full justify-start text-muted-foreground gap-2">
          <HelpCircle size={16} />
          <span>Help & Support</span>
        </Button>
      </div>
    </div>
  );
}
