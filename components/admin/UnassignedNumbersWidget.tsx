'use client';

import { useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { AlertTriangle, Phone, RefreshCw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/utils/supabase/client';

export function UnassignedNumbersWidget() {
  const [numbers, setNumbers] = useState<
    Array<{
      id: string;
      phone_number: string;
      is_assigned: boolean | null;
      created_at: string;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const fetchUnassignedNumbers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('phone_numbers')
        .select('*')
        .eq('is_assigned', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setNumbers(data);
    } catch (error) {
      console.error('Error fetching unassigned numbers:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchUnassignedNumbers();
  }, [fetchUnassignedNumbers]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            <span>Unassigned Phone Numbers</span>
          </div>
        </CardTitle>
        <Badge variant={numbers.length > 0 ? 'secondary' : 'outline'}>{numbers.length}</Badge>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-6 text-center">
            <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading numbers...</p>
          </div>
        ) : numbers.length === 0 ? (
          <div className="py-6 text-center">
            <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-amber-500/70" />
            <p className="text-sm text-muted-foreground">No unassigned numbers available.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Purchase new numbers to assign to No-show.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {numbers.slice(0, 5).map(number => (
              <div key={number.id} className="flex items-center justify-between text-sm">
                <span className="font-mono">{number.phone_number}</span>
                <Badge variant="outline" className="text-xs">
                  {new Date(number.created_at).toLocaleDateString()}
                </Badge>
              </div>
            ))}
            {numbers.length > 5 && (
              <p className="pt-2 text-center text-xs text-muted-foreground">
                +{numbers.length - 5} more numbers
              </p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => { router.push('/admin/phone-management'); }}
        >
          {numbers.length > 0 ? 'Assign Numbers' : 'Purchase Numbers'}
        </Button>
      </CardFooter>
    </Card>
  );
}
