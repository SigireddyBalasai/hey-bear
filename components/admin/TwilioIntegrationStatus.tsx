'use client';

import { useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { AlertTriangle, Phone, RefreshCw, Settings } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/utils/supabase/client';

// API Response interfaces
interface TwilioConnectionResponse {
  success?: boolean;
  error?: string;
}

// Helper functions to extract nested ternaries
const getStatusBackgroundColor = (status: 'loading' | 'success' | 'warning' | 'error'): string => {
  switch (status) {
    case 'success': {
      return 'bg-green-100';
    }
    case 'warning': {
      return 'bg-amber-100';
    }
    case 'error': {
      return 'bg-red-100';
    }
    default: {
      return 'bg-gray-100';
    }
  }
};

const getStatusIconColor = (status: 'loading' | 'success' | 'warning' | 'error'): string => {
  switch (status) {
    case 'success': {
      return 'text-green-600';
    }
    case 'warning': {
      return 'text-amber-600';
    }
    case 'error': {
      return 'text-red-600';
    }
    default: {
      return 'text-gray-600';
    }
  }
};

const getStatusBadgeVariant = (
  status: 'loading' | 'success' | 'warning' | 'error'
): 'default' | 'destructive' | 'outline' | 'secondary' => {
  switch (status) {
    case 'success': {
      return 'secondary';
    }
    case 'warning': {
      return 'outline';
    }
    case 'error': {
      return 'destructive';
    }
    default: {
      return 'default';
    }
  }
};

const getStatusBadgeClass = (status: 'loading' | 'success' | 'warning' | 'error'): string => {
  switch (status) {
    case 'success': {
      return 'bg-green-100 text-green-800';
    }
    case 'warning': {
      return 'bg-yellow-100 text-yellow-800';
    }
    case 'error': {
      return '';
    }
    default: {
      return '';
    }
  }
};

const getStatusLabel = (status: 'loading' | 'success' | 'warning' | 'error'): string => {
  switch (status) {
    case 'loading': {
      return 'Checking...';
    }
    case 'success': {
      return 'Connected';
    }
    case 'warning': {
      return 'Setup Required';
    }
    case 'error': {
      return 'Connection Error';
    }
    default: {
      return '';
    }
  }
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

      // Check Twilio API connection
      const response = await fetch('/api/twilio/test-connection');
      const connectionData = (await response.json()) as TwilioConnectionResponse;

      // Determine status based on API connection and numbers
      if (!connectionData.success) {
        setStatus('error');
      } else if (total === 0) {
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
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`rounded-full p-3 ${getStatusBackgroundColor(status)}`}>
              <Phone className={`h-6 w-6 ${getStatusIconColor(status)}`} />
            </div>

            <div>
              <h3 className="text-lg font-medium">Twilio Integration</h3>
              <div className="mt-1 flex items-center gap-2">
                <Badge
                  variant={getStatusBadgeVariant(status)}
                  className={getStatusBadgeClass(status)}
                >
                  {getStatusLabel(status)}
                </Badge>

                {status === 'success' && (
                  <span className="text-sm text-muted-foreground">
                    {numbers.assigned}/{numbers.total} numbers assigned
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={checkTwilioStatus} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                router.push('/admin/phone-management');
              }}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {status === 'warning' && (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="font-medium">Setup Required</p>
                <p className="mt-1 text-sm">
                  No phone numbers found. Add phone numbers to start using SMS capabilities.
                </p>
              </div>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
              <div>
                <p className="font-medium">Connection Error</p>
                <p className="mt-1 text-sm">
                  Unable to connect to Twilio. Check your API credentials and try again.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
