"use client";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { 
  Bot, 
  Search, 
  Plus, 
  Trash2, 
  Loader2, 
  ArrowRight, 
  UserCircle, 
  LogOut,
  LayoutGrid,
  LayoutList,
  ChevronRight,
  Settings,
  Info
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

type Assistant = {
  name: string;
  assistantName?: string; // Support both name formats from API
  metadata: {
    owner: string;
    createdAt?: string;
    description?: string;
  };
};

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
          const res = await fetch('/api/assistant/list');
          const data = await res.json();
          
          if (res.ok) {
            // Normalize the data structure
            const normalizedAssistants = (data.assistants || []).map((assistant: any) => ({
              name: assistant.assistantName || assistant.name,
              metadata: {
                ...assistant.metadata,
                createdAt: assistant.metadata?.createdAt || new Date().toISOString(),
                description: assistant.metadata?.description || 'No description provided'
              }
            }));
            
            // Sort by creation date (newest first)
            normalizedAssistants.sort((a: Assistant, b: Assistant) => {
              return new Date(b.metadata.createdAt || '').getTime() - 
                     new Date(a.metadata.createdAt || '').getTime();
            });
            
            setAssistants(normalizedAssistants);
          } else {
            toast("Failed to load assistants",{
              description: data.error || "Could not retrieve your assistants",
            });
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
      
      const res = await fetch('/api/assistant/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          assistantName: newAssistantName,
          metadata: {
            description: newAssistantDescription
          }
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Add the new assistant to the list
        const newAssistant = {
          name: newAssistantName,
          metadata: {
            owner: user.id,
            createdAt: new Date().toISOString(),
            description: newAssistantDescription || 'No description provided'
          }
        };
        
        setAssistants([newAssistant, ...assistants]);
        setNewAssistantName('');
        setNewAssistantDescription('');
        setCreateDialogOpen(false);
        
        toast("Assistant created",{
          description: `${newAssistantName} has been created successfully`,
        });
      } else {
        toast("Failed to create assistant",{
          description: data.error || "Could not create the assistant",
        });
      }
    } catch (error) {
      console.error('Error creating assistant:', error);
      toast("Error",{
        description: "Something went wrong while creating the assistant",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Handle deleting an assistant
  const handleDeleteAssistant = async (assistantName: string) => {
    try {
      const res = await fetch('/api/assistant/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assistantName }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setAssistants(assistants.filter((a) => a.name !== assistantName));
        toast("Assistant deleted",{
          description: `${assistantName} has been removed`,
        });
      } else {
        toast("Deletion failed",{
          description: data.error || "Could not delete the assistant",
        });
      }
    } catch (error) {
      console.error('Error deleting assistant:', error);
      toast("Error",{
          description: "Something went wrong while deleting the assistant",
        });
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
  };

  // Filter assistants based on search query and selected tab
  const filteredAssistants = assistants.filter(assistant => {
    const matchesSearch = assistant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         assistant.metadata.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-lg">Loading your assistants...</p>
        </div>
      </div>
    );
  }

  // Display login page if not authenticated
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to access your assistants</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button asChild size="lg" className="w-full">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link href="/signup">Create Account</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Assistants</h1>
          <p className="text-muted-foreground mt-1">
            Manage and create AI assistants tailored to your needs
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar>
                  <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuItem disabled>{user.email}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search and controls bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search assistants..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="border rounded-md p-1 flex">
                  <Button 
                    variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                    size="icon" 
                    className="h-9 w-9"
                    onClick={() => setViewMode('grid')}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={viewMode === 'list' ? 'default' : 'ghost'} 
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setViewMode('list')}
                  >
                    <LayoutList className="h-4 w-4" />
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>Change view</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                <span>New Assistant</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Assistant</DialogTitle>
                <DialogDescription>
                  Give your assistant a name and description
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Name
                  </label>
                  <Input
                    id="name"
                    placeholder="e.g., Research Assistant"
                    value={newAssistantName}
                    onChange={(e) => setNewAssistantName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Description
                  </label>
                  <Textarea
                    id="description"
                    placeholder="What can this assistant help with?"
                    value={newAssistantDescription}
                    onChange={(e) => setNewAssistantDescription(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateAssistant} disabled={isCreating}>
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tab navigation for filtering (can be extended in future) */}
      <Tabs defaultValue="all" className="mb-6" onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all">All Assistants</TabsTrigger>
          <TabsTrigger value="favorites" disabled>Favorites</TabsTrigger>
          <TabsTrigger value="shared" disabled>Shared</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* No results state */}
      {filteredAssistants.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-muted rounded-full p-4 mb-4">
            <Bot className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No assistants found</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            {searchQuery ? 
              `No assistants match your search for "${searchQuery}"` : 
              "You don't have any assistants yet. Create your first one to get started."}
          </p>
          {searchQuery ? (
            <Button variant="outline" onClick={() => setSearchQuery('')}>
              Clear search
            </Button>
          ) : (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Assistant
            </Button>
          )}
        </div>
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
                  key={assistant.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="h-full overflow-hidden hover:border-primary/50 transition-all">
                    <Link href={`/assistants/${assistant.name}`} className="h-full flex flex-col">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <Avatar className={cn("h-12 w-12", getAvatarColor(assistant.name))}>
                            <AvatarFallback>{getInitials(assistant.name)}</AvatarFallback>
                          </Avatar>
                          <Badge variant="outline" className="text-xs">
                            {format(new Date(assistant.metadata.createdAt || ''), 'MMM d')}
                          </Badge>
                        </div>
                        <CardTitle className="mt-2 text-xl tracking-normal">{assistant.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <p className="text-muted-foreground text-sm line-clamp-2">
                          {assistant.metadata.description}
                        </p>
                      </CardContent>
                      <CardFooter className="flex items-center justify-between pt-1">
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteAssistant(assistant.name);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="gap-1">
                          <span>Chat</span>
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </CardFooter>
                    </Link>
                  </Card>
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
                  key={assistant.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <Card className="hover:bg-accent/30 transition-all">
                    <Link href={`/assistants/${assistant.name}`} className="flex items-center p-3">
                      <Avatar className={cn("h-10 w-10 mr-4", getAvatarColor(assistant.name))}>
                        <AvatarFallback>{getInitials(assistant.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-grow min-w-0">
                        <p className="font-medium">{assistant.name}</p>
                        <p className="text-muted-foreground text-sm truncate">
                          {assistant.metadata.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                          {format(new Date(assistant.metadata.createdAt || ''), 'MMM d, yyyy')}
                        </Badge>
                        <Button variant="ghost" size="icon"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteAssistant(assistant.name);
                          }}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </Link>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}