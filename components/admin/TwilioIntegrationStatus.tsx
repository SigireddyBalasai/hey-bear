"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, AlertTriangle, CheckCircle, RefreshCw, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function TwilioIntegrationStatus() {
  const [status, setStatus] = useState<'loading' | 'success' | 'warning' | 'error'>('loading');
  const [numbers, setNumbers] = useState({ total: 0, assigned: 0 });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkTwilioStatus();
  }, []);

  const checkTwilioStatus = async () => {
    setIsRefreshing(true);
    try {
      // Get phone numbers data
      const { data: phoneNumbers, error } = await supabase
        .from('phone_numbers')
        .select('id, is_assigned');
      
      if (error) throw error;
      
      const total = phoneNumbers?.length || 0;
      const assigned = phoneNumbers?.filter(n => n.is_assigned)?.length || 0;
      
      setNumbers({ total, assigned });
      
      // Check Twilio API connection
      const response = await fetch('/api/twilio/test-connection');
      const connectionData = await response.json();
      
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
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`rounded-full p-3 ${
              status === 'success' ? 'bg-green-100' :
              status === 'warning' ? 'bg-amber-100' :
              status === 'error' ? 'bg-red-100' : 'bg-gray-100'
            }`}>
              <Phone className={`h-6 w-6 ${
                status === 'success' ? 'text-green-600' :
                status === 'warning' ? 'text-amber-600' :
                status === 'error' ? 'text-red-600' : 'text-gray-600'
              }`} />
            </div>
            
            <div>
              <h3 className="text-lg font-medium">Twilio Integration</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={
                  status === 'success' ? "secondary" :
                  status === 'warning' ? "outline" :
                  status === 'error' ? "destructive" : "default"
                } className={
                  status === 'success' ? "bg-green-100 text-green-800" :
                  status === 'warning' ? "bg-yellow-100 text-yellow-800" :
                  status === 'error' ? "" : ""
                }>
                  {status === 'loading' ? 'Checking...' :
                   status === 'success' ? 'Connected' :
                   status === 'warning' ? 'Setup Required' :
                   'Connection Error'}
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
            <Button
              variant="outline"
              size="sm"
              onClick={checkTwilioStatus}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/phone-management')}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {status === 'warning' && (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-medium">Setup Required</p>
                <p className="text-sm mt-1">
                  No phone numbers found. Add phone numbers to start using SMS capabilities.
                </p>
              </div>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
              <div>
                <p className="font-medium">Connection Error</p>
                <p className="text-sm mt-1">
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
