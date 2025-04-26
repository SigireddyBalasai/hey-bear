'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function conciergeButton() {
  const router = useRouter();

  return (
    <Button onClick={() => router.push('/Concierge')}>
      Go to No-Shows
    </Button>
  );
}
