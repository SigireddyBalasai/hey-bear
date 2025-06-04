'use client';

import { useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { AlertTriangle, CheckCircle, Phone, RefreshCw, Settings } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { createClient } from '@/utils/supabase/client';

// Helper functions to reduce complexity and nested ternaries
const getStatusBorderClass = (status: string) => {
  switch (status) {
    case 'success': {
      return 'border-l-green-500';
    }
    case 'warning': {
      return 'border-l-amber-500';
    }
    case 'error': {
      return 'border-l-red-500';
    }
    default: {
      return 'border-l-gray-300';
    }
  }
};

const getStatusBadge = (status: string) => {
  if (status === 'loading') {
    return (
      <Badge variant="outline" className="ml-2">
        Checking...
      </Badge>
    );
  }
  if (status === 'success') {
    return (
      <Badge variant="outline" className="ml-2 bg-green-100 text-green-800">
        Active
      </Badge>
    );
  }
  if (status === 'warning') {
    return (
      <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800">
        Setup Needed
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="ml-2 bg-red-100 text-red-800">
      Error
    </Badge>
  );
};

const getStatusIcon = (status: string) => {
  if (status === 'success') {
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  }
  if (status === 'warning') {
    return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  }
  if (status === 'error') {
    return <AlertTriangle className="h-4 w-4 text-red-500" />;
  }
  return null;
};

const getStatusMessage = (status: string, numbers: { total: number; assigned: number }) => {
  if (status === 'success') {
    return 'Integration is active and working';
  }
  if (status === 'warning') {
    return numbers.total === 0
      ? 'No phone numbers added to the system'
      : 'No phone numbers assigned to No-show';
  }
  if (status === 'error') {
    return 'Failed to check integration status';
  }
  return 'Checking integration status...';
};

export function TwilioIntegrationStatus() {
  const [status, setStatus] = useState<'loading' | 'success' | 'warning' | 'error'>('loading');
  const [numbers, setNumbers] = useState({ total: 0, assigned: 0 });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const checkTwilioStatus = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Get phone numbers data
      const { data: phoneNumbers, error } = await supabase
        .from('phone_numbers')
        .select('id, is_assigned');

      if (error) throw error;

      const total = phoneNumbers.length || 0;
      const assigned = phoneNumbers.filter(n => n.is_assigned).length || 0;

      setNumbers({ total, assigned });

      // Determine status based on numbers
      if (total === 0) {
        setStatus('warning');
      } else if (assigned === 0) {
        setStatus('warning');
      } else {
        setStatus('success');
      }
    } catch (error) {
      console.error('Error checking Twilio status:', error);
      setStatus('error');
    } finally {
      setIsRefreshing(false);
    }
  }, [supabase]);

  useEffect(() => {
    void checkTwilioStatus();
  }, [checkTwilioStatus]);

  return (
    <Card className={`overflow-hidden border-l-4 ${getStatusBorderClass(status)}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Twilio Integration</h3>
              {getStatusBadge(status)}
            </div>
            <div className="space-y-1 text-sm">
              <div className="text-muted-foreground">
                {numbers.total} phone number{numbers.total === 1 ? '' : 's'} ({numbers.assigned}{' '}
                assigned)
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(status)}
                <span className="text-sm">{getStatusMessage(status, numbers)}</span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={checkTwilioStatus}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
      </CardContent>
      <CardFooter className="mt-4 flex justify-end border-t p-4 pt-0">
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => {
            router.push('/admin/phone-management');
          }}
        >
          <Settings className="h-3.5 w-3.5" />
          Manage Phone Numbers
        </Button>
      </CardFooter>
    </Card>
  );
}
