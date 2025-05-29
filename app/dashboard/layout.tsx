import React from 'react';

import { DataProvider } from '@/components/dashboard/DataContext';

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <DataProvider>{children}</DataProvider>;
}
