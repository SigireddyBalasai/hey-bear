"use client";

import React from "react";

import { Bot, ChevronLeft, Paperclip, Phone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AssistantHeaderProps {
  displayName: string;
  assignedPhoneNumber: string | null;
  activeTab: string;
  onBack: () => void;
  onToggleTab: () => void;
}

export function AssistantHeader({
  displayName,
  assignedPhoneNumber,
  activeTab,
  onBack,
  onToggleTab,
}: AssistantHeaderProps) {
  return (
    <div className="flex items-center mb-4 gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={onBack}
        className="hover:bg-muted"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <h1 className="text-2xl font-bold flex-1">
        {displayName}
        {assignedPhoneNumber && (
          <Badge variant="outline" className="ml-2 gap-1 align-middle">
            <Phone className="h-3 w-3" />
            SMS
          </Badge>
        )}
      </h1>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleTab}
              className="shadow-sm hover:bg-accent"
            >
              {activeTab === "chat" ? (
                <>
                  <Paperclip className="h-4 w-4 mr-2" /> Manage Knowledge
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4 mr-2" /> Back to Chat
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {activeTab === "chat" ? "Manage No-Show Files" : "Return to Chat"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
