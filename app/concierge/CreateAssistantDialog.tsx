
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from 'lucide-react';

type CreateAssistantDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  newAssistantName: string;
  setNewAssistantName: (name: string) => void;
  newAssistantDescription: string;
  setNewAssistantDescription: (description: string) => void;
  handleCreateAssistant: () => void;
  isCreating: boolean;
};

export function CreateAssistantDialog({
  open,
  setOpen,
  newAssistantName,
  setNewAssistantName,
  newAssistantDescription,
  setNewAssistantDescription,
  handleCreateAssistant,
  isCreating
}: CreateAssistantDialogProps) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New concierge</DialogTitle>
          <DialogDescription>
            Give your concierge a name and description
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="name"
              placeholder="e.g., Research concierge"
              value={newAssistantName}
              onChange={(e) => setNewAssistantName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              placeholder="What can this concierge help with?"
              value={newAssistantDescription}
              onChange={(e) => setNewAssistantDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateAssistant} disabled={isCreating}>
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}