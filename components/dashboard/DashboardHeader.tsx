'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import React from 'react';



import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { DashboardAssistant } from '@/types/assistant.types';

interface DashboardHeaderProps {
  specificAssistant: DashboardAssistant | null;
  assistantName: string;
  dateRange: string;
}

export function DashboardHeader({
  specificAssistant,
  assistantName,
  dateRange,
}: DashboardHeaderProps) {
  return (
    <>
      <div className="mb-6">
        <Link href="/Concierge">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            My No-shows
          </Button>
        </Link>
      </div>

      {specificAssistant && (
        <div className="mb-6 flex items-center justify-end">
          <div className="text-right">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              Dashboard - {specificAssistant.name}
              <Badge variant="outline">{specificAssistant.name}</Badge>
            </h2>
            <p className="text-gray-500">
              Analytics for {assistantName} • {dateRange}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
