'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { BarChart3, Bot, MessageSquare } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardAssistant } from '@/types/app.types';
import { getDashboardUrl } from '@/utils/dashboard-urls';
import { handleError } from '@/utils/error-handling';
import { createClient } from '@/utils/supabase/client';

export const AssistantSelection = () => {
  const [assistants, setAssistants] = useState<DashboardAssistant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchAssistants = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          console.error('User not authenticated:', authError);
          return;
        }

        const { data: assistantsData, error: assistantsError } = await supabase
          .from('assistants')
          .select('id, name, created_at')
          .eq('user_id', user.id)
          .order('name');

        if (assistantsError) {
          console.error('Error fetching assistants:', assistantsError);
          handleError(assistantsError, {
            toastTitle: 'Failed to load assistants',
            fallbackMessage: 'There was an error loading your assistants.',
          });
          return;
        }

        setAssistants(assistantsData || []);
      } catch (error) {
        console.error('Error in fetchAssistants:', error);
        handleError(error as Error, {
          toastTitle: 'Failed to load assistants',
          fallbackMessage: 'There was an error loading your assistants.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssistants();
  }, [supabase]);

  const handleAssistantSelect = (assistant: DashboardAssistant) => {
    const url = getDashboardUrl(assistant.name);
    router.push(url);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-gray-500">Loading your assistants...</p>
      </div>
    );
  }

  if (assistants.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
            <Bot className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Assistants Found</h3>
          <p className="text-gray-500 mb-6 max-w-md">
            You haven't created any assistants yet. Create your first assistant to start analyzing
            interactions and usage.
          </p>
          <Link href="/Concierge">
            <Button>Create Your First Assistant</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Select an Assistant</h2>
        <p className="text-gray-600">Choose an assistant to view its analytics and usage data</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {assistants.map(assistant => (
          <Card
            key={assistant.id}
            className="hover:shadow-md transition-shadow cursor-pointer group"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{assistant.name}</CardTitle>
                    <Badge variant="outline" className="mt-1">
                      Active
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2">
                <Button
                  onClick={() => handleAssistantSelect(assistant)}
                  className="flex-1"
                  size="sm"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
                <Link href={`/Concierge/${encodeURIComponent(assistant.name)}`}>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Open Chat
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Link href="/Concierge">
          <Button variant="outline">
            <Bot className="h-4 w-4 mr-2" />
            Manage Assistants
          </Button>
        </Link>
      </div>
    </div>
  );
};
