"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Loading } from '../../Concierge/Loading';
import { AdminSidebar } from '../AdminSidebar';
import { AdminHeader } from '../AdminHeader';
import { Button } from '@/components/ui/button';
import { PhoneNumberManagement } from '../components/PhoneNumberManagement';
import { TwilioNumbersList } from '../components/TwilioNumbersList';
import { PhoneNumberSettings } from '../components/PhoneNumberSettings';
import { PhoneNumberStats } from '../components/PhoneNumberStats';
import { 
  Phone, 
  ChevronLeft, 
  Settings, 
  Link2, 
  BarChart3,
  ShoppingCart,
  HelpCircle
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from '@/components/ui/separator';

export default function PhoneManagementPage() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [twilioConfigured, setTwilioConfigured] = useState(true);
  const [activeTab, setActiveTab] = useState('manage');
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  
  const router = useRouter();
  const supabase = createClient();

  // Check if current user is an admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setIsLoading(true);
        
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error('Error fetching user:', userError);
          setUser(null);
          router.push('/sign-in');
          return;
        }
        
        setUser(user);
        
        // Fetch user record to check admin status
        const { data: userData, error: userDataError } = await supabase
          .from('users')
          .select('is_admin')
          .eq('auth_user_id', user.id)
          .single();
          
        if (userDataError || !userData?.is_admin) {
          setIsAdmin(false);
          router.push('/');
          return;
        }
        
        setIsAdmin(true);
        checkTwilioConfig();
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAdminStatus();
  }, []);

  // Check if Twilio is configured
  const checkTwilioConfig = async () => {
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
  };
  
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
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="mb-6">You don't have permission to access this page.</p>
          <Button onClick={() => router.push('/')}>Return to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 p-8 overflow-y-auto max-h-screen">
        <AdminHeader user={user} />
        
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" className="pl-0" onClick={() => router.push('/admin')}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Button>
            <Separator orientation="vertical" className="mx-4 h-6" />
            <h1 className="text-3xl font-bold flex items-center gap-2">
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
          <TabsList className="mb-6 w-full grid grid-cols-3 sticky top-0 bg-background z-10">
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
            {!twilioConfigured ? (
              <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-medium mb-2">Twilio API Not Configured</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Please configure your Twilio API credentials before managing phone numbers.
                </p>
                <Button onClick={() => setActiveTab('settings')}>
                  Configure API Settings
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <PhoneNumberManagement />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="twilio">
            {!twilioConfigured ? (
              <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-medium mb-2">Twilio API Not Configured</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Please configure your Twilio API credentials to view and manage your Twilio account phone numbers.
                </p>
                <Button onClick={() => setActiveTab('settings')}>
                  Configure API Settings
                </Button>
              </div>
            ) : (
              <TwilioNumbersList />
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
