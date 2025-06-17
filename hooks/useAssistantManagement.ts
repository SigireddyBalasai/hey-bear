'use client';

import { useCallback, useState } from 'react';

import { useRouter } from 'next/navigation';

import type { AssistantRow } from '@/types/assistant.types';
import type { UserState } from '@/types/auth.types';
import type { AssistantWithNonNullableFields, ConciergeFormData } from '@/types/concierge.types';
import { showInfo, showSuccess, withErrorHandling } from '@/utils/error-handling';
import { createClient } from '@/utils/supabase/client';

export function useAssistantManagement() {
  const [user, setUser] = useState<UserState | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [normalizedAssistants, setNormalizedAssistants] = useState<
    AssistantWithNonNullableFields[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<ConciergeFormData>({
    name: '',
    description: '',
    conciergeName: '',
    personality: 'Business Casual',
    businessName: '',
    sharePhoneNumber: false,
    phoneNumber: '',
    selectedPlan: 'personal',
  });

  const router = useRouter();

  // Handle input changes for any field in the form
  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle deleting an assistant
  const handleDeleteAssistant = async (assistantId: string) => {
    await withErrorHandling(
      async () => {
        const assistantToDelete = normalizedAssistants.find(a => a.assistant.id === assistantId);

        if (!assistantToDelete?.assistant.id) {
          throw new Error('Assistant not found');
        }

        const supabase = createClient();

        // Delete from Supabase
        const { error } = await supabase.from('assistants').delete().eq('id', assistantId);

        if (error) {
          throw new Error('Failed to delete assistant from server');
        }

        // Update local state after successful deletion
        setNormalizedAssistants((prev: AssistantWithNonNullableFields[]) =>
          prev.filter((a: AssistantWithNonNullableFields) => a.assistant.id !== assistantId)
        );

        showSuccess('Assistant deleted', `${assistantToDelete.assistant.name} has been removed`);
      },
      {
        toastTitle: 'Error deleting assistant',
        fallbackMessage: 'Something went wrong while deleting the assistant',
      }
    );
  };

  // Placeholder createAssistant handler
  const handleCreateAssistant = async () => {
    // Reset form
    setFormData({
      name: '',
      description: '',
      conciergeName: '',
      personality: 'Business Casual',
      businessName: '',
      sharePhoneNumber: false,
      phoneNumber: '',
      selectedPlan: 'personal',
    });

    // Show placeholder message
    showInfo('Creation pending', 'Assistant creation will be implemented elsewhere');
  };

  // Function to fetch assistants with normalized data from Supabase
  const fetchAssistants = useCallback(async () => {
    setIsLoading(true);

    await withErrorHandling(
      async () => {
        const supabase = createClient();

        // First get the authenticated user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push('/sign-in');
          return;
        }

        // Set user data
        setUser({
          id: user.id,
          user_metadata: {
            name: user.user_metadata?.full_name || user.user_metadata?.name || user.email || '',
            avatar_url: user.user_metadata?.avatar_url || '',
          },
        });

        // Store the auth user ID
        setUserId(user.id);

        // Fetch assistants belonging to this user
        const { data: assistantsData, error: assistantsError } = await supabase
          .from('assistants')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (assistantsError) {
          throw new Error('Failed to fetch assistants from server');
        }

        // Transform the real data from the database
        if (!assistantsData || assistantsData.length === 0) {
          console.log('User has 0 assistants');
          setNormalizedAssistants([]);
        } else {
          const transformedAssistants = assistantsData
            .filter((assistant: AssistantRow | null) => assistant !== null)
            .map((assistant: AssistantRow) => ({
              assistant: {
                ...assistant,
                name: assistant.name || '',
                is_starred: assistant.is_starred ?? false,
              },
              config: {
                description: '',
                business_phone: '',
              },
              subscription: undefined,
              usageLimits: undefined,
              activity: undefined,
              interactions_count: 0,
              last_interaction_at: null,
            })) as AssistantWithNonNullableFields[];

          setNormalizedAssistants(transformedAssistants);
        }
      },
      {
        toastTitle: 'Connection error',
        fallbackMessage: 'Failed to connect to the server',
      }
    );

    setIsLoading(false);
  }, [router]);

  return {
    user,
    userId,
    normalizedAssistants,
    isLoading,
    formData,
    setFormData,
    handleInputChange,
    handleDeleteAssistant,
    handleCreateAssistant,
    fetchAssistants,
  };
}
