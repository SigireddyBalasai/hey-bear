import React from 'react';

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center gap-12">
        {children}
      </div>
    </div>
  );
}
