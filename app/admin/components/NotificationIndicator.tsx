import React, { useState, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from 'date-fns';
import type { AdminNotification } from '@/app/admin/utils/notifications';
import { getAdminNotifications, markNotificationAsRead } from '@/app/admin/utils/notifications';

interface NotificationIndicatorProps {
  userId: string;
}

export function NotificationIndicator({ userId }: NotificationIndicatorProps) {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    const data = await getAdminNotifications(userId);
    setNotifications(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadNotifications();
  }, [userId, loadNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    const success = await markNotificationAsRead(notificationId);
    if (success) {
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, read: true }
            : n
        )
      );
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        {loading ? (
          <DropdownMenuItem disabled>Loading notifications...</DropdownMenuItem>
        ) : notifications.length === 0 ? (
          <DropdownMenuItem disabled className="text-xs text-muted-foreground">
            No notifications
          </DropdownMenuItem>
        ) : (
          <>
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start gap-1 p-3 ${notification.read ? 'opacity-70' : ''}`}
                onClick={() => !notification.read && handleMarkAsRead(notification.id)}
              >
                <div className="flex items-center gap-2 w-full">
                  <span className={`text-sm font-medium ${getTypeColor(notification.type)}`}>
                    {notification.title}
                  </span>
                  {!notification.read && (
                    <span className="ml-auto flex h-2 w-2 rounded-full bg-blue-600" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{notification.message}</p>
                <span className="text-[10px] text-muted-foreground">
                  {notification.created_at ? formatDistanceToNow(new Date(notification.created_at as string), { addSuffix: true }) : 'Date not available'}
                </span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center text-xs text-muted-foreground" asChild>
              <a href="/admin/notifications">View all notifications</a>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getTypeColor(type: AdminNotification['type']) {
  switch (type) {
    case 'error':
      return 'text-red-600';
    case 'warning':
      return 'text-yellow-600';
    case 'success':
      return 'text-green-600';
    default:
      return 'text-blue-600';
  }
}
