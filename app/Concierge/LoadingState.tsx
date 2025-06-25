"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface LoadingStateProps {
  type: "page" | "auth";
  onNavigateToLogin?: () => void;
}

export function LoadingState({ type, onNavigateToLogin }: LoadingStateProps) {
  if (type === "page") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>
            Please log in to continue using this No-Show
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={onNavigateToLogin}>
            Go to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
