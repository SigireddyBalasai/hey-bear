'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ConciergeButton() {
  return (
    <Button asChild>
      <Link href="/Concierge">Go to No-show</Link>
    </Button>
  );
}
