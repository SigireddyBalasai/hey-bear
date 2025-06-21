'use client';

import { Search } from 'lucide-react';
import React from 'react';


import { Input } from '@/components/ui/input';

interface DashboardSearchProps {
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function DashboardSearch({ searchTerm, onSearchChange }: DashboardSearchProps) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row">
      <div className="relative w-full md:w-64">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
        <Input
          className="pl-8"
          placeholder="Search interactions..."
          value={searchTerm}
          onChange={onSearchChange}
        />
      </div>
    </div>
  );
}
