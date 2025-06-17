import { Trash2 } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { UserData } from '@/types/auth.types';

import { getInitials } from './utils';

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserData | null;
  onConfirm: () => void;
}

export function DeleteUserDialog({ open, onOpenChange, user, onConfirm }: DeleteUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this user? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-4 py-4">
          <Avatar className="h-10 w-10 border">
            <AvatarImage src="" alt={user?.full_name} />
            <AvatarFallback>{getInitials(user?.full_name)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{user?.full_name}</div>
            <div className="text-sm text-muted-foreground">{user?.email}</div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
