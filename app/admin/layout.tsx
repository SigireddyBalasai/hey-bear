import React from 'react';

import type { Metadata } from 'next';

// Force dynamic rendering for all admin pages
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Hey Bear',
  description: 'Admin dashboard for Hey Bear application',
};

export default function AdminLayout({ children }: { readonly children: React.ReactNode }) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
