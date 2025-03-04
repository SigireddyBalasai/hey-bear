"use client";
import { AssistantCard } from './AssistantCard';
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
import { Assistant, toFrontendAssistant } from '@/lib/types-adapter';
import { Database } from '@/lib/database.types';

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

  // Fetch user and assistants data
  useEffect(() => {
    const fetchUserAndAssistants = async () => {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          // Fetch assistants directly from Supabase
          const { data, error } = await supabase
            .from('assistants')
            .select('*')
            .eq('user_id', user.id);
          
          if (error) {
            throw error;
          }
          
          if (data) {
            // Convert database assistants to frontend format
            const frontendAssistants = data.map(toFrontendAssistant);
            
            // Sort by creation date (newest first)
            frontendAssistants.sort((a: Assistant, b: Assistant) => {
              const dateA = a.started_at || a.createdAt || '';
              const dateB = b.started_at || b.createdAt || '';
              return new Date(dateB).getTime() - new Date(dateA).getTime();
            });
            
            setAssistants(frontendAssistants);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast("Connection error",{
          description: "Failed to connect to the server",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserAndAssistants();
  }, []);

  // Handle creating a new assistant
  const handleCreateAssistant = async () => {
    if (!newAssistantName.trim()) {
      toast("Name required",{
        description: "Please provide a name for your assistant",
      });
      return;
    }
    
    try {
      setIsCreating(true);
      
      // Generate a unique assistant ID
      const assistantId = `assist_${Math.random().toString(36).substring(2, 15)}`;
      
      // Create the assistant in Supabase
      const { data, error } = await supabase
        .from('assistants')
        .insert({
          assistant_id: assistantId,
          user_id: user.id,
          started_at: new Date().toISOString(),
          metadata: {
            name: newAssistantName,
            assistantName: newAssistantName,
            description: newAssistantDescription || 'No description provided',
            is_active: true,
            createdAt: new Date().toISOString()
          }
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        // Add the new assistant to the list
        const newAssistant = toFrontendAssistant(data[0]);
        setAssistants([newAssistant, ...assistants]);
        setNewAssistantName('');
        setNewAssistantDescription('');
        setCreateDialogOpen(false);
        
        toast("Assistant created",{
          description: `${newAssistantName} has been created successfully`,
        });
      }
    } catch (error: any) {
      console.error('Error creating assistant:', error);
      toast("Error",{
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
      const assistantToDelete = assistants.find(a => a.id === assistantId || a.assistant_id === assistantId);
      
      if (!assistantToDelete) {
        toast("Error",{
          description: "Assistant not found",
        });
        return;
      }
      
      // Delete from Supabase
      const { error } = await supabase
        .from('assistants')
        .delete()
        .eq('id', assistantToDelete.id);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setAssistants(assistants.filter(a => a.id !== assistantId && a.assistant_id !== assistantId));
      
      toast("Assistant deleted",{
        description: `${assistantToDelete.name || assistantToDelete.assistantName} has been removed`,
      });
    } catch (error: any) {
      console.error('Error deleting assistant:', error);
      toast("Error",{
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
    const matchesSearch = (assistant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         assistant.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filter based on selected tab (for future implementation)
    if (selectedTab === 'all') {
      return matchesSearch;
    } else {
      // Additional filters could be added here (favorites, shared, etc.)
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

      {/* No results state */}
      {filteredAssistants.length === 0 && (
        <EmptyState
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setCreateDialogOpen={setCreateDialogOpen}
        />
      )}

      {/* Assistants grid/list view */}
      {filteredAssistants.length > 0 && (
        <AnimatePresence mode="wait">
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
                  key={assistant.id || assistant.assistant_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <AssistantCard
                    assistant={assistant}
                    getInitials={getInitials}
                    getAvatarColor={getAvatarColor}
                    handleDeleteAssistant={handleDeleteAssistant}
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
              {filteredAssistants.map((assistant, index) => (
                <motion.div
                  key={assistant.id || assistant.assistant_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <AssistantList
                    assistant={assistant}
                    getInitials={getInitials}
                    getAvatarColor={getAvatarColor}
                    handleDeleteAssistant={handleDeleteAssistant}
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