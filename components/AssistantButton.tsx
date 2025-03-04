'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function AssistantButton() {
  const router = useRouter();

  return (
    <Button onClick={() => router.push('/assistants')}>
      Go to Assistants
    </Button>
  );
}
