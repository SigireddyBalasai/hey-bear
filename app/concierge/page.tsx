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
import { Phone } from 'lucide-react';


type Assistant = Tables<'assistants'>

export default function AssistantsPage() {
  const [user, setUser] = useState<any>(null);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [newAssistantName, setNewAssistantName] = useState('');
  const [newAssistantDescription, setNewAssistantDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');
  
  const router = useRouter();
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
        console.error('Error fetching assistants:', assistantsError);
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
      console.error('Error in fetchAssistants:', error);
      toast("Connection error", {
        description: "Failed to connect to the server",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user and assistants data on component mount
  useEffect(() => {
    fetchAssistants();
  }, []);

  // Handle creating a new assistant
  const handleCreateAssistant = async () => {
    if (!newAssistantName.trim()) {
      toast("Name required", {
        description: "Please provide a name for your assistant",
      });
      return;
    }
    
    try {
      setIsCreating(true);
      
      // Send request to our backend API
      const response = await fetch('/api/concierge/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assistantName: newAssistantName,
          description: newAssistantDescription,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create assistant');
      }
      
      // Reset form fields and close dialog
      setNewAssistantName('');
      setNewAssistantDescription('');
      setCreateDialogOpen(false);
      
      // Show success toast
      toast("Assistant created", {
        description: `${newAssistantName} has been created successfully`,
      });
      
      // Fetch the updated list of assistants
      await fetchAssistants();
      
    } catch (error: any) {
      console.error('Error creating assistant:', error);
      toast("Error", {
        description: error.message || "Something went wrong while creating the assistant",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Handle deleting an assistant
  const handleDeleteAssistant = async (assistantId: string) => {
    try {
      // Find the assistant to delete
      const assistantToDelete = assistants.find(a => a.id === assistantId);
      
      if (!assistantToDelete) {
        toast("Error", {
          description: "Assistant not found",
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
      
      // Update local state
      setAssistants(assistants.filter(a => a.id !== assistantId));
      
      toast("Assistant deleted", {
        description: `${assistantToDelete.name} has been removed`,
      });
    } catch (error: any) {
      console.error('Error deleting assistant:', error);
      toast("Error", {
        description: error.message || "Something went wrong while deleting the assistant",
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
        description: error.message || "Something went wrong while updating the assistant",
      });
    }
  };

  // Display loading state
  if (isLoading) {
    return <Loading />;
  }

  // Display login page if not authenticated
  if (!user) {
    return <Login />;
  }

  // The rest of the component remains largely the same
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header section */}
      <Header user={user} handleSignOut={handleSignOut} />

      {/* Search and controls bar */}
      <SearchAndControls
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        viewMode={viewMode}
        setViewMode={setViewMode}
        createDialogOpen={createDialogOpen}
        setCreateDialogOpen={setCreateDialogOpen}
      />

      {/* Tab navigation for filtering (can be extended in future) */}
      <TabsNavigation selectedTab={selectedTab} setSelectedTab={setSelectedTab} />

      <CreateAssistantDialog
        open={createDialogOpen}
        setOpen={setCreateDialogOpen}
        newAssistantName={newAssistantName}
        setNewAssistantName={setNewAssistantName}
        newAssistantDescription={newAssistantDescription}
        setNewAssistantDescription={setNewAssistantDescription}
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
                  {assistant.assigned_phone_number && (
                    <Badge variant="outline" className="ml-2 gap-1">
                      <Phone className="h-3 w-3" />
                      SMS
                    </Badge>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}