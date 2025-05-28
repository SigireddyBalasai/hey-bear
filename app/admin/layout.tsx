import type { Metadata } from 'next';
import React from 'react';
export const metadata: Metadata = {
  title: 'Admin Dashboard | Hey Bear',
  description: 'Admin dashboard for Hey Bear application',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
