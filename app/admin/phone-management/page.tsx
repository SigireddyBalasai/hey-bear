'use client';

import { useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import type { User } from '@supabase/supabase-js';
import { ChevronLeft, HelpCircle, Link2, Phone, Settings } from 'lucide-react';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { PhoneNumberManagement } from '@/components/admin/PhoneNumberManagement';
import { PhoneNumberSettings } from '@/components/admin/PhoneNumberSettings';
import { TwilioNumbersList } from '@/components/admin/TwilioNumbersList';
import { Loading } from '@/components/concierge/Loading';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@/utils/supabase/client';

export default function PhoneManagementPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [twilioConfigured, setTwilioConfigured] = useState(true);
  const [activeTab, setActiveTab] = useState('manage');
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);

  const router = useRouter();
  const supabase = createClient();

  const checkTwilioConfig = useCallback(async () => {
    setIsSettingsLoading(true);
    try {
      console.log('Checking Twilio configuration...');
      const response = await fetch('/api/twilio/settings');

      if (response.ok) {
        const data = await response.json();
        console.log('Twilio settings response:', data.success);

        if (data.success && data.settings) {
          setTwilioConfigured(!!data.settings.accountSid);
        } else {
          setTwilioConfigured(false);
        }
      } else {
        console.error('Failed to fetch Twilio settings:', response.status);
        setTwilioConfigured(false);
      }
    } catch (error) {
      console.error('Error checking Twilio config:', error);
      setTwilioConfigured(false);
    } finally {
      setIsSettingsLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setIsLoading(true);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error('Error fetching user:', userError);
          setUser(null);
          router.push('/sign-in');
          return;
        }

        setUser(user);

        // Fetch user record to check admin status
        const { data: userData, error: userDataError } = await supabase
          .schema('users')
          .from('users')
          .select('is_admin')
          .eq('auth_user_id', user.id)
          .single();

        if (userDataError || !userData.is_admin) {
          setIsAdmin(false);
          router.push('/');
          return;
        }

        setIsAdmin(true);
        await checkTwilioConfig();
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    void checkAdminStatus();
  }, [router, checkTwilioConfig, supabase]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);

    // If Twilio isn't configured and user is not on settings tab, suggest settings configuration
    if (!twilioConfigured && !isSettingsLoading && value !== 'settings') {
      // Immediately redirect to settings tab if Twilio is not configured
      setActiveTab('settings');
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Access Denied</h1>
          <p className="mb-6">You don't have permission to access this page.</p>
          <Button onClick={() => { router.push('/'); }}>Return to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="max-h-screen flex-1 overflow-y-auto p-8">
        <AdminHeader user={user} />

        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" className="pl-0" onClick={() => { router.push('/admin'); }}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to Dashboard
            </Button>
            <Separator orientation="vertical" className="mx-4 h-6" />
            <h1 className="flex items-center gap-2 text-3xl font-bold">
              <Phone className="h-7 w-7" />
              Phone Management
            </h1>
          </div>
        </div>

        {!isSettingsLoading && !twilioConfigured && activeTab !== 'settings' && (
          <Alert className="mb-6 border-amber-500 text-amber-600 [&>svg]:text-amber-600">
            <HelpCircle className="h-4 w-4" />
            <AlertTitle>Twilio API not configured</AlertTitle>
            <AlertDescription>
              Configure your Twilio API credentials to enable phone management functionality.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="sticky top-0 z-10 mb-6 grid w-full grid-cols-3 bg-background">
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Manage Numbers
            </TabsTrigger>
            <TabsTrigger value="twilio" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Twilio Account
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              API Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manage">
            {twilioConfigured ? (
              <div className="space-y-6">
                <PhoneNumberManagement />
              </div>
            ) : (
              <div className="rounded-lg border border-dashed bg-muted/30 py-12 text-center">
                <Settings className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-xl font-medium">Twilio API Not Configured</h3>
                <p className="mx-auto mb-6 max-w-md text-muted-foreground">
                  Please configure your Twilio API credentials before managing phone numbers.
                </p>
                <Button onClick={() => { setActiveTab('settings'); }}>Configure API Settings</Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="twilio">
            {twilioConfigured ? (
              <TwilioNumbersList />
            ) : (
              <div className="rounded-lg border border-dashed bg-muted/30 py-12 text-center">
                <Settings className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-xl font-medium">Twilio API Not Configured</h3>
                <p className="mx-auto mb-6 max-w-md text-muted-foreground">
                  Please configure your Twilio API credentials to view and manage your Twilio
                  account phone numbers.
                </p>
                <Button onClick={() => { setActiveTab('settings'); }}>Configure API Settings</Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings">
            <PhoneNumberSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
