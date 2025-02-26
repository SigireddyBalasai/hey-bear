"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { AssistantFilesList } from '@pinecone-database/pinecone';
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from 'sonner';
import { Upload, SendIcon, X, FileText, Loader2, ChevronLeft, User, Bot, Paperclip, Info, Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useDropzone } from "react-dropzone";
import { FileStatusBadge } from "@/components/ui/file-status-badge";
import { ProcessingFileIndicator } from "@/components/processing-file-indicator";

const AssistantPage = ({ params }: { params: Promise<{ assistantName: string }> }) => {
  // State variables
  const [assistantName, setAssistantName] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string; timestamp: Date }[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [isChatDisabled, setIsChatDisabled] = useState(false);
  const [fileList, setFileList] = useState<AssistantFilesList>({ files: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("chat");
  const [deletingFileIds, setDeletingFileIds] = useState<string[]>([]);
  const [processingFileIds, setProcessingFileIds] = useState<string[]>([]);
  const [statusPollingInterval, setStatusPollingInterval] = useState<NodeJS.Timeout | null>(null);
  
  const router = useRouter();
  const supabase = createClient();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load params
  useEffect(() => {
    async function loadParams() {
      const { assistantName } = await params;
      setAssistantName(assistantName);
    }
    loadParams();
  }, [params]);

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
    if (assistantName) {
      try {
        const isInitialLoad = isLoading;
        if (isInitialLoad) setIsLoading(true);
        
        const res = await fetch('/api/assistant/file/list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assistantName }),
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
          setIsChatDisabled(true);
          setFileList({ files: [] });
          toast("Error fetching files",{
            description: data.error || "Could not retrieve files for this assistant",
          });
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
    fetchFiles();
  }, [assistantName]);

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
  const handleChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isChatDisabled || !message.trim() || isSending) return;

    try {
      setIsSending(true);
      const userMessage = { role: 'user', content: message, timestamp: new Date() };
      setChatHistory([...chatHistory, userMessage]);
      setMessage('');

      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assistantName, message }),
      });
      
      const data = await res.json();
      if (res.ok && data.response) {
        setChatHistory(prev => [
          ...prev, 
          { role: 'assistant', content: data.response, timestamp: new Date() }
        ]);
      } else {
        toast("Failed to get response",{
          description: data.error || "The assistant couldn't process your request",
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast("Communication error",{
        description: "Failed to send your message. Please try again.",
      });
    } finally {
      setIsSending(false);
    }
  };

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
      formData.append('assistantName', assistantName);
      formData.append('file', file);
      
      const res = await fetch('/api/assistant/file/add', {
        method: 'POST',
        body: formData,
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      const data = await res.json();
      if (res.ok) {
        toast("File uploaded successfully!",{
          description: `${file.name} has been added to the assistant.`,
        });
        setFile(null);
        await fetchFiles(); // Refresh files list
        startStatusPolling(); // Start polling for status changes
      } else {
        toast("Upload failed",{
          description: data.error || "Failed to upload file",
        });
      }
    } catch (error) {
      console.error("File upload error:", error);
      toast("Upload error",{
        description: "Something went wrong during file upload",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Delete file from assistant
  const handleDeleteFile = async (fileId: string) => {
    // Add to deletingFileIds immediately for better UX
    setDeletingFileIds(prev => [...prev, fileId]);
    
    try {
      const res = await fetch('/api/assistant/file/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assistantName, fileId }),
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
          <p className="text-lg">Loading assistant...</p>
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
            <CardDescription>Please log in to continue using this assistant</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => router.push('/login')}>
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
    <div className="container mx-auto p-2 md:p-4 h-screen flex flex-col">
      <div className="flex items-center mb-4 gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold flex-1">{assistantName}</h1>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setActiveTab(activeTab === "chat" ? "files" : "chat")}
              >
                {activeTab === "chat" ? (
                  <><Paperclip className="h-4 w-4 mr-2" /> Manage Files</>
                ) : (
                  <><Bot className="h-4 w-4 mr-2" /> Back to Chat</>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {activeTab === "chat" ? "Manage Assistant Files" : "Return to Chat"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        {/* Chat Tab */}
        <TabsContent value="chat" className="flex-1 flex flex-col space-y-4 mt-0">
          {/* Show processing files indicator if needed */}
          
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/bot-avatar.png" alt="Assistant" />
                  <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{assistantName}</CardTitle>
                  <CardDescription className="text-xs">
                    {fileList?.files?.length || 0} file(s) loaded
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-hidden">
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <Bot className="h-16 w-16 mb-4 text-muted-foreground" />
                  <h3 className="font-semibold text-lg">Start a conversation</h3>
                  <p className="text-muted-foreground max-w-md mt-2">
                    Ask me anything about the documents you've provided. I'm here to help!
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-full pr-4">
                  <div className="space-y-4 pb-4">
                    {chatHistory.map((msg, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={cn(
                          "flex items-start gap-3 rounded-lg p-3",
                          msg.role === 'user' ? "bg-muted" : "bg-accent"
                        )}
                      >
                        {msg.role === 'user' ? (
                          <Avatar>
                            <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                            <AvatarImage src={user?.user_metadata?.avatar_url} />
                          </Avatar>
                        ) : (
                          <Avatar>
                            <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                            <AvatarImage src="/bot-avatar.png" />
                          </Avatar>
                        )}
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">
                              {msg.role === 'user' ? 'You' : assistantName}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {format(msg.timestamp, 'h:mm a')}
                            </span>
                          </div>
                          <div className="whitespace-pre-wrap text-sm">
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
            
            <CardFooter className="pt-3 pb-3">
              <form onSubmit={handleChat} className="w-full flex items-end gap-2">
                <div className="relative flex-1">
                  <Input
                    ref={inputRef}
                    placeholder={isChatDisabled 
                      ? "Add files to start chatting..." 
                      : "Type your message... (Press / to focus)"
                    }
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={isChatDisabled || isSending}
                    className="pr-10"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleChat();
                      }
                    }}
                  />
                  <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-50">
                    /
                  </kbd>
                </div>
                <Button 
                  type="submit" 
                  size="icon"
                  disabled={isChatDisabled || !message.trim() || isSending}
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
          
          {isChatDisabled && processingFilesCount === 0 && (
            <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-900">
              <CardContent className="p-3 flex items-center gap-2">
                <Info className="h-4 w-4 text-amber-500" />
                <p className="text-sm">This assistant needs files to work. Switch to the Files tab to add documents.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="flex-1 flex flex-col space-y-4 mt-0">
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <CardTitle>Manage Files</CardTitle>
              <CardDescription>
                Add or remove files for {assistantName} to use in conversations
              </CardDescription>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col">
              {/* File Upload Area */}
              <div 
                {...getRootProps()} 
                className={cn(
                  "border-2 border-dashed rounded-xl p-6 mb-6 cursor-pointer transition-colors",
                  isDragActive 
                    ? "border-primary bg-primary/10" 
                    : "border-muted-foreground/25 hover:border-primary/50"
                )}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center justify-center space-y-2 text-center">
                  <Upload className={cn(
                    "h-10 w-10 mb-2 transition-transform",
                    isDragActive ? "text-primary scale-110" : "text-muted-foreground"
                  )} />
                  <h3 className="font-medium text-lg">
                    {isDragActive ? "Drop file here" : "Drag & drop a file"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Or click to browse
                  </p>
                  {file && (
                    <Badge variant="outline" className="mt-2 px-3 py-1">
                      <FileText className="h-3 w-3 mr-1" /> {file.name}
                    </Badge>
                  )}
                </div>
              </div>

              {/* File Upload Progress */}
              {isUploading && (
                <div className="mb-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading {file?.name}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              {file && !isUploading && (
                <Button 
                  onClick={handleAddFile} 
                  className="mb-6"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
                  ) : (
                    <>Add File</>
                  )}
                </Button>
              )}

              {/* File List */}
              <div className="flex-1">
                <h3 className="font-medium mb-2">Current Files</h3>
                <ScrollArea className="h-[300px] rounded-md border">
                  {fileList?.files?.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2" />
                      <p>No files added yet</p>
                      <p className="text-sm">Add files to enable chat functionality</p>
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
                              "flex flex-col p-2 rounded-md transition-colors",
                              isProcessing 
                                ? "bg-blue-50/50 dark:bg-blue-950/30" 
                                : isDeleting
                                  ? "bg-amber-50/50 dark:bg-amber-950/30"
                                  : "hover:bg-accent hover:text-accent-foreground"
                            )}
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center flex-1 min-w-0">
                                <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span className="text-sm font-medium truncate max-w-[180px]">
                                  {file.name}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteFile(file.id)}
                                disabled={!isActionable}
                                className="flex-shrink-0"
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
                              <div className="mt-1 ml-6">
                                <FileStatusBadge 
                                  status={fileStatus} 
                                  percentDone={file.percentDone ?? undefined}
                                />
                                {isProcessing && (file.percentDone ?? 0) > 0 && (
                                  <div className="mt-1">
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
    </div>
  );
};

export default AssistantPage;