import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>Please log in to access your No-Show </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button asChild size="lg" className="w-full">
            <Link href="/sign-in">Login</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link href="/sign-up">Create Account</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
