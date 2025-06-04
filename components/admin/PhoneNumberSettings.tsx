'use client';

import { useEffect, useState } from 'react';

import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  EyeIcon,
  EyeOffIcon,
  Key,
  RefreshCw,
  Save,
  Settings,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

type TwilioSettings = {
  accountSid: string;
  authToken: string;
  webhookUrl: string;
  webhookEnabled: boolean;
  smsEnabled: boolean;
  voiceEnabled: boolean;
};

// API Response interfaces
interface TwilioSettingsResponse {
  error?: string;
  settings?: TwilioSettings;
}

interface SaveSettingsResponse {
  error?: string;
  success?: boolean;
  message?: string;
}

interface TestConnectionResponse {
  error?: string;
  success?: boolean;
  accountName?: string;
}

export function PhoneNumberSettings() {
  const [settings, setSettings] = useState<TwilioSettings>({
    accountSid: '',
    authToken: '',
    webhookUrl: '',
    webhookEnabled: true,
    smsEnabled: true,
    voiceEnabled: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showAuthToken, setShowAuthToken] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Fetching Twilio settings...');
      const response = await fetch('/api/twilio/settings');

      if (!response.ok) {
        const errorData = (await response.json()) as TwilioSettingsResponse;
        throw new Error(errorData.error ?? `Error ${response.status}: Failed to load settings`);
      }

      const data = (await response.json()) as TwilioSettingsResponse;
      if (data.settings) {
        console.log('Settings loaded successfully');
        setSettings(data.settings);
      } else {
        console.log('No settings returned');
        throw new Error('No settings data received');
      }
    } catch (error) {
      console.error('Error loading Twilio settings:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      toast.error('Failed to load Twilio settings');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Validate settings
      if (!settings.accountSid || !settings.authToken) {
        toast.error('Account SID and Auth Token are required');
        return;
      }

      const response = await fetch('/api/twilio/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as SaveSettingsResponse;
        throw new Error(errorData.error ?? 'Failed to save settings');
      }

      toast.success('Twilio settings saved successfully');
      setTestResult(null); // Clear previous test result after saving new settings
    } catch (error) {
      console.error('Error saving Twilio settings:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save Twilio settings');
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const response = await fetch('/api/twilio/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountSid: settings.accountSid,
          authToken: settings.authToken,
        }),
      });

      const data = (await response.json()) as TestConnectionResponse;

      if (response.ok && data.success) {
        setTestResult({
          success: true,
          message: `Connected successfully! Account: ${data.accountName ?? 'Verified'}`,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error ?? 'Failed to connect to Twilio API',
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to connect to Twilio API',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="w-full shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <span>Twilio API Configuration</span>
        </CardTitle>
        <CardDescription>
          Configure your Twilio API credentials for phone number management
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Settings</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <div>{error}</div>
              <Button variant="outline" size="sm" onClick={loadSettings} className="ml-2">
                <RefreshCw className="mr-1 h-3.5 w-3.5" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div className="py-6 text-center">
            <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-muted-foreground/50" />
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="accountSid">Account SID</Label>
                <Input
                  id="accountSid"
                  value={settings.accountSid}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setSettings({ ...settings, accountSid: e.target.value });
                  }}
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="mt-1.5 font-mono"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Find this on your Twilio dashboard under Account Info
                </p>
              </div>

              <div>
                <Label htmlFor="authToken" className="flex items-center justify-between">
                  <span>Auth Token</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => {
                      setShowAuthToken(!showAuthToken);
                    }}
                  >
                    {showAuthToken ? (
                      <EyeOffIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                    <span className="sr-only">{showAuthToken ? 'Hide' : 'Show'} auth token</span>
                  </Button>
                </Label>
                <Input
                  id="authToken"
                  type={showAuthToken ? 'text' : 'password'}
                  value={settings.authToken}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setSettings({ ...settings, authToken: e.target.value });
                  }}
                  placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="mt-1.5 font-mono"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Never share or expose your auth token
                </p>
              </div>

              <div>
                <Label htmlFor="webhookUrl">Webhook URL</Label>
                <Input
                  id="webhookUrl"
                  value={settings.webhookUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setSettings({ ...settings, webhookUrl: e.target.value });
                  }}
                  placeholder="https://example.com/api/twilio/webhook"
                  className="mt-1.5 font-mono"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Automatically configured when you purchase phone numbers
                </p>
              </div>

              <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="flex items-center justify-between gap-2 rounded-md border p-3">
                  <div>
                    <Label htmlFor="webhookEnabled" className="mb-1.5 block">
                      Webhooks
                    </Label>
                    <span className="text-sm text-muted-foreground">Enable webhook handling</span>
                  </div>
                  <Switch
                    id="webhookEnabled"
                    checked={settings.webhookEnabled}
                    onCheckedChange={(checked: boolean) => {
                      setSettings({ ...settings, webhookEnabled: checked });
                    }}
                  />
                </div>
                <div className="flex items-center justify-between gap-2 rounded-md border p-3">
                  <div>
                    <Label htmlFor="smsEnabled" className="mb-1.5 block">
                      SMS
                    </Label>
                    <span className="text-sm text-muted-foreground">Enable SMS messaging</span>
                  </div>
                  <Switch
                    id="smsEnabled"
                    checked={settings.smsEnabled}
                    onCheckedChange={(checked: boolean) => {
                      setSettings({ ...settings, smsEnabled: checked });
                    }}
                  />
                </div>
                <div className="flex items-center justify-between gap-2 rounded-md border p-3">
                  <div>
                    <Label htmlFor="voiceEnabled" className="mb-1.5 block">
                      Voice
                    </Label>
                    <span className="text-sm text-muted-foreground">Enable voice calls</span>
                  </div>
                  <Switch
                    id="voiceEnabled"
                    checked={settings.voiceEnabled}
                    onCheckedChange={(checked: boolean) => {
                      setSettings({ ...settings, voiceEnabled: checked });
                    }}
                  />
                </div>
              </div>
            </div>

            {testResult && (
              <div
                className={`rounded-md border p-4 ${
                  testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start gap-2">
                  {testResult.success ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <h4
                      className={`font-medium ${
                        testResult.success ? 'text-green-800' : 'text-red-800'
                      }`}
                    >
                      {testResult.success ? 'Connection Successful' : 'Connection Failed'}
                    </h4>
                    <p
                      className={`text-sm ${
                        testResult.success ? 'text-green-700' : 'text-red-700'
                      }`}
                    >
                      {testResult.message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Alert className="border-yellow-300 bg-yellow-50 text-yellow-800 [&>svg]:text-yellow-600">
              <Key className="h-4 w-4" />
              <AlertTitle>Important: API Credentials</AlertTitle>
              <AlertDescription>
                Your Twilio API credentials must be added to your server environment variables for
                proper functionality. Changes here will only take effect after restarting the
                server.
              </AlertDescription>
            </Alert>

            <Separator className="my-4" />

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="security">
                <AccordionTrigger className="text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Security Recommendations
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pt-2 text-sm text-muted-foreground">
                  <p>
                    Keep your Auth Token secure. Never share it or expose it in client-side code.
                  </p>
                  <p>
                    Enable Twilio's request validation for webhooks to verify that incoming requests
                    are from Twilio.
                  </p>
                  <p>
                    For production use, store credentials in environment variables or a secure
                    vault.
                  </p>
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open('https://www.twilio.com/docs/usage/security', '_blank')
                      }
                    >
                      <ExternalLink className="mr-1 h-3.5 w-3.5" />
                      Twilio Security Documentation
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </>
        )}
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-4">
        <Button
          variant="outline"
          disabled={
            isTesting || !settings.accountSid || !settings.authToken || isLoading || !!error
          }
          onClick={testConnection}
        >
          {isTesting ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Test Connection
        </Button>
        <Button
          onClick={saveSettings}
          disabled={isSaving || !settings.accountSid || !settings.authToken || isLoading || !!error}
        >
          {isSaving ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Settings
        </Button>
      </CardFooter>
    </Card>
  );
}
