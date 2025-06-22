'use client';

import { useEffect, useState } from 'react';

import { ImportTwilioButton } from '@/components/admin/import-twilio-button';
import { PhoneNumbersTable } from '@/components/admin/phone-numbers-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PhoneNumber {
  id: string;
  phone_number: string;
  friendly_name: string | null;
  capabilities: Record<string, unknown> | null;
  created_at: string;
  assigned_to: string | null;
  assigned_at: string | null;
  is_active: boolean;
  twilio_sid: string;
  is_assigned: boolean;
  assistant_id: string | null;
  status: string;
  country: string;
}

function PhoneNumbersLoading() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Phone Numbers Management</CardTitle>
        <div className="h-10 w-40 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={`loading-row-${i + 1}`} className="h-12 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminPhoneNumbersSection() {
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPhoneNumbers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/phone-numbers');
      const result = (await response.json()) as {
        success: boolean;
        data?: unknown[];
        error?: string;
      };

      if (result.success) {
        setPhoneNumbers((result.data as PhoneNumber[]) ?? []);
      } else {
        setError(result.error ?? 'Failed to load phone numbers');
      }
    } catch {
      setError('Failed to load phone numbers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPhoneNumbers();
  }, []);

  if (loading) {
    return <PhoneNumbersLoading />;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Phone Numbers Management</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-destructive">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Phone Numbers Management</CardTitle>
        <ImportTwilioButton />
      </CardHeader>
      <CardContent>
        <PhoneNumbersTable phoneNumbers={phoneNumbers} />
      </CardContent>
    </Card>
  );
}
