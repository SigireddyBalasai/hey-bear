"use client";
import { AssistantCard } from '../../components/concierge/conciergeCard';
import { AssistantList } from '../../components/concierge/AssistantList';
import { CreateAssistantDialog } from '../../components/concierge/CreateAssistantDialog';
import { EmptyState } from '../../components/concierge/EmptyState';
import { Header } from '../../components/concierge/Header';
import { Loading } from '../../components/concierge/Loading';
import { Login } from '../../components/concierge/Login';
import { SearchAndControls } from '../../components/concierge/SearchAndControl';
import { TabsNavigation } from '../../components/concierge/TabsNavigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import type { Tables } from '@/lib/db.types';
import type { NormalizedAssistantData } from '@/utils/assistant-data';
import { createUnpaidAssistant } from '@/utils/supabase/db-functions';
import { getMockAssistants } from '@/utils/mock-data';
import { UserCircle } from "lucide-react";

// Prefix Tables import with underscore since we're not using it directly
import type { Tables as _Tables } from '@/lib/db.types';

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
  const [normalizedAssistants, setNormalizedAssistants] = useState<AssistantWithNonNullableFields[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');
  const [_checkoutStatus, setCheckoutStatus] = useState<'success' | 'canceled' | null>(null);
  const [_checkoutAssistantId, setCheckoutAssistantId] = useState<string | null>(null);
  
  const router = useRouter();

  // State for form data object (combines all form fields)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    conciergeName: '',
    personality: 'Business Casual',
    businessName: '',
    sharePhoneNumber: false,
    phoneNumber: ''
  });

  // Handle input changes for any field in the form
  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Utility function to get URL parameters
  const getUrlParameter = (name: string): string | null => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get(name);
  };

  // Handle signing out
  const handleSignOut = () => {
    const supabase = createClient();
    supabase.auth.signOut().then(() => {
      setUser(null);
      router.push('/sign-in');
    });
  };

  // Handle deleting an assistant - using mock data utilities for now
  const handleDeleteAssistant = async (assistantId: string) => {
    try {
      const assistantToDelete = normalizedAssistants.find(a => a?.assistant?.id === assistantId);
      
      if (!assistantToDelete?.assistant?.id) {
        toast.error("Error", {
          description: "No-Show not found",
        });
        return;
      }
      
      // Instead of using Supabase directly, update local state for mock data
      setNormalizedAssistants(prev => prev.filter(a => a?.assistant?.id !== assistantId));
      
      toast.success("No-Show deleted", {
        description: `${assistantToDelete.assistant.name} has been removed`,
      });
    } catch (error: unknown) {
      console.error('Error deleting No-Show:', error);
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Something went wrong while deleting the No-Show",
      });
    }
  };

  // Updated createAssistant handler that uses the create_unpaid_assistant function
  const handleCreateAssistant = async () => {
    if (!formData.name.trim()) {
      toast.error("Name required", {
        description: "Please provide a name for your No-Show",
      });
      return;
    }

    if (!user?.id) {
      toast.error("Authentication required", {
        description: "Please sign in to create a No-Show",
      });
      return;
    }

    try {
      setIsCreating(true);
      
      const supabase = createClient();
      const { data, error } = await createUnpaidAssistant(supabase, {
        p_user_id: user.id,
        p_name: formData.name,
        p_description: formData.description || undefined,
        p_personality: formData.personality || 'Business Casual',
        p_business_name: formData.businessName || undefined,
        p_concierge_name: formData.conciergeName || formData.name,
        p_share_phone_number: formData.sharePhoneNumber,
        p_business_phone: formData.phoneNumber || undefined
      });

      if (error || !data) {
        throw error || new Error('Failed to create assistant');
      }

      // Reset form and close dialog
      setFormData({
        name: '',
        description: '',
        conciergeName: '',
        personality: 'Business Casual',
        businessName: '',
        sharePhoneNumber: false,
        phoneNumber: ''
      });
      setCreateDialogOpen(false);

      // Show success message and refresh list
      toast.success("Assistant created", {
        description: "Your new No-Show has been created successfully",
      });
      
      // Refresh the assistants list
      fetchAssistants();

    } catch (error: unknown) {
      console.error('Error creating No-Show:', error);
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Something went wrong while creating the No-Show",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Function to fetch assistants with normalized data
  const fetchAssistants = async () => {
    try {
      setIsLoading(true);
      
      // Use the mock data utilities we imported
      const mockAssistants = getMockAssistants('user-1', 5);
      // Transform the mock data to match the expected type
      const transformedAssistants = mockAssistants.map(assistant => ({
        ...assistant,
        config: assistant.config as AssistantConfig
      })) as AssistantWithNonNullableFields[];
      setNormalizedAssistants(transformedAssistants);
      
      // Set mock user data
      setUser({ 
        id: 'user-1', 
        user_metadata: { 
          name: 'Test User',
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TestUser'
        } 
      });
    } catch (error) {
      console.error('Error in fetchconcierge:', error);
      toast("Connection error", {
        description: "Failed to connect to the server",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check for Stripe redirect parameters on component mount
  useEffect(() => {
    const success = getUrlParameter('success');
    const canceled = getUrlParameter('canceled');
    const assistantId = getUrlParameter('assistant_id');
    
    if (success === 'true' && assistantId) {
      setCheckoutStatus('success');
      setCheckoutAssistantId(assistantId);
      
      // Show success message
      toast("Subscription successful", {
        description: "Your No-Show has been successfully activated!",
      });
      
      // Fetch the updated list of assistants to reflect the change
      fetchAssistants();
    } else if (canceled === 'true' && assistantId) {
      setCheckoutStatus('canceled');
      setCheckoutAssistantId(assistantId);
      
      // Show canceled message
      toast("Checkout canceled", {
        description: "Your payment was not completed. The No-Show will remain inactive.",
      });
      
      // Fetch the updated list of assistants to reflect the change
      fetchAssistants();
    }
  }, []);
  
  // Effect to handle return from Stripe checkout - simplified to remove duplicate code
  useEffect(() => {
    const success = getUrlParameter('success');
    const canceled = getUrlParameter('canceled');
    const assistantId = getUrlParameter('assistant_id');
    
    if (success === 'true' && assistantId) {
      setCheckoutStatus('success');
      setCheckoutAssistantId(assistantId);
      
      // Show success message
      toast.success("Payment successful", {
        description: "Your No-Show has been activated with your subscription plan",
      });
      
    } else if (canceled === 'true' && assistantId) {
      setCheckoutStatus('canceled');
      setCheckoutAssistantId(assistantId);
      
      // Show canceled message
      toast("Payment canceled", {
        description: "You can complete the payment later to activate your No-Show",
      });
    }

    // Clear URL parameters and refresh list in both cases
    if ((success === 'true' || canceled === 'true') && assistantId) {
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchAssistants();
    }
  }, []);
  
  // Fetch user and assistants data on component mount
  useEffect(() => {
    fetchAssistants();
  }, []);

  // Filter assistants based on search query and selected tab
  const filteredAssistants = normalizedAssistants.filter(assistantData => {
    const assistant = assistantData.assistant;
    const config = assistantData.config;
    
    // Check if the assistant has pending status - if so, exclude it
    const isPending = assistant.pending === true;
    
    if (isPending) {
      return false; // Skip pending assistants that haven't been paid for
    }
    
    const matchesSearch = assistant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (config?.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    
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

  // Utility functions - prefixed with _ since they're reserved for future use
  const _getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const _getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-200', 'bg-green-200', 'bg-yellow-200', 
      'bg-purple-200', 'bg-pink-200', 'bg-indigo-200',
      'bg-red-200', 'bg-orange-200', 'bg-teal-200'
    ];
    
    const index = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };
  
  const handleToggleStar = async (assistantId: string, isStarred: boolean) => {
    try {
      // Update local state only
      setNormalizedAssistants(normalizedAssistants.map(a => 
        a.assistant.id === assistantId 
          ? { ...a, assistant: { ...a.assistant, is_starred: isStarred }} 
          : a
      ));
      
      toast(`Assistant ${isStarred ? "starred" : "unstarred"}`, {
        description: `${normalizedAssistants.find(a => a.assistant.id === assistantId)?.assistant.name} has been ${isStarred ? "starred" : "unstarred"}`,
      });
    } catch (error: unknown) {
      console.error('Error toggling star:', error);
      toast("Error", {
        description: error instanceof Error ? error.message : "Something went wrong while updating the No-Show",
      });
    }
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
    <div className="container py-6 space-y-6">
      <Header 
        user={user} 
        handleSignOut={handleSignOut}
      />
      
      <div className="flex justify-between items-center">
        <TabsNavigation
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
        />
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
        isCreating={isCreating}
      />

      {/* Show coming soon for shared tab */}
      {selectedTab === 'shared' ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <UserCircle className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Sharing Coming Soon</h2>
          <p className="text-muted-foreground text-center max-w-md">
            The ability to share and collaborate on assistants with team members will be available soon.
          </p>
        </div>
      ) : filteredAssistants.length === 0 ? (
        <EmptyState
          searchQuery={searchQuery}
          onClearSearch={() => setSearchQuery('')}
          onCreateNew={() => setCreateDialogOpen(true)}
        />
      ) : (
        <AnimatePresence mode="wait">
          {/* Rest of the rendering logic for assistants */}
          {viewMode === 'grid' ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {filteredAssistants.map((assistantData) => (
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
                      is_starred: assistantData.assistant.is_starred || false,
                      created_at: assistantData.assistant.created_at,
                      description: assistantData.config?.description || undefined,
                      has_phone_number: !!assistantData.assistant.assigned_phone_number || !!assistantData.config?.business_phone,
                      subscription_plan: 'personal' as 'personal' | 'business', // Removed reference to non-existent property
                      total_messages: assistantData.interactions_count,
                      last_used_at: assistantData.last_interaction_at || undefined
                    }}
                    onToggleStar={(id, isStarred) => handleToggleStar(id, isStarred)}
                    onDelete={(id) => handleDeleteAssistant(id)}
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
                      is_starred: assistantData.assistant.is_starred || false,
                      created_at: assistantData.assistant.created_at,
                      description: assistantData.config?.description || undefined,
                      has_phone_number: !!assistantData.assistant.assigned_phone_number || !!assistantData.config?.business_phone,
                      subscription_plan: 'personal' as 'personal' | 'business',
                      total_messages: assistantData.interactions_count,
                      last_used_at: assistantData.last_interaction_at || undefined
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