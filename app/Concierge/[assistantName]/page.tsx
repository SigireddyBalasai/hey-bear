"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { AssistantFilesList } from '@pinecone-database/pinecone';
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from 'sonner';
import { Upload, SendIcon, X, FileText, Loader2, ChevronLeft, User, Bot, Paperclip, Info, Clock, Phone } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useDropzone } from "react-dropzone";
import { FileStatusBadge } from "@/components/ui/file-status-badge";
import { ProcessingFileIndicator } from "@/components/processing-file-indicator";
import { FileErrorDialog } from "@/components/ui/file-error-dialog";
import { AssistantPhoneNumberSelector } from '@/app/components/AssistantPhoneNumberSelector';

// Replace the constant date with a function to ensure consistency on the client side
const getCurrentTimestamp = () => {
  return new Date().toISOString();
};

const AssistantPage = ({ params }: { params: Promise<{ assistantName: string }> }) => {
  // State variables
  const [assistantName, setAssistantName] = useState<string>('');
  const [assistantId, setAssistantId] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('Loading...');
  const [pinecone_name, setPineconeName] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string; timestamp: string }[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [isChatDisabled, setIsChatDisabled] = useState(true);
  const [fileList, setFileList] = useState<AssistantFilesList>({ files: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [assignedPhoneNumber, setAssignedPhoneNumber] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("chat");
  const [deletingFileIds, setDeletingFileIds] = useState<string[]>([]);
  const [processingFileIds, setProcessingFileIds] = useState<string[]>([]);
  const [statusPollingInterval, setStatusPollingInterval] = useState<NodeJS.Timeout | null>(null);
  // Add new state variables for URL input
  const [inputType, setInputType] = useState<"file" | "url">("file");
  const [url, setUrl] = useState<string>('');
  const [isUrlValid, setIsUrlValid] = useState<boolean>(true);
  const [urlErrorMessage, setUrlErrorMessage] = useState<string>('');
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
  
  const router = useRouter();
  const supabase = createClient();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load params and fetch assistant details
  useEffect(() => {
    async function loadParams() {
      try {
        const { assistantName } = await params;
        setAssistantId(assistantName); // This is actually the assistant ID from the URL
        
        // Fetch assistant details from Supabase
        const supabase = createClient();
        const { data, error } = await supabase
          .from('assistants')
          .select('id, name, pinecone_name, params, assigned_phone_number')
          .eq('id', assistantName)
          .single();
        
        if (error) {
          console.error('Error fetching No-Show:', error);
          toast.error("No-Show unavailable", {
            description: "The No-Show you tried to access is disabled or doesn't exist"
          });
          router.push('/Concierge');
          return;
        }
        
        if (!data) {
          toast.error("No-Show not found", {
            description: "This No-Show no longer exists or has been disabled."
          });
          router.push('/Concierge');
          return;
        }
        
        // Check if the assistant is pending (payment not completed)
        const isPending = typeof data.params === 'object' && 
                         data.params !== null &&
                         'pending' in data.params &&
                         data.params.pending === true;
        
        if (isPending) {
          toast.error("Payment required", {
            description: "This No-Show requires payment to be activated. Please complete checkout."
          });
          router.push('/Concierge');
          return;
        }
        
        if (data) {
          setDisplayName(data.name);
          setAssistantName(data.name);
          setPineconeName(data.pinecone_name || '');
          setAssignedPhoneNumber(data.assigned_phone_number || null);
          
          // Update document title
          document.title = `Chat with ${data.name}`;
        } else {
          toast.error("No-Show not found", {
            description: "This No-Show no longer exists or has been disabled."
          });
          router.push('/dashboard');
          return;
        }
      } catch (error) {
        console.error('Error loading No-Show details:', error);
        toast.error("No-Show error", {
          description: "Unable to load this No-Show. Redirecting to No-Show page."
        });
        router.push('/dashboard');
      }
    }
    loadParams();
  }, [params, router]);

  useEffect(() => {
    const getAssistant = async () => {
      try {
        // Await the params promise to get the actual assistantName
        const { assistantName } = await params;
        
        const { data, error } = await supabase
          .from('assistants')
          .select('*')
          .eq('name', assistantName)
          .single();

        if (error) {
          console.error("Error fetching No-Show:", error);
          toast.error("Failed to load No-Show details.");
        }

        if (data) {
          setDisplayName(data.name);
          setAssistantName(data.name);
          setPineconeName(data.pinecone_name || '');
          setAssignedPhoneNumber(data.assigned_phone_number || null);
        }
      } catch (error) {
        console.error("Unexpected error:", error);
        toast.error("Failed to load No-Show details due to an unexpected error.");
      } finally {
        setIsLoading(false);
      }
    };

    getAssistant();
  }, [params, supabase]);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);
    };
    fetchUser();
  }, []);

  // Clean up polling on component unmount
  useEffect(() => {
    return () => {
      if (statusPollingInterval) {
        clearInterval(statusPollingInterval);
      }
    };
  }, [statusPollingInterval]);

  // Start polling for file status changes
  const startStatusPolling = () => {
    // Clear any existing interval
    if (statusPollingInterval) {
      clearInterval(statusPollingInterval);
    }

    // Create new polling interval
    const intervalId = setInterval(() => {
      fetchFiles();
    }, 5000); // Poll every 5 seconds
    
    setStatusPollingInterval(intervalId);
    
    // Stop polling after 5 minutes to prevent infinite polling
    setTimeout(() => {
      clearInterval(intervalId);
      setStatusPollingInterval(null);
    }, 5 * 60 * 1000);
  };

  // Fetch files for the assistant
  const fetchFiles = async () => {
    if (!assistantId || !pinecone_name) {
      return;
    }
    
    if (pinecone_name) {
      try {
        const isInitialLoad = isLoading;
        if (isInitialLoad) setIsLoading(true);
        
        const res = await fetch('/api/Concierge/file/list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            assistantId: assistantId,
            pinecone_name: pinecone_name 
          }),
        });

        const data = await res.json();
        if (res.ok) {
          console.log('Fetched files:', data.files); // Keep for debugging
          setFileList(data.files);
          
          // Track files with various statuses
          if (data.files?.files) {
            // Track Processing files
            const filesInProcessing = data.files.files
              .filter((file: any) => file.status === 'Processing')
              .map((file: any) => file.id);
            setProcessingFileIds(filesInProcessing);
            
            // Track Deleting files
            const filesInDeletion = data.files.files
              .filter((file: any) => file.status === 'Deleting')
              .map((file: any) => file.id);
            setDeletingFileIds(filesInDeletion);
            
            // If there are files in processing or deleting, ensure polling is active
            if (filesInProcessing.length > 0 || filesInDeletion.length > 0) {
              if (!statusPollingInterval) {
                startStatusPolling();
              }
            } else if (statusPollingInterval) {
              // Stop polling if no more files need monitoring
              clearInterval(statusPollingInterval);
              setStatusPollingInterval(null);
            }
            }

          // Determine if chat should be disabled
          const readyFiles = data.files?.files?.filter(
              (file: any) => file.status !== 'Processing' && file.status !== 'Deleting'
            );
          setIsChatDisabled(readyFiles?.length === 0);
        } else {
          console.error("Error fetching files:", data.error);
          toast("Error fetching files",{
            description: data.error || "Could not retrieve files for this No-Show ",
          });
          setIsChatDisabled(true);
          setFileList({ files: [] });
        }
      } catch (error) {
        console.error("Failed to fetch files:", error);
        toast("Connection error",{
          description: "Failed to connect to the server. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  useEffect(() => {
    if (pinecone_name && assistantId) {
      fetchFiles();
    }
  }, [pinecone_name, assistantId]);

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

  // Get status for a file
  const getFileStatus = (file: any) => {
    // Check explicit file status
    if (file.status) {
      return file.status;
    }
    
    // Check implicit status based on ID tracking
    if (deletingFileIds.includes(file.id)) {
      return 'Deleting';
    }
    if (processingFileIds.includes(file.id)) {
      return 'Processing';
    }
    
    // Default status
    return 'Ready';
  };

  // Send message to assistant
  const handleChat = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isChatDisabled || !message.trim() || isSending) return;

    try {
      setIsSending(true);
      const userMessage = { role: 'user', content: message, timestamp: getCurrentTimestamp() };
      setChatHistory([...chatHistory, userMessage]);
      setMessage('');
      
      const res = await fetch('/api/Concierge/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          assistantId: assistantId,
          message 
        }),
      });
      
      const data = await res.json();
      if (res.ok && data.response) {
        setChatHistory(prev => [
          ...prev, 
          { role: 'assistant', content: data.response, timestamp: getCurrentTimestamp() }
        ]);
      } else {
        toast("Failed to get response", {
          description: data.error || "The No-Show couldn't process your request",
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast("Communication error", {
        description: "Failed to send your message. Please try again.",
      });
    } finally {
      setIsSending(false);
    }
  }, [isChatDisabled, message, isSending, assistantId, chatHistory]);

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
      
      const formData = new FormData();
      formData.append('assistantId', assistantId);
      formData.append('pinecone_name', pinecone_name);
      formData.append('file', file);
      
      const res = await fetch('/api/Concierge/file/add', {
        method: 'POST',
        body: formData,
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      const data = await res.json();
      if (res.ok) {
        toast("File uploaded successfully!",{
          description: `${file.name} has been added to the No-Show `,
        });
        setFile(null);
        await fetchFiles(); // Refresh files list
        startStatusPolling(); // Start polling for status changes
      } else {
        // Show file error dialog with server error details
        setFileError({
          title: "File Upload Error",
          description: data.error || "Failed to upload file",
          details: data.details || undefined,
          show: true
        });
      }
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

  // Handle URL validation
  const validateUrl = (input: string): boolean => {
    // Reset error message
    setUrlErrorMessage('');

    // Empty URL
    if (!input.trim()) {
      setIsUrlValid(false);
      setUrlErrorMessage('URL cannot be empty');
      return false;
    }

    try {
      const urlObj = new URL(input);
      
      // Basic URL validation - must be http or https protocol
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        setIsUrlValid(false);
        setUrlErrorMessage('URL must use http:// or https:// protocol');
        return false;
      }

      setIsUrlValid(true);
      return true;
    } catch (e) {
      setIsUrlValid(false);
      setUrlErrorMessage('Please enter a valid URL (e.g., https://example.com/document)');
      return false;
    }
  };

  // Handle adding URL to assistant
  const handleAddUrl = async () => {
    // Validate URL before proceeding
    if (!validateUrl(url)) {
      return;
    }
    
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
      
      const res = await fetch('/api/Concierge/file/add-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assistantId,
          pinecone_name,
          url
        }),
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      const data = await res.json();
      if (res.ok) {
        toast("URL added successfully!",{
          description: `${url} has been added to the No-Show `,
        });
        setUrl('');
        await fetchFiles(); // Refresh files list
        startStatusPolling(); // Start polling for status changes
      } else {
        // Show file error dialog with server error details
        const errorMsg = data.error || "Failed to add URL";
        const errorDetails = data.details || 
          (res.status === 500 ? "The server encountered an error processing your request. The service might be temporarily unavailable." : undefined);

        setFileError({
          title: "URL Addition Error",
          description: errorMsg,
          details: errorDetails,
          show: true
        });
      }
    } catch (error) {
      console.error("URL addition error:", error);
      setFileError({
        title: "URL Error",
        description: "Something went wrong while adding this URL. The server might be temporarily unavailable.",
        details: "Please try again later or contact support if the problem persists.",
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
      const res = await fetch('/api/Concierge/file/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          assistantId: assistantId,
          pinecone_name: pinecone_name,
          fileId 
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast("File deletion initiated",{
          description: data.message || "The file is being deleted",
        });
        startStatusPolling(); // Start polling for status changes
      } else {
        // Remove from deletingFileIds if there was an error
        setDeletingFileIds(prev => prev.filter(id => id !== fileId));
        
        toast("Deletion failed",{
          description: data.error || "Could not delete the file",
        });
      }
    } catch (error: any) {
      // Remove from deletingFileIds if there was an error
      setDeletingFileIds(prev => prev.filter(id => id !== fileId));
      
      console.error("Error deleting file:", error);
      toast("Error deleting file",{
        description: error.message || "Failed to delete file",
      });
    }
  };

  // Sign out user
  const handleSignOut = async () => {
    if (statusPollingInterval) {
      clearInterval(statusPollingInterval);
    }
    await supabase.auth.signOut();
    setUser(null);
    router.push('/sign-in');
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
                    "h-10 w-10 shadow-sm transition-all",
                    (isChatDisabled || !fileList?.files?.length) 
                      ? "opacity-50 cursor-not-allowed" 
                      : "hover:shadow-md"
                  )}
                  aria-label={!fileList?.files?.length ? "Add files first" : "Send message"}
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <SendIcon className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </CardFooter>
          </Card>
          
          {/* Only show this warning if we have files but they're all processing */}
          {isChatDisabled && processingFilesCount > 0 && (fileList?.files?.length ?? 0) > 0 && (
            <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950/70 dark:border-amber-900 shadow-sm">
              <CardContent className="p-3 flex items-center gap-2">
                <Info className="h-4 w-4 text-amber-500" />
                <p className="text-sm">Chat will be enabled once file processing is complete.</p>
              </CardContent>
            </Card>
          )}

          {/* Phone Number Assignment Section */}
          <Card className="border-muted shadow-sm">
            <CardContent className="p-4">
              <AssistantPhoneNumberSelector 
                assistantId={assistantId}
                onAssigned={handlePhoneNumberAssigned}
                currentPhoneNumber={assignedPhoneNumber}
                // webhookUrl={`${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/api/twilio/webhook?assistantId=${assistantId}`}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="flex-1 flex flex-col space-y-4 mt-0">
          <Card className="flex-1 flex flex-col border-muted shadow-lg">
            <CardHeader className="border-b">
              <CardTitle>Manage Knowledge</CardTitle>
              <CardDescription>
                Add or remove files for or links to use in conversations
              </CardDescription>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-4">
              {/* Input Type Selection */}
              <div className="mb-4">
                <Tabs 
                  value={inputType} 
                  onValueChange={(value) => setInputType(value as "file" | "url")}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="file">Upload File</TabsTrigger>
                    <TabsTrigger value="url">Add URL</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* File Upload Area */}
              {inputType === "file" && (
                <div 
                  {...getRootProps()} 
                  className={cn(
                    "border-2 border-dashed rounded-xl p-6 mb-6 cursor-pointer transition-all",
                    isDragActive 
                      ? "border-primary bg-primary/10 shadow-inner" 
                      : "border-muted-foreground/25 hover:border-primary/50 hover:shadow"
                  )}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center justify-center space-y-2 text-center">
                    <div className={cn(
                      "rounded-full p-3 transition-all",
                      isDragActive ? "bg-primary/20" : "bg-muted"
                    )}>
                      <Upload className={cn(
                        "h-8 w-8 transition-transform",
                        isDragActive ? "text-primary scale-110" : "text-muted-foreground"
                      )} />
                    </div>
                    <h3 className="font-semibold text-lg">
                      {isDragActive ? "Drop file here" : "Drag & drop a file"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Or click to browse your device
                    </p>
                    {file && (
                      <Badge variant="secondary" className="mt-2 px-3 py-1 shadow-sm">
                        <FileText className="h-3 w-3 mr-1" /> {file.name}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* URL Input Area */}
              {inputType === "url" && (
                <div className="mb-6 space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="url-input">Enter a URL to add</Label>
                    <Input
                      id="url-input"
                      type="url"
                      placeholder="https://example.com/document.pdf"
                      value={url}
                      onChange={(e) => {
                        setUrl(e.target.value);
                        if (!isUrlValid) {
                          validateUrl(e.target.value);
                        }
                      }}
                      onBlur={() => validateUrl(url)}
                      className={cn(
                        !isUrlValid && "border-red-500 focus-visible:ring-red-500"
                      )}
                    />
                    {!isUrlValid && (
                      <p className="text-sm text-red-500">
                        {urlErrorMessage || "Please enter a valid URL"}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Add a direct link to a publicly accessible document or webpage
                    </p>
                  </div>
                </div>
              )}

              {/* File Upload Progress */}
              {isUploading && (
                <div className="mb-6 space-y-2 p-3 bg-muted/50 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span>
                        {inputType === "file" 
                          ? `Uploading ${file?.name}` 
                          : `Processing ${url}`}
                      </span>
                    </div>
                    <span className="font-medium">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              {/* Add Button */}
              {((inputType === "file" && file) || (inputType === "url" && url)) && !isUploading && (
                <Button 
                  onClick={handleAddContent} 
                  className="mb-6 shadow-sm"
                  disabled={isUploading || (inputType === "url" && !isUrlValid)}
                >
                  {isUploading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                  ) : (
                    <>Add {inputType === "file" ? "File" : "URL"}</>
                  )}
                </Button>
              )}

              {/* File List */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Current Files</h3>
                  {(fileList?.files?.length ?? 0) > 0 && (
                    <Badge variant="outline">
                      {fileList?.files?.length} file{fileList?.files?.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                <ScrollArea className="h-[300px] rounded-md border">
                  {fileList?.files?.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                        <FileText className="h-6 w-6" />
                      </div>
                      <p className="font-medium">No files added yet</p>
                      <p className="text-sm mt-1">Add files to enable chat functionality</p>
                    </div>
                  ) : (
                    <ul className="p-1">
                      {fileList?.files?.map((file, index) => {
                        const fileStatus = getFileStatus(file);
                        const isProcessing = fileStatus === 'Processing';
                        const isDeleting = fileStatus === 'Deleting';
                        const isActionable = !isProcessing && !isDeleting;
                        
                        return (
                          <li
                            key={index}
                            className={cn(
                              "flex flex-col p-3 rounded-md transition-colors mb-1",
                              isProcessing 
                                ? "bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800/50" 
                                : isDeleting
                                  ? "bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800/50"
                                  : "hover:bg-accent hover:text-accent-foreground"
                            )}
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center flex-1 min-w-0">
                                <div className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mr-3",
                                  isProcessing ? "bg-blue-100 dark:bg-blue-900/30" :
                                  isDeleting ? "bg-amber-100 dark:bg-amber-900/30" : 
                                  "bg-muted"
                                )}>
                                  <FileText className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm font-medium truncate block">
                                    {file.name}
                                  </span>
                                  {!isProcessing && !isDeleting && (
                                    <span className="text-xs text-muted-foreground">Ready to use</span>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteFile(file.id)}
                                disabled={!isActionable}
                                className="flex-shrink-0 h-8 w-8"
                              >
                                {isDeleting ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : isProcessing ? (
                                  <Clock className="h-4 w-4" />
                                ) : (
                                  <X className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            
                            {/* Show status badge */}
                            {(fileStatus && fileStatus !== 'Ready') && (
                              <div className="mt-2 ml-11">
                                <FileStatusBadge 
                                  status={fileStatus} 
                                  percentDone={file.percentDone ?? undefined}
                                />
                                {isProcessing && (file.percentDone ?? 0) > 0 && (
                                  <div className="mt-2">
                                    <Progress value={file.percentDone} className="h-1" />
                                  </div>
                                )}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
          
          {/* Phone Number Assignment Section */}
          <Card className="border-muted shadow-sm">
            <CardHeader className="border-b">
              <CardTitle>SMS Capability</CardTitle>
              <CardDescription>
                Assign a phone number to enable SMS interactions
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <AssistantPhoneNumberSelector 
                assistantId={assistantId}
                onAssigned={handlePhoneNumberAssigned}
                currentPhoneNumber={assignedPhoneNumber}
                // webhookUrl={`${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/api/twilio/webhook?assistantId=${assistantId}`}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="mt-4 flex justify-between items-center py-2">
        <p className="text-xs text-muted-foreground">
          Connected as {user?.email}
        </p>
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>
      
      {/* File Error Dialog */}
      <FileErrorDialog
        open={fileError.show}
        onClose={closeFileErrorDialog}
        title={fileError.title}
        description={fileError.description}
        details={fileError.details}
      />
    </div>
  );
};

export default AssistantPage;


