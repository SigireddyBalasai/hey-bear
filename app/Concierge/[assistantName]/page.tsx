"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { type AssistantFilesList as _AssistantFilesList } from '@pinecone-database/pinecone';
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from 'sonner';
import { Upload, SendIcon, X, FileText, Loader2, ChevronLeft, User, Bot, Paperclip, Phone } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useDropzone } from "react-dropzone";
import { FileStatusBadge } from "@/components/ui/file-status-badge";
import { FileErrorDialog } from "@/components/ui/file-error-dialog";
import { AssistantPhoneNumberSelector } from '@/components/AssistantPhoneNumberSelector';
import type { Tables } from '@/lib/db.types';

// Types
type AssistantFileStatus = 'ready' | 'processing' | 'failed';

// File type for our internal use
type FileWithStatus = {
  id: string;
  name: string;
  created_at: string;
  status?: string;
  purpose?: string;
};

// Helper function to get current timestamp
const getCurrentTimestamp = () => new Date().toISOString();

const AssistantPage = ({ params }: { params: Promise<{ assistantName: string }> }) => {
  // Add missing state variables
  const [assistantId, setAssistantId] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  
  // State variables
  const [_assistantName, setAssistantName] = useState<string>('');
  const [_pinecone_name, setPineconeName] = useState<string>('');
  const [user, setUser] = useState<{ user_metadata?: { avatar_url?: string } } | null>(null);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string; timestamp: string }[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [isChatDisabled, setIsChatDisabled] = useState(true);
  const [fileList, setFileList] = useState<{ files: FileWithStatus[] }>({ files: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [assignedPhoneNumber, setAssignedPhoneNumber] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("chat");
  const [deletingFileIds, setDeletingFileIds] = useState<string[]>([]);
  const [processingFileIds, setProcessingFileIds] = useState<string[]>([]);
  const [inputType, setInputType] = useState<"file" | "url">("file");
  const [url, setUrl] = useState<string>('');
  const [isUrlValid, setIsUrlValid] = useState<boolean>(true);
  const [fileError, setFileError] = useState<{
    title: string;
    description: string;
    details?: string;
    show: boolean;
  }>({
    title: '',
    description: '',
    show: false
  });
  
  // Add types from Database schema
  const [_configData, setConfigData] = useState<Tables<{ schema: 'assistants'; }, 'assistant_configs'> | null>(null);
  const [_subscriptionData, setSubscriptionData] = useState<Tables<{ schema: 'assistants'; }, 'assistant_subscriptions'> | null>(null);
  const [_usageLimitsData, setUsageLimitsData] = useState<Tables<{ schema: 'assistants'; }, 'assistant_usage_limits'> | null>(null);

  const router = useRouter();
  const supabase = createClient();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch files for the assistant
  const fetchFiles = useCallback(async (id: string, pinecone: string) => {
    if (!id || !pinecone) {
      return;
    }
    
    try {
      const isInitialLoad = isLoading;
      if (isInitialLoad) setIsLoading(true);
      
      // Create a simple array of files instead of a complex object structure
      const fileArray = [
        {
          id: 'file-1',
          name: 'Sample Document.pdf',
          created_at: new Date().toISOString(),
          status: 'ready' as AssistantFileStatus
        },
        {
          id: 'file-2',
          name: 'Getting Started Guide.docx',
          created_at: new Date().toISOString(),
          status: 'ready' as AssistantFileStatus
        }
      ];
      
      setFileList({ files: fileArray });
      setProcessingFileIds([]);
      setIsChatDisabled(false);
    } catch (error) {
      console.error("Failed to fetch files:", error);
      toast("Connection error", {
        description: "Failed to connect to the server. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Load params and fetch assistant details
  useEffect(() => {
    async function loadParams() {
      try {
        const { assistantName } = await params;
        setAssistantId(assistantName); // This is actually the assistant ID from the URL
        
        // Create mock data instead of fetching from API
        const mockAssistantData = {
          assistant: {
            id: assistantName,
            name: "Sample No-Show Assistant",
            assigned_phone_number: "+15555555555",
            pending: false
          },
          config: {
            address: null,
            business_name: null,
            business_phone: null,
            concierge_name: "Sample No-Show",
            concierge_personality: "Business Casual",
            created_at: new Date().toISOString(),
            description: "This is a sample No-Show assistant for demonstration",
            email: null,
            id: `config-${Date.now()}`,
            pinecone_name: "sample-pinecone-index",
            share_phone_number: false,
            subscription_plan: "personal",
            system_prompt: "You are a helpful No-Show assistant designed to provide information based on the documents provided.",
            updated_at: new Date().toISOString(),
            website: null
          },
          subscription: {
            assistant_id: assistantName,
            cancel_at_period_end: false,
            created_at: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            current_period_start: new Date().toISOString(),
            id: `subscription-${Date.now()}`,
            plan_id: "plan_personal",
            status: "active",
            stripe_subscription_id: `sub_${Math.random().toString(36).substring(2, 10)}`,
            updated_at: new Date().toISOString()
          },
          usageLimits: {
            assistant_id: assistantName,
            created_at: new Date().toISOString(),
            document_limit: 100,
            message_limit: 1000,
            token_limit: 100000,
            updated_at: new Date().toISOString(),
            webpage_limit: 50
          }
        };
        
        // Set all the data we need from mock data
        setDisplayName(mockAssistantData.assistant.name);
        setAssistantName(mockAssistantData.assistant.name);
        setAssignedPhoneNumber(mockAssistantData.assistant.assigned_phone_number || mockAssistantData.config?.business_phone || null);
        setPineconeName(mockAssistantData.config?.pinecone_name || '');
        
        // Store all configuration data
        setConfigData(mockAssistantData.config || null);
        setSubscriptionData(mockAssistantData.subscription || null);
        setUsageLimitsData(mockAssistantData.usageLimits || null);
        
        // Update document title
        document.title = `Chat with ${mockAssistantData.assistant.name}`;
        
        // Set system prompt if available
        if (mockAssistantData.config?.system_prompt) {
          setChatHistory([
            {
              role: "system",
              content: mockAssistantData.config.system_prompt,
              timestamp: getCurrentTimestamp()
            }
          ]);
        }
        
        // Fetch files after getting pinecone_name
        if (mockAssistantData.config?.pinecone_name) {
          fetchFiles(assistantName, mockAssistantData.config.pinecone_name);
        }
        
      } catch (error) {
        console.error('Error loading params:', error);
        setIsLoading(false);
        toast.error("Failed to load No-Show", {
          description: "There was an error loading the No-Show details."
        });
      }
    }
    
    loadParams();
  }, [params, router, fetchFiles]);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching user:', error);
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [supabase.auth]);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // File dropzone functionality
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
      }
    },
    maxFiles: 1,
  });

  // Get status for a file - update return types
  const getFileStatus = (file: FileWithStatus): AssistantFileStatus => {
    // Check explicit file status first
    if (file.status) {
      if (file.status.toLowerCase() === 'ready') return 'ready';
      if (file.status.toLowerCase() === 'processing') return 'processing';
      if (file.status.toLowerCase() === 'failed') return 'failed';
    }
    
    // Check implicit status based on ID tracking
    if (deletingFileIds.includes(file.id)) {
      return 'processing';  // Show deleting files as processing
    }
    if (processingFileIds.includes(file.id)) {
      return 'processing';
    }
    
    return 'ready';  // Default status
  };

  // Send message to assistant
  const handleChat = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isChatDisabled || !message.trim() || isSending) return;

    try {
      setIsSending(true);
      // Add user message to chat history
      const userMessage = { role: 'user', content: message, timestamp: getCurrentTimestamp() };
      setChatHistory([...chatHistory, userMessage]);
      setMessage('');
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a mock response instead of API call
      const mockResponse = {
        role: 'assistant',
        content: `This is a mock response to your query: "${message}". In a real implementation, this would come from an AI model.`,
        timestamp: getCurrentTimestamp()
      };
      
      // Add the assistant's response to chat history
      setChatHistory(prev => [...prev, mockResponse]);
      
    } catch (error) {
      console.error("Chat error:", error);
      toast("Communication error", {
        description: "Failed to send your message. Please try again.",
      });
    } finally {
      setIsSending(false);
    }
  }, [isChatDisabled, message, isSending, chatHistory]);

  // Add file to assistant
  const handleAddFile = async () => {
    if (!file) return;
    
    try {
      setIsUploading(true);
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 100);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Create a new mock file array with the added file
      const newFile = {
        id: `file-${Date.now()}`,
        name: file.name,
        created_at: new Date().toISOString()
      };
      
      // Add to processing files
      setProcessingFileIds(prev => [...prev, newFile.id]);
      
      // Update file list with simplified approach to avoid type issues
      // @ts-ignore - We're intentionally simplifying the type structure
      setFileList({
        files: [...(fileList.files || []), newFile]
      });
      
      toast("File uploaded successfully!", {
        description: `${file.name} has been added to the No-Show`,
      });
      setFile(null);
      
      // Simulate file processing completion after delay
      setTimeout(() => {
        setProcessingFileIds(prev => prev.filter(id => id !== newFile.id));
        
        // Update chat disabled status
        if (fileList.files?.length) {
          setIsChatDisabled(false);
        }
      }, 5000);
      
    } catch (error) {
      console.error("File upload error:", error);
      setFileError({
        title: "Upload Error",
        description: "Something went wrong during file upload",
        show: true
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle adding URL to assistant
  const handleAddUrl = async () => {
    try {
      setIsUploading(true);
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 100);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Create mock data for newly added URL
      const newUrlFile = {
        id: `url-${Date.now()}`,
        name: url,
        created_at: new Date().toISOString()
      };
      
      // Add to processing files
      setProcessingFileIds(prev => [...prev, newUrlFile.id]);
      
      // Update file list with simplified approach to avoid type issues
      // @ts-ignore - We're intentionally simplifying the type structure
      setFileList({
        files: [...(fileList.files || []), newUrlFile]
      });
      
      toast("URL added successfully!", {
        description: `${url} has been added to the No-Show`
      });
      setUrl('');
      
      // Simulate file processing completion after delay
      setTimeout(() => {
        setProcessingFileIds(prev => prev.filter(id => id !== newUrlFile.id));
        
        // Update chat disabled status
        if (fileList.files?.length) {
          setIsChatDisabled(false);
        }
      }, 5000);
      
    } catch (error) {
      console.error("URL addition error:", error);
      setFileError({
        title: "URL Error",
        description: "Something went wrong while adding this URL",
        show: true
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Add file or URL to assistant
  const handleAddContent = () => {
    if (inputType === "file") {
      handleAddFile();
    } else {
      handleAddUrl();
    }
  };

  // Delete file from assistant
  const handleDeleteFile = async (fileId: string) => {
    // Add to deletingFileIds immediately for better UX
    setDeletingFileIds(prev => [...prev, fileId]);
    
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update file list to remove the deleted file - using ts-ignore to avoid type issues
      // @ts-ignore - We're intentionally simplifying the type to avoid complex enum issues
      setFileList(prev => ({
        ...prev,
        files: (prev.files || []).filter(f => f.id !== fileId)
      }));
      
      // Remove from deletingFileIds
      setDeletingFileIds(prev => prev.filter(id => id !== fileId));
      
      toast("File deleted successfully", {
        description: "The file has been removed from your No-Show"
      });
      
      // Check if there are any files left
      const remainingFiles = fileList.files?.filter(f => f.id !== fileId);
      if (!remainingFiles?.length) {
        setIsChatDisabled(true);
      }
      
    } catch (error) {
      // Remove from deletingFileIds if there was an error
      setDeletingFileIds(prev => prev.filter(id => id !== fileId));
      
      console.error("Error deleting file:", error);
      toast("Error deleting file", {
        description: error instanceof Error ? error.message : "Failed to delete file"
      });
    }
  };

  // Handle closing the file error dialog
  const closeFileErrorDialog = () => {
    setFileError(prev => ({ ...prev, show: false }));
  };

  // Handle phone number assignment
  const handlePhoneNumberAssigned = (phoneNumber: string) => {
    setAssignedPhoneNumber(phoneNumber || null);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Focus input with / key when not already focused
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      
      // Send with Ctrl+Enter or Cmd+Enter
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && document.activeElement === inputRef.current) {
        handleChat();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [message, isChatDisabled, handleChat]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in state
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to continue using this No-Show </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => router.push('/sign-in')}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Count files by status
  const processingFilesCount = fileList?.files?.filter(
    file => file.status === 'Processing' || processingFileIds.includes(file.id)
  ).length || 0;
  
  return (
    <div className="container mx-auto p-2 md:p-4 h-screen flex flex-col max-w-5xl">
      <div className="flex items-center mb-4 gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => {
            if (activeTab === "files") {
              setActiveTab("chat");
            } else {
              router.push('/Concierge'); // Navigate to assistants page from chat tab
            }
          }}
          className="hover:bg-muted"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold flex-1">
          {displayName}
          {assignedPhoneNumber && (
            <Badge variant="outline" className="ml-2 gap-1 align-middle">
              <Phone className="h-3 w-3" />
              SMS
            </Badge>
          )}
        </h1>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setActiveTab(activeTab === "chat" ? "files" : "chat")}
                className="shadow-sm hover:bg-accent"
              >
                {activeTab === "chat" ? (
                  <><Paperclip className="h-4 w-4 mr-2" /> Manage Knowledge</>
                ) : (
                  <><Bot className="h-4 w-4 mr-2" /> Back to Chat</>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {activeTab === "chat" ? "Manage No-Show Files" : "Return to Chat"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        {/* Chat Tab */}
        <TabsContent value="chat" className="flex-1 flex flex-col space-y-4 mt-0">
          {/* Show processing files indicator if needed */}
          {processingFilesCount > 0 && (
            <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950/70 dark:border-blue-800 shadow-sm">
              <CardContent className="p-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                <p className="text-sm">
                  {processingFilesCount} file(s) being processed. Chat will be available once processing completes.
                </p>
              </CardContent>
            </Card>
          )}
          
          <Card className="flex-1 flex flex-col overflow-hidden border-muted shadow-lg">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8 ring-2 ring-primary/10">
                  <AvatarImage src="/bot-avatar.png" alt="Concierge" />
                  <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{displayName}</CardTitle>
                  <CardDescription className="text-xs flex items-center gap-2">
                    <span>{fileList?.files?.length || 0} file(s) loaded</span>
                    {isChatDisabled && (
                      <Badge variant="outline" className="text-amber-500 border-amber-200 bg-amber-50 dark:bg-amber-950/50 dark:border-amber-900">
                        Chat Disabled
                      </Badge>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-hidden p-0">
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Bot className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">
                    {!fileList?.files?.length ? "Add Files or links to Start" : "Start a conversation"}
                  </h3>
                  <p className="text-muted-foreground max-w-md mt-2">
                    {!fileList?.files?.length 
                      ? "This No-Show needs information to work. Please add at least one file or link."
                      : "Ask me anything about the documents you've provided. I'm here to help!"}
                  </p>
                  {!fileList?.files?.length && (
                    <Button 
                      variant="default"
                      className="mt-6"
                      onClick={() => setActiveTab("files")}
                    >
                      <Paperclip className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  )}
                </div>
              ) : (
                <ScrollArea className="h-full pr-0">
                  <div className="py-4 px-4 space-y-6">
                    {chatHistory.map((msg, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={cn(
                          "flex gap-3 max-w-[85%]",
                          msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                        )}
                      >
                        {msg.role === 'user' ? (
                          <Avatar className="bg-blue-500 text-white ring-4 ring-blue-100 dark:ring-blue-900/30 flex-shrink-0">
                            <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                            <AvatarImage src={user?.user_metadata?.avatar_url} />
                          </Avatar>
                        ) : (
                          <Avatar className="ring-4 ring-accent flex-shrink-0">
                            <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                            <AvatarImage src="/bot-avatar.png" />
                          </Avatar>
                        )}
                        
                        <div className={cn(
                          "flex flex-col space-y-1 rounded-lg p-3 shadow-sm",
                          msg.role === 'user' 
                            ? "bg-primary text-primary-foreground rounded-tr-none"
                            : "bg-muted rounded-tl-none"
                        )}>
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-sm">
                              {msg.role === 'user' ? 'You' : displayName}
                            </p>
                            <span className={cn(
                              "text-xs",
                              msg.role === 'user' ? "text-primary-foreground/80" : "text-muted-foreground"
                            )}>
                              {format(new Date(msg.timestamp), 'h:mm a')}
                            </span>
                          </div>
                          <div className={cn(
                            "whitespace-pre-wrap text-sm leading-relaxed",
                            msg.role === 'user' && "text-primary-foreground"
                          )}>
                            {msg.content}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                </ScrollArea>
              )}
            </CardContent>
            
            <CardFooter className="p-3 border-t bg-card/50">
              <form onSubmit={handleChat} className="w-full flex items-end gap-2">
                <div className="relative flex-1">
                  <Input
                    ref={inputRef}
                    placeholder={!fileList?.files?.length
                      ? "Add files to enable chat functionality..."
                      : (isChatDisabled 
                         ? "Chat disabled - waiting for files to process..." 
                         : "Type your message... (Press / to focus)"
                      )}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={isChatDisabled || isSending}
                    className={cn(
                      "pr-10 py-5 shadow-sm focus-visible:ring-primary",
                      isChatDisabled ? "bg-muted text-muted-foreground" : "bg-background"
                    )}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleChat();
                      }
                    }}
                  />
                  <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-50">
                    {isChatDisabled ? "Disabled" : "/"}
                  </kbd>
                </div>
                <Button 
                  type="submit" 
                  size="icon"
                  disabled={isChatDisabled || !message.trim() || isSending}
                  className={cn(
                    "rounded-full shadow-sm p-3 h-auto",
                    isSending && "animate-pulse"
                  )}
                >
                  {isSending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <SendIcon className="h-5 w-5" />
                  )}
                  <span className="sr-only">Send</span>
                </Button>
              </form>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="flex-1 flex flex-col space-y-4 mt-0">
          <Card className="flex-1 flex flex-col overflow-hidden border-muted shadow-lg">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Knowledge Files</CardTitle>
                  <CardDescription className="text-xs">
                    Add documents or URLs to teach your No-Show 
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-hidden p-0">
              <div className="p-4">
                <div className="flex gap-2 mb-4">
                  <Button
                    variant={inputType === "file" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setInputType("file")}
                  >
                    <FileText className="h-4 w-4 mr-2" /> File Upload
                  </Button>
                  <Button
                    variant={inputType === "url" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setInputType("url")}
                  >
                    <Link className="h-4 w-4 mr-2" /> URL Import
                  </Button>
                </div>
                
                {inputType === "file" ? (
                  <div className="mb-6">
                    <div
                      {...getRootProps()}
                      className={cn(
                        "border-2 border-dashed rounded-lg p-8 transition-colors cursor-pointer",
                        isDragActive 
                          ? "border-primary bg-primary/10" 
                          : "border-muted-foreground/20 hover:border-primary/50"
                      )}
                    >
                      <input {...getInputProps()} />
                      <div className="flex flex-col items-center justify-center gap-3 text-center">
                        <Upload className="h-10 w-10 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {file ? file.name : "Drop file here or click to upload"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PDF, TXT, DOCX, PPTX, and more (max 20MB)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="url-input">Website URL</Label>
                      <Input
                        id="url-input"
                        placeholder="https://example.com/page"
                        value={url}
                        onChange={(e) => {
                          setUrl(e.target.value);
                          setIsUrlValid(e.target.validity.valid);
                        }}
                        pattern="https?://.+"
                        className={!isUrlValid && url ? "border-red-500" : ""}
                      />
                      {!isUrlValid && url && (
                        <p className="text-xs text-red-500">Please enter a valid URL (must start with http:// or https://)</p>
                      )}
                    </div>
                  </div>
                )}
                
                {(file || (url && isUrlValid)) && (
                  <>
                    {isUploading && (
                      <div className="mb-4">
                        <Label className="text-xs text-muted-foreground mb-1 block">
                          Upload progress
                        </Label>
                        <Progress value={uploadProgress} className="h-2" />
                      </div>
                    )}
                    <Button
                      onClick={handleAddContent}
                      disabled={isUploading}
                      className="w-full"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {inputType === "file" ? "Uploading..." : "Processing..."}
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          {inputType === "file" ? "Upload File" : "Add URL"}
                        </>
                      )}
                    </Button>
                  </>
                )}
                
                <div className="mt-6">
                  <Label className="text-sm font-medium">
                    Files ({fileList?.files?.length || 0})
                  </Label>
                  {fileList?.files?.length === 0 ? (
                    <div className="border rounded-md p-8 text-center mt-2">
                      <p className="text-muted-foreground">
                        No files uploaded yet
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {fileList?.files?.map((file) => {
                        const status = getFileStatus(file);
                        const isDeleting = status === 'processing' && deletingFileIds.includes(file.id);
                        const isProcessing = status === 'processing' && !isDeleting;
                        
                        return (
                          <div 
                            key={file.id} 
                            className="flex items-center justify-between p-3 rounded-md border border-muted bg-card/50 shadow-sm"
                          >
                            <div className="flex items-center gap-3 truncate">
                              <FileText className="h-5 w-5 text-blue-500" />
                              <div className="truncate">
                                <p className="font-medium truncate">{file.name || "Unnamed File"}</p>
                                <p className="text-xs text-muted-foreground">
                                  {file.purpose || "File"} • {new Date(file.created_at || Date.now()).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <FileStatusBadge status={status} />
                              
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      disabled={isDeleting || isProcessing}
                                      onClick={() => handleDeleteFile(file.id)}
                                      className="text-muted-foreground hover:text-destructive h-8 w-8"
                                    >
                                      {isDeleting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <X className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {isDeleting ? "Deleting..." : "Delete file"}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between p-3 border-t bg-card/50">
              {assignedPhoneNumber ? (
                <Badge variant="outline" className="gap-1">
                  <Phone className="h-3 w-3" />
                  SMS Enabled: {assignedPhoneNumber}
                </Badge>
              ) : (
                <AssistantPhoneNumberSelector 
                  assistantId={assistantId}
                  onPhoneNumberAssigned={handlePhoneNumberAssigned}
                />
              )}
              
              <Button variant="ghost" size="sm" onClick={() => setActiveTab("chat")}>
                <Bot className="h-4 w-4 mr-2" />
                Back to Chat
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      <FileErrorDialog
        title={fileError.title}
        description={fileError.description}
        details={fileError.details}
        open={fileError.show}
        onClose={closeFileErrorDialog}
      />
    </div>
  );
};

export default AssistantPage;

// Helper components
const Link = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
};


