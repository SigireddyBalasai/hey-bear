'use client';

import { useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { AnimatePresence, motion } from 'framer-motion';
import { UserCircle } from 'lucide-react';
import { toast } from 'sonner';

import { createClient } from '@/utils/supabase/client';

import { AssistantList } from '../../components/concierge/AssistantList';
import { CreateAssistantDialog } from '../../components/concierge/CreateAssistantDialog';
import { EmptyState } from '../../components/concierge/EmptyState';
import { Header } from '../../components/concierge/Header';
import { Loading } from '../../components/concierge/Loading';
import { Login } from '../../components/concierge/Login';
import { SearchAndControls } from '../../components/concierge/SearchAndControl';
import { TabsNavigation } from '../../components/concierge/TabsNavigation';
import { AssistantCard } from '../../components/concierge/conciergeCard';

// Constants for commonly used strings
const CONNECTION_ERROR = 'Connection error';

// Utility function to get URL parameters (moved to outer scope)
const getUrlParameter = (name: string): string | null => {
  if (typeof globalThis === 'undefined') return null;
  return new URLSearchParams(globalThis.location.search).get(name);
};

// Prefix Tables import with underscore since we're not using it directly

interface UserState {
  id: string;
  user_metadata?: {
    name?: string;
    avatar_url?: string;
  };
}

type AssistantConfig = {
  description?: string;
  business_phone?: string | null;
} | null;

interface NormalizedAssistantData {
  assistant: {
    id: string;
    name: string;
    is_starred?: boolean;
    created_at: string;
    assigned_phone_number?: string | null;
    pending?: boolean;
  };
  config?: AssistantConfig;
  subscription?: unknown;
  usageLimits?: unknown;
  activity?: unknown;
  interactions_count: number;
  last_interaction_at: string | null;
}

type AssistantWithNonNullableFields = Omit<NormalizedAssistantData, 'assistant' | 'config'> & {
  assistant: {
    id: string;
    name: string;
    is_starred?: boolean;
    created_at: string;
    assigned_phone_number?: string | null;
    pending?: boolean;
  };
  config?: AssistantConfig;
};

export default function AssistantsPage() {
  const [user, setUser] = useState<UserState | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [normalizedAssistants, setNormalizedAssistants] = useState<
    AssistantWithNonNullableFields[]
  >([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');

  const router = useRouter();

  // State for form data object (combines all form fields)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    conciergeName: '',
    personality: 'Business Casual',
    businessName: '',
    sharePhoneNumber: false,
    phoneNumber: '',
    selectedPlan: 'personal', // Default to personal plan
  });

  // Handle input changes for any field in the form
  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle signing out
  const handleSignOut = () => {
    const supabase = createClient();
    void supabase.auth
      .signOut()
      .then(() => {
        setUser(null);
        router.push('/sign-in');
      })
      .catch((error: unknown) => {
        console.error('Error signing out:', error);
      });
  };

  // Handle deleting an assistant - now using real Supabase deletion
  const handleDeleteAssistantAsync = async (assistantId: string) => {
    try {
      const assistantToDelete = normalizedAssistants.find(a => a.assistant.id === assistantId);

      if (!assistantToDelete?.assistant.id) {
        toast.error('Error', {
          description: 'Assistant not found',
        });
        return;
      }

      const supabase = createClient();

      // Delete from Supabase
      const { error } = await supabase.from('assistants').delete().eq('id', assistantId);

      if (error) {
        console.error('Error deleting assistant:', error);
        toast.error('Error', {
          description: 'Failed to delete assistant from server',
        });
        return;
      }

      // Update local state after successful deletion
      setNormalizedAssistants(prev => prev.filter(a => a.assistant.id !== assistantId));

      toast.success('Assistant deleted', {
        description: `${assistantToDelete.assistant.name} has been removed`,
      });
    } catch (error: unknown) {
      console.error('Error deleting assistant:', error);
      toast.error('Error', {
        description:
          error instanceof Error
            ? error.message
            : 'Something went wrong while deleting the assistant',
      });
    }
  };

  // Placeholder createAssistant handler - creation logic to be implemented elsewhere
  const handleCreateAssistant = () => {
    // Reset form and close dialog
    setFormData({
      name: '',
      description: '',
      conciergeName: '',
      personality: 'Business Casual',
      businessName: '',
      sharePhoneNumber: false,
      phoneNumber: '',
      selectedPlan: 'personal', // Default to personal plan
    });
    setCreateDialogOpen(false);

    // Show placeholder message
    toast('Creation pending', {
      description: 'Assistant creation will be implemented elsewhere',
    });
  };

  // Function to fetch assistants with normalized data from Supabase
  const fetchAssistants = useCallback(async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();

      // First get the authenticated user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Error fetching user:', userError);
        router.push('/sign-in');
        return;
      }

      // Set user data
      setUser({
        id: user.id,
        user_metadata: user.user_metadata,
      });

      // Get user ID from users table
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (userDataError) {
        // If error is "No rows found" this might be a new user - don't show error
        if (userDataError.code === 'PGRST116') {
          console.log('New user detected, no assistants yet');
          setNormalizedAssistants([]);
          setUserId(null);
          setIsLoading(false);
          return;
        }

        console.error('Error fetching user data:', userDataError);
        toast(CONNECTION_ERROR, {
          description: 'Failed to fetch user data from server',
        });
        setIsLoading(false);
        return;
      }

      // Store the user ID for use in components
      setUserId(userData.id);

      // Fetch assistants belonging to this user from the assistants schema
      const { data: assistantsData, error: assistantsError } = await supabase
        .from('assistants')
        .select('*')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false });

      if (assistantsError) {
        console.error('Error fetching assistants:', assistantsError);
        toast(CONNECTION_ERROR, {
          description: 'Failed to fetch assistants from server',
        });
        return;
      }

      // If no assistants exist, set empty array (don't use fallback dummy data)
      if (!assistantsData || assistantsData.length === 0) {
        console.log('User has 0 assistants');
        setNormalizedAssistants([]);
      } else {
        // Transform the real data from the database
        // Use actual data values or empty defaults, never dummy data
        const transformedAssistants = assistantsData
          .filter(assistant => assistant !== null) // Skip any null entries
          .map(assistant => ({
            assistant: {
              ...assistant,
              // Ensure name is always at least an empty string, never undefined
              name: assistant.name || '',
              // Explicitly set default value for starred status
              is_starred: assistant.is_starred ?? false,
            },
            config: null as AssistantConfig,
            subscription: undefined,
            usageLimits: undefined,
            activity: undefined,
            interactions_count: 0, // Start with zero messages, not dummy data
            last_interaction_at: null, // Start with null timestamp, not dummy data
          })) as AssistantWithNonNullableFields[];

        setNormalizedAssistants(transformedAssistants);
      }
    } catch (error) {
      console.error('Error in fetchAssistants:', error);
      toast(CONNECTION_ERROR, {
        description: 'Failed to connect to the server',
      });
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Check for Stripe redirect parameters on component mount
  useEffect(() => {
    const success = getUrlParameter('success');
    const canceled = getUrlParameter('canceled');
    const assistantId = getUrlParameter('assistant_id');

    if (success === 'true' && assistantId) {
      // Show success message
      toast('Subscription successful', {
        description: 'Your No-Show has been successfully activated!',
      });

      // Fetch the updated list of assistants to reflect the change
      void fetchAssistants();
    } else if (canceled === 'true' && assistantId) {
      // Show canceled message
      toast('Checkout canceled', {
        description: 'Your payment was not completed. The No-Show will remain inactive.',
      });

      // Fetch the updated list of assistants to reflect the change
      void fetchAssistants();
    }
  }, [fetchAssistants]);

  // Effect to handle return from Stripe checkout - updated to handle new payment flow
  useEffect(() => {
    const paymentStatus = getUrlParameter('payment');
    const openDialog = getUrlParameter('openDialog');

    // Handle new payment flow with bot data
    if ((paymentStatus === 'success' || paymentStatus === 'cancelled') && openDialog === 'true') {
      // Extract bot data from URL parameters
      const botData = {
        name: getUrlParameter('name') || '',
        description: getUrlParameter('description') || '',
        conciergeName: getUrlParameter('conciergeName') || '',
        personality: getUrlParameter('personality') || '',
        businessName: getUrlParameter('businessName') || '',
        sharePhoneNumber: getUrlParameter('sharePhoneNumber') === 'true',
        phoneNumber: getUrlParameter('phoneNumber') || '',
        selectedPlan: getUrlParameter('selectedPlan') || 'personal',
      };

      // Populate form data with bot data
      setFormData(botData);

      if (paymentStatus === 'success') {
        // Show success message
        toast.success('Payment successful!', {
          description: 'Your subscription is active. Complete creating your assistant.',
        });
      } else {
        // Show cancelled message
        toast('Payment cancelled', {
          description:
            'You can complete the payment later. Your assistant details have been preserved.',
        });
      }

      // Open the create dialog with preserved data
      setCreateDialogOpen(true);

      // Clean up URL parameters
      globalThis.history.replaceState({}, document.title, globalThis.location.pathname);
    }

    // Handle legacy payment flow (keep for backward compatibility)
    const success = getUrlParameter('success');
    const canceled = getUrlParameter('canceled');
    const assistantId = getUrlParameter('assistant_id');

    if (success === 'true' && assistantId) {
      // Show success message
      toast.success('Payment successful', {
        description: 'Your No-Show has been activated with your subscription plan',
      });
    } else if (canceled === 'true' && assistantId) {
      // Show canceled message
      toast('Payment canceled', {
        description: 'You can complete the payment later to activate your No-Show',
      });
    }

    // Clear URL parameters and refresh list in both legacy cases
    if ((success === 'true' || canceled === 'true') && assistantId) {
      globalThis.history.replaceState({}, document.title, globalThis.location.pathname);
      void fetchAssistants();
    }
  }, [fetchAssistants, setFormData, setCreateDialogOpen]);

  // Fetch user and assistants data on component mount
  useEffect(() => {
    void fetchAssistants();
  }, [fetchAssistants]);

  // Filter assistants based on search query and selected tab
  // NOTE: We're using real data from the database - never using dummy/fallback data
  // Users may have 0 assistants which is a valid state - handle gracefully with empty states
  const filteredAssistants = normalizedAssistants.filter(assistantData => {
    const assistant = assistantData.assistant;
    const config = assistantData.config;

    // Check if the assistant has pending status - if so, exclude it
    const isPending = assistant.pending === true;

    if (isPending) {
      return false; // Skip pending assistants that haven't been paid for
    }

    const matchesSearch =
      assistant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (config?.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    // Filter based on selected tab
    if (selectedTab === 'all') {
      return matchesSearch;
    } else if (selectedTab === 'favorites') {
      return matchesSearch && assistant.is_starred === true;
    } else {
      // Additional filters could be added here (shared, etc.)
      return matchesSearch;
    }
  });

  // Utility functions removed - they were not being used

  const handleToggleStarAsync = async (assistantId: string, isStarred: boolean) => {
    try {
      const supabase = createClient();

      // Update in Supabase first
      const { error } = await supabase
        .from('assistants')
        .update({ is_starred: isStarred })
        .eq('id', assistantId);

      if (error) {
        console.error('Error updating assistant star status:', error);
        toast.error('Error', {
          description: 'Failed to update assistant on server',
        });
        return;
      }

      // Update local state after successful update
      setNormalizedAssistants(
        normalizedAssistants.map(a =>
          a.assistant.id === assistantId
            ? { ...a, assistant: { ...a.assistant, is_starred: isStarred } }
            : a
        )
      );

      const assistantName =
        normalizedAssistants.find(a => a.assistant.id === assistantId)?.assistant.name ?? 'Unknown';
      toast(`Assistant ${isStarred ? 'starred' : 'unstarred'}`, {
        description: `${assistantName} has been ${isStarred ? 'starred' : 'unstarred'}`,
      });
    } catch (error: unknown) {
      console.error('Error toggling star:', error);
      toast.error('Error', {
        description:
          error instanceof Error
            ? error.message
            : 'Something went wrong while updating the assistant',
      });
    }
  };

  // Wrapper functions to handle async operations without returning promises
  const handleToggleStar = (assistantId: string, isStarred: boolean) => {
    handleToggleStarAsync(assistantId, isStarred).catch((error: unknown) => {
      console.error('Error in handleToggleStar:', error);
    });
  };

  const handleDeleteAssistant = (assistantId: string) => {
    handleDeleteAssistantAsync(assistantId).catch((error: unknown) => {
      console.error('Error in handleDeleteAssistant:', error);
    });
  };

  // Display loading state
  if (isLoading) {
    return <Loading />;
  }

  // Display login if not authenticated
  if (!user) {
    return <Login />;
  }

  return (
    <div className="container space-y-6 py-6">
      <Header user={user} handleSignOut={handleSignOut} />

      <div className="flex items-center justify-between">
        <TabsNavigation selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
      </div>

      <SearchAndControls
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        createDialogOpen={createDialogOpen}
        onCreateDialogChange={setCreateDialogOpen}
      />

      <CreateAssistantDialog
        open={createDialogOpen}
        setOpen={setCreateDialogOpen}
        formData={formData}
        handleInputChange={handleInputChange}
        handleCreateAssistant={handleCreateAssistant}
        isCreating={false}
        userId={userId || undefined}
      />

      {/* Show coming soon for shared tab */}
      {selectedTab === 'shared' ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <UserCircle className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mb-2 text-2xl font-semibold">Sharing Coming Soon</h2>
          <p className="max-w-md text-center text-muted-foreground">
            The ability to share and collaborate on assistants with team members will be available
            soon.
          </p>
        </div>
      ) : null}

      {selectedTab !== 'shared' && filteredAssistants.length === 0 && (
        <EmptyState
          searchQuery={searchQuery}
          onClearSearch={() => {
            setSearchQuery('');
          }}
          onCreateNew={() => {
            setCreateDialogOpen(true);
          }}
          noAssistantsYet={normalizedAssistants.length === 0}
        />
      )}

      {selectedTab !== 'shared' && filteredAssistants.length > 0 && (
        <AnimatePresence mode="wait">
          {/* Rest of the rendering logic for assistants */}
          {viewMode === 'grid' ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filteredAssistants.map(assistantData => (
                <motion.div
                  key={assistantData.assistant.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <AssistantCard
                    assistant={{
                      id: assistantData.assistant.id,
                      name: assistantData.assistant.name || '',
                      is_starred: assistantData.assistant.is_starred ?? false,
                      created_at: assistantData.assistant.created_at,
                      description: assistantData.config?.description,
                      has_phone_number: !!(
                        assistantData.assistant.assigned_phone_number ??
                        assistantData.config?.business_phone
                      ),
                      subscription_plan: 'personal' as 'personal' | 'business', // Removed reference to non-existent property
                      total_messages: assistantData.interactions_count,
                      last_used_at: assistantData.last_interaction_at ?? undefined,
                    }}
                    onToggleStar={(id, isStarred) => {
                      handleToggleStar(id, isStarred);
                    }}
                    onDelete={id => {
                      handleDeleteAssistant(id);
                    }}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-2"
            >
              {filteredAssistants.map((assistantData, index) => (
                <motion.div
                  key={assistantData.assistant.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <AssistantList
                    assistant={{
                      id: assistantData.assistant.id,
                      name: assistantData.assistant.name || '',
                      is_starred: assistantData.assistant.is_starred ?? false,
                      created_at: assistantData.assistant.created_at,
                      description: assistantData.config?.description,
                      has_phone_number: !!(
                        assistantData.assistant.assigned_phone_number ??
                        assistantData.config?.business_phone
                      ),
                      subscription_plan: 'personal' as 'personal' | 'business',
                      total_messages: assistantData.interactions_count,
                      last_used_at: assistantData.last_interaction_at ?? undefined,
                    }}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
