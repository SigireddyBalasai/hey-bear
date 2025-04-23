"use client";
import { AssistantCard } from './conciergeCard';
import { AssistantList } from './AssistantList';
import { CreateAssistantDialog } from './CreateAssistantDialog';
import { EmptyState } from './EmptyState';
import { Header } from './Header';
import { Loading } from './Loading';
import { Login } from './Login';
import { SearchAndControls } from './SearchAndControl';
import { TabsNavigation } from './TabsNavigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Tables } from '@/lib/db.types';
import { UserCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Phone, CreditCard } from 'lucide-react';
import { SUBSCRIPTION_PLANS, getSubscriptionPlanDetails } from '@/lib/stripe';
import {Button} from "@/components/ui/button"

type Assistant = Tables<'assistants'>

export default function AssistantsPage() {
  const [user, setUser] = useState<any>(null);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [newAssistantName, setNewAssistantName] = useState('');
  const [newAssistantDescription, setNewAssistantDescription] = useState('');
  // New fields for assistant creation
  const [conciergeName, setConciergeName] = useState('');
  const [conciergePersonality, setConciergePersonality] = useState('Business Casual');
  const [businessName, setBusinessName] = useState('');
  const [sharePhoneNumber, setSharePhoneNumber] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  // Subscription plan state - Initialize with 'personal' as default
  const [selectedPlan, setSelectedPlan] = useState<string | null>(SUBSCRIPTION_PLANS.PERSONAL.id ?? null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');
  
  // Add state to track checkout status
  const [checkoutStatus, setCheckoutStatus] = useState<'success' | 'canceled' | null>(null);
  const [checkoutAssistantId, setCheckoutAssistantId] = useState<string | null>(null);
  const router = useRouter();
  
  // Function to get URL parameters
  const getUrlParameter = (name: string) => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  };

  const supabase = createClient();

  // Function to fetch assistants
  const fetchAssistants = async () => {
    try {
      setIsLoading(true);
      
      // First get the authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Error fetching user:', userError);
        setUser(null);
        return;
      }
      
      setUser(user);
      
      // Now fetch the user record from the users table to get the proper ID
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();
        
      if (userDataError) {
        console.error('Error fetching user data:', userDataError);
        return;
      }
      
      if (!userData) {
        console.error('User record not found in users table');
        return;
      }
      
      // Fetch assistants using the user_id from users table
      const { data: assistantsData, error: assistantsError } = await supabase
        .from('assistants')
        .select('*')
        .eq('user_id', userData.id);
      
      if (assistantsError) {
        console.error('Error fetching Concierge:', assistantsError);
        return;
      }
      
      console.log('Fetched assistants:', assistantsData);
      
      // Process and sort assistants
      if (assistantsData && assistantsData.length > 0) {
        const frontendAssistants = assistantsData;
        
        // Sort by creation date (newest first)
        frontendAssistants.sort((a: Assistant, b: Assistant) => {
          const dateA = a.created_at || '';
          const dateB = b.created_at || '';
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        });
        
        setAssistants(frontendAssistants);
      } else {
        setAssistants([]);
      }
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
      
      // Remove query params from URL without page reload
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Show success message
      toast("Subscription successful", {
        description: "Your Concierge has been successfully activated!",
      });
      
      // Fetch the updated list of assistants to reflect the change
      fetchAssistants();
    } else if (canceled === 'true' && assistantId) {
      setCheckoutStatus('canceled');
      setCheckoutAssistantId(assistantId);
      
      // Remove query params from URL without page reload
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Show canceled message
      toast("Checkout canceled", {
        description: "Your payment was not completed. The Concierge will remain inactive.",
      });
      
      // Fetch the updated list of assistants to reflect the change
      fetchAssistants();
    }
  }, []);
  
  // Effect to handle return from Stripe checkout
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const success = queryParams.get('success');
    const canceled = queryParams.get('canceled');
    const assistantId = queryParams.get('assistant_id');
    const sessionId = queryParams.get('session_id');

    if (success === 'true' && assistantId) {
      toast.success("Payment successful", {
        description: "Your Concierge has been activated with your subscription plan",
      });
      
      // Clear URL parameters to avoid showing the message again on refresh
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      
      // Fetch assistants to update the list with the new subscription status
      fetchAssistants();
    }

    if (canceled === 'true' && assistantId) {
      toast("Payment canceled", {
        description: "You can complete the payment later to activate your Concierge",
      });
      
      // Clear URL parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      
      // Fetch assistants to ensure list is up to date
      fetchAssistants();
    }
  }, []);
  
  // Fetch user and assistants data on component mount
  useEffect(() => {
    fetchAssistants();
  }, []);

  // Handle creating a new assistant
  const handleCreateAssistant = async () => {
    if (!newAssistantName.trim()) {
      toast("Name required", {
        description: "Please provide a name for your Concierge",
      });
      return;
    }
    
    if (!selectedPlan) {
      toast("Subscription plan required", {
        description: "Please select a subscription plan for your Concierge",
      });
      return;
    }
    
    try {
      setIsCreating(true);
      
      // Get the plan details based on the selected price ID
      const planDetails = getSubscriptionPlanDetails(selectedPlan!);
      if (!planDetails) {
        toast("Invalid plan", { description: "Selected subscription plan is invalid." });
        return;
      }
      // Determine plan type key for subscription (e.g., 'personal' or 'business')
      const planKey = Object.keys(SUBSCRIPTION_PLANS).find(key =>
        SUBSCRIPTION_PLANS[key as keyof typeof SUBSCRIPTION_PLANS].id === selectedPlan
      ) as keyof typeof SUBSCRIPTION_PLANS;
      const planType = planKey.toLowerCase();
      
      // Create a structured params object that includes all the new fields
      const assistantParams = {
        description: newAssistantDescription,
        conciergeName: conciergeName || newAssistantName, // Default to assistant name if not provided
        conciergePersonality: conciergePersonality,
        businessName: businessName,
        sharePhoneNumber: sharePhoneNumber,
        phoneNumber: phoneNumber,
        systemPrompt: generateSystemPrompt({
          conciergeName: conciergeName || newAssistantName,
          conciergePersonality,
          businessName,
          description: newAssistantDescription,
          sharePhoneNumber,
          phoneNumber,
        })
      };
      
      const response = await fetch('/api/Concierge/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assistantName: newAssistantName,
          description: newAssistantDescription,
          params: assistantParams,
          plan: planType,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create assistant');
      }
      
      // Create checkout session for the bot in Stripe
      const checkoutResponse = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assistantId: data.assistantId,
          planId: planDetails.id,
        }),
      });
      
      const checkoutData = await checkoutResponse.json();
      
      if (!checkoutResponse.ok) {
        throw new Error(checkoutData.error || "Failed to create subscription checkout");
      }
      
      // Reset form fields and close dialog
      setNewAssistantName('');
      setNewAssistantDescription('');
      setConciergeName('');
      setConciergePersonality('Business Casual');
      setBusinessName('');
      setSharePhoneNumber(false);
      setPhoneNumber('');
      setSelectedPlan(SUBSCRIPTION_PLANS.PERSONAL.id ?? null);
      setCreateDialogOpen(false);
      
      // Show loading toast
      toast("Redirecting to checkout", {
        description: "Please complete the payment process to activate your Concierge",
      });
      
      // Redirect to Stripe Checkout
      if (checkoutData.checkoutUrl) {
        window.location.href = checkoutData.checkoutUrl;
      } else {
        throw new Error("No checkout URL provided");
      }
      
    } catch (error: any) {
      console.error('Error creating Concierge:', error);
      toast("Error", {
        description: error.message || "Something went wrong while creating the Concierge",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Helper function to generate a system prompt based on Concierge parameters
  const generateSystemPrompt = ({
    conciergeName,
    conciergePersonality,
    businessName,
    description,
    sharePhoneNumber,
    phoneNumber,
  }: {
    conciergeName: string;
    conciergePersonality: string;
    businessName: string;
    description: string;
    sharePhoneNumber: boolean;
    phoneNumber: string | null;
  }) => {
    let prompt = `You are ${conciergeName}, an AI Concierge`;
    
    if (businessName) {
      prompt += ` for ${businessName}`;
    }
    
    prompt += `. Your communication style is ${conciergePersonality.toLowerCase()}.`;
    
    if (description) {
      prompt += `\n\nYour primary function: ${description}`;
    }
    
    if (sharePhoneNumber && phoneNumber) {
      prompt += `\n\nWhen someone asks for contact information or how to reach ${businessName || 'us'} directly, provide this phone number: ${phoneNumber}.`;
    }
    
    prompt += `\n\nAlways be helpful, accurate, and respond in a ${conciergePersonality.toLowerCase()} tone. If you don't know something, admit it rather than making up information.`;
    
    return prompt;
  };

  // Handle deleting an assistant
  const handleDeleteAssistant = async (assistantId: string) => {
    try {
      // Find the assistant to delete
      const assistantToDelete = assistants.find(a => a.id === assistantId);
      
      if (!assistantToDelete) {
        toast("Error", {
          description: "Concierge not found",
        });
        return;
      }
      
      // Delete from Supabase
      const { error } = await supabase
        .from('assistants')
        .delete()
        .eq('id', assistantId);
      
      if (error) {
        throw error;
      }
      
      // Cancel subscription if it exists
      await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assistantId: assistantId,
        }),
      });
      
      // Update local state
      setAssistants(assistants.filter(a => a.id !== assistantId));
      
      toast("Concierge deleted", {
        description: `${assistantToDelete.name} has been removed`,
      });
    } catch (error: any) {
      console.error('Error deleting Concierge:', error);
      toast("Error", {
        description: error.message || "Something went wrong while deleting the Concierge",
      });
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/sign-in');
  };

  // Filter assistants based on search query and selected tab
  const filteredAssistants = assistants.filter(assistant => {
    // First check if the assistant has pending status - if so, exclude it
    const isPending = typeof assistant.params === 'object' && 
                      assistant.params !== null &&
                      'pending' in assistant.params &&
                      assistant.params.pending === true;
    
    if (isPending) {
      return false; // Skip pending assistants that haven't been paid for
    }
    
    const matchesSearch = assistant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (typeof assistant.params === 'object' && 
                            assistant.params !== null &&
                           'description' in assistant.params && 
                           typeof assistant.params.description === 'string' && 
                           assistant.params.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
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

  // Helper function for type checking params.subscription
  const hasSubscriptionPlan = (params: any): params is { subscription: { plan: string } } => {
    return typeof params === 'object' && 
           params !== null && 
           'subscription' in params && 
           typeof params.subscription === 'object' &&
           params.subscription !== null &&
           'plan' in params.subscription;
  };

  // Generate avatar initials from assistant name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Get random pastel color based on assistant name
  const getAvatarColor = (name: string) => {
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
      // Update in Supabase
      const { error } = await supabase
        .from('assistants')
        .update({ is_starred: isStarred })
        .eq('id', assistantId);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setAssistants(assistants.map(a => 
        a.id === assistantId ? { ...a, is_starred: isStarred } : a
      ));
      
      toast(`Assistant ${isStarred ? "starred" : "unstarred"}`, {
        description: `${assistants.find(a => a.id === assistantId)?.name} has been ${isStarred ? "starred" : "unstarred"}`,
      });
    } catch (error: any) {
      console.error('Error toggling star:', error);
      toast("Error", {
        description: error.message || "Something went wrong while updating the Concierge",
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
        <div className="flex space-x-2">
          <Button onClick={() => setCreateDialogOpen(true)} className="whitespace-nowrap">
            New Concierge
          </Button>
        </div>
      </div>
      
      <SearchAndControls
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        viewMode={viewMode}
        setViewMode={setViewMode}
        createDialogOpen={createDialogOpen}
        setCreateDialogOpen={setCreateDialogOpen}
      />
      
      <CreateAssistantDialog 
        open={createDialogOpen} 
        setOpen={setCreateDialogOpen}
        newAssistantName={newAssistantName}
        setNewAssistantName={setNewAssistantName}
        newAssistantDescription={newAssistantDescription}
        setNewAssistantDescription={setNewAssistantDescription}
        conciergeName={conciergeName}
        setConciergeName={setConciergeName}
        conciergePersonality={conciergePersonality}
        setConciergePersonality={setConciergePersonality}
        businessName={businessName}
        setBusinessName={setBusinessName}
        sharePhoneNumber={sharePhoneNumber}
        setSharePhoneNumber={setSharePhoneNumber}
        phoneNumber={phoneNumber}
        setPhoneNumber={setPhoneNumber}
        selectedPlan={selectedPlan}
        setSelectedPlan={setSelectedPlan}
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
          setSearchQuery={setSearchQuery}
          setCreateDialogOpen={setCreateDialogOpen}
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
              {filteredAssistants.map((assistant) => (
                <motion.div
                  key={assistant.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <AssistantCard
                    assistant={assistant}
                    getInitials={getInitials}
                    getAvatarColor={getAvatarColor}
                    handleDeleteAssistant={handleDeleteAssistant}
                    handleToggleStar={handleToggleStar}
                  />
                  {assistant.assigned_phone_number && (
                    <Badge variant="outline" className="ml-2 gap-1">
                      <Phone className="h-3 w-3" />
                      SMS
                    </Badge>
                  )}
                  {hasSubscriptionPlan(assistant.params) && (
                    <Badge variant="outline" className="ml-2 gap-1" color={assistant.params.subscription.plan === 'business' ? 'gold' : 'blue'}>
                      {assistant.params.subscription.plan === 'business' ? 'Business' : 'Personal'}
                    </Badge>
                  )}
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
              {filteredAssistants.map((assistant, index) => (
                <motion.div
                  key={assistant.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <AssistantList
                    assistant={assistant}
                    getInitials={getInitials}
                    getAvatarColor={getAvatarColor}
                    handleDeleteAssistant={handleDeleteAssistant}
                    handleToggleStar={handleToggleStar}
                  />
                  <div className="flex gap-2 ml-2 mt-1">
                    {assistant.assigned_phone_number && (
                      <Badge variant="outline" className="gap-1">
                        <Phone className="h-3 w-3" />
                        SMS
                      </Badge>
                    )}
                    {hasSubscriptionPlan(assistant.params) && (
                      <Badge variant="outline" className="gap-1" color={assistant.params.subscription.plan === 'business' ? 'gold' : 'blue'}>
                        {assistant.params.subscription.plan === 'business' ? 'Business' : 'Personal'}
                      </Badge>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}