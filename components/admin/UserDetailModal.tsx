'use client';

import { Calendar, Clock, CreditCard, Mail, MessageSquare, User, Zap } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import type { UserDetailModalProps } from '@/types/admin.types';

export function UserDetailModal({ isOpen, onClose, userData }: UserDetailModalProps) {
  if (!userData) return null;

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Details
          </DialogTitle>
          <DialogDescription>Detailed information about this user's activity</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">User Information</h3>
            <div className="grid grid-cols-[20px_1fr] items-center gap-x-2 gap-y-1"></div>
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{userData.users?.full_name ?? 'Unknown'}</span>

            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{userData.users?.email ?? 'No email'}</span>

            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Joined: {formatDate(userData.users?.created_at)}</span>

            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              Last active:{' '}
              {userData.users?.last_active ? formatDate(userData.users.last_active) : 'N/A'}
            </span>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Usage Statistics</h3>
          <div className="grid grid-cols-[20px_1fr] items-center gap-x-2 gap-y-1">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <span>Messages:</span>
              <Badge variant="outline" className="font-mono">
                {userData.message_count ?? 0}
              </Badge>
            </div>

            <Zap className="h-4 w-4 text-muted-foreground" />
            <div>
              <span>Token usage:</span>{' '}
              <span className="font-mono">
                {Number(userData.token_usage ?? 0).toLocaleString()}
              </span>
            </div>

            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <div>
              <span>Cost estimate:</span>{' '}
              <span
                className={`font-mono ${Number(userData.cost_estimate ?? 0) > 1 ? 'font-semibold text-amber-600' : ''}`}
              >
                ${Number(userData.cost_estimate ?? 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
