'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';

import { useRouter } from 'next/navigation';

import { motion } from 'framer-motion';
import {
  Bot,
  ChevronLeft,
  FileText,
  Loader2,
  Paperclip,
  Phone,
  SendIcon,
  Upload,
  User,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { AssistantPhoneNumberSelector } from '@/components/AssistantPhoneNumberSelector';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FileErrorDialog } from '@/components/ui/file-error-dialog';
import { FileStatusBadge } from '@/components/ui/file-status-badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Database } from '@/lib/db.types';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';

// Types
type AssistantFileStatus = 'ready' | 'processing' | 'failed';

// Database types
type AssistantRow = Database['public']['Tables']['assistants']['Row'];
type AssistantConfig = Database['public']['Tables']['assistant_configs']['Row'];
type AssistantUsageLimits = Database['public']['Tables']['assistant_usage_limits']['Row'];

// Full assistant data with joins
interface AssistantWithRelations {
  assistant: AssistantRow;
  config: AssistantConfig | null;
  usageLimits: AssistantUsageLimits | null;
}

// File type for our internal use (mapped from database)
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
  const [pineconeName, setPineconeName] = useState<string>('');
  const [user, setUser] = useState<{ user_metadata?: { avatar_url?: string } } | null>(null);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<
    { role: string; content: string; timestamp: string }[]
  >([]);
  const [file, setFile] = useState<File | null>(null);
  const [isChatDisabled, setIsChatDisabled] = useState(true);
  const [fileList, setFileList] = useState<{ files: FileWithStatus[] }>({ files: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [assignedPhoneNumber, setAssignedPhoneNumber] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [deletingFileIds, setDeletingFileIds] = useState<string[]>([]);
  const [processingFileIds, setProcessingFileIds] = useState<string[]>([]);
  const [inputType, setInputType] = useState<'file' | 'url'>('file');
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
    show: false,
  });

  const router = useRouter();
  const supabase = createClient();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch files for the assistant from database
  const fetchFiles = useCallback(
    async (assistantId: string, _pinecone?: string) => {
      if (!assistantId) {
        return;
      }

      try {
        const isInitialLoad = isLoading;
        if (isInitialLoad) setIsLoading(true);

        // Use type assertion to bypass restrictive Supabase types
        const supabaseClient = supabase as unknown as {
          from: (table: string) => {
            select: (columns: string) => {
              eq: (
                column: string,
                value: string
              ) => {
                order: (
                  column: string,
                  options?: { ascending?: boolean }
                ) => Promise<{
                  data: Record<string, unknown>[] | null;
                  error: Record<string, unknown> | null;
                }>;
              };
            };
          };
        };

        // Fetch real files from assistant_files table
        const { data: filesData, error: filesError } = await supabaseClient
          .from('assistant_files')
          .select('id, name, created_at, status, purpose, file_type, file_size')
          .eq('assistant_id', assistantId)
          .order('created_at', { ascending: false });

        if (filesError) {
          console.error('Error fetching files:', filesError);
          toast('Error loading files', {
            description: 'Failed to load assistant files. Please try again.',
          });
          return;
        }

        // Transform database files to our internal format
        const fileArray: FileWithStatus[] = (filesData ?? []).map(
          (file: Record<string, unknown>) => ({
            id: file.id as string,
            name: file.name as string,
            created_at: file.created_at as string,
            status: (file.status ?? 'ready') as string,
            purpose: file.purpose as string,
          })
        );

        setFileList({ files: fileArray });
        setProcessingFileIds([]);
        setIsChatDisabled(fileArray.length === 0); // Enable chat if files exist
      } catch (error) {
        console.error('Failed to fetch files:', error);
        toast('Connection error', {
          description: 'Failed to connect to the server. Please try again.',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, supabase]
  );

  // Fetch real assistant data from database with joins
  const fetchAssistantData = useCallback(
    async (assistantId: string): Promise<AssistantWithRelations | null> => {
      try {
        // Use type assertion to bypass restrictive Supabase types
        const supabaseClient = supabase as unknown as {
          from: (table: string) => {
            select: (columns: string) => {
              eq: (
                column: string,
                value: string
              ) => {
                single: () => Promise<{
                  data: Record<string, unknown>;
                  error: Record<string, unknown> | null;
                }>;
              };
            };
          };
        };

        // Fetch assistant data with joins to get all related information
        const { data: assistantData, error: assistantError } = await supabaseClient
          .from('assistants')
          .select(
            `
          *,
          assistant_configs (*),
          assistant_usage_limits (*)
        `
          )
          .eq('id', assistantId)
          .single();

        if (assistantError) {
          console.error('Error fetching assistant:', assistantError);
          return null;
        }

        // Transform the data to match our expected structure
        const typedAssistantData = assistantData as Record<string, unknown> & {
          assistant_configs?: Record<string, unknown>[];
          assistant_usage_limits?: Record<string, unknown>[];
        };

        return {
          assistant: typedAssistantData as AssistantRow,
          config: (typedAssistantData.assistant_configs?.[0] ?? null) as AssistantConfig | null,
          usageLimits: (typedAssistantData.assistant_usage_limits?.[0] ??
            null) as AssistantUsageLimits | null,
        };
      } catch (error) {
        console.error('Error in fetchAssistantData:', error);
        return null;
      }
    },
    [supabase]
  );

  // Helper function to process assistant data and update state
  const processAssistantData = useCallback(
    (assistantData: AssistantWithRelations, assistantName: string) => {
      // Set all the data we need from real data
      setDisplayName(assistantData.assistant.name);
      setAssignedPhoneNumber(assistantData.assistant.assigned_phone_number);
      setPineconeName(assistantData.config?.pinecone_name ?? '');

      // Update document title
      document.title = `Chat with ${assistantData.assistant.name}`;

      // Set system prompt if available from config
      if (assistantData.config?.system_prompt) {
        setChatHistory([
          {
            role: 'system',
            content: assistantData.config.system_prompt,
            timestamp: getCurrentTimestamp(),
          },
        ]);
      }

      // Fetch files after getting pinecone_name from config
      if (assistantData.config?.pinecone_name) {
        void fetchFiles(assistantName, assistantData.config.pinecone_name);
      }
    },
    [fetchFiles]
  );

  // Load params and fetch assistant details
  useEffect(() => {
    async function loadParams() {
      try {
        const { assistantName } = await params;
        setAssistantId(assistantName); // This is actually the assistant ID from the URL

        // Fetch real assistant data from database
        const assistantData = await fetchAssistantData(assistantName);

        if (!assistantData?.assistant) {
          toast.error('Assistant not found', {
            description: 'The requested assistant could not be found.',
          });
          router.push('/');
          return;
        }

        processAssistantData(assistantData, assistantName);
      } catch (error) {
        console.error('Error loading params:', error);
        setIsLoading(false);
        toast.error('Failed to load Assistant', {
          description: 'There was an error loading the assistant details.',
        });
      }
    }

    void loadParams();
  }, [params, router, fetchFiles, supabase, fetchAssistantData, processAssistantData]);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching user:', error);
        setIsLoading(false);
      }
    };
    void fetchUser();
  }, [supabase.auth]);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // File dropzone functionality
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: acceptedFiles => {
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
      return 'processing'; // Show deleting files as processing
    }
    if (processingFileIds.includes(file.id)) {
      return 'processing';
    }

    return 'ready'; // Default status
  };

  // Send message to assistant
  const handleChat = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (isChatDisabled || !message.trim() || isSending) return;

      try {
        setIsSending(true);
        // Add user message to chat history
        const userMessage = { role: 'user', content: message, timestamp: getCurrentTimestamp() };
        setChatHistory([...chatHistory, userMessage]);
        const currentMessage = message;
        setMessage('');

        // Call the real assistant API endpoint
        const response = await fetch(`/api/Concierge/${assistantId}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: currentMessage,
            chatHistory: [...chatHistory, userMessage],
          }),
        });

        if (!response.ok) {
          throw new Error(`API call failed: ${String(response.status)}`);
        }

        const data = (await response.json()) as { message?: string };

        // Add the assistant's response to chat history
        const assistantResponse = {
          role: 'assistant',
          content: data.message ?? 'Sorry, I encountered an error processing your request.',
          timestamp: getCurrentTimestamp(),
        };

        setChatHistory(prev => [...prev, assistantResponse]);
      } catch (error) {
        console.error('Chat error:', error);
        toast('Communication error', {
          description: 'Failed to send your message. Please try again.',
        });

        // Add error message to chat on failure
        const errorResponse = {
          role: 'assistant',
          content:
            'I apologize, but I encountered an error processing your request. Please try again.',
          timestamp: getCurrentTimestamp(),
        };
        setChatHistory(prev => [...prev, errorResponse]);
      } finally {
        setIsSending(false);
      }
    },
    [isChatDisabled, message, isSending, chatHistory, assistantId]
  );

  // Add file to assistant
  const handleAddFile = async () => {
    if (!file || !assistantId) return;

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

      // Use type assertion to bypass restrictive Supabase types
      const supabaseClient = supabase as unknown as {
        from: (table: string) => {
          insert: (data: Record<string, unknown>) => Promise<{
            data: Record<string, unknown>[] | null;
            error: Record<string, unknown> | null;
          }>;
        };
      };

      // Insert file record into database
      const fileData = {
        assistant_id: assistantId,
        name: file.name,
        file_type: file.type,
        file_size: file.size,
        status: 'processing',
        purpose: 'assistant_knowledge',
      };

      const { error: insertError } = await supabaseClient.from('assistant_files').insert(fileData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (insertError) {
        console.error('Error inserting file:', insertError);
        throw new Error('Failed to save file to database');
      }

      // Refresh the file list
      await fetchFiles(assistantId, pineconeName);

      toast('File uploaded successfully!', {
        description: `${file.name} has been added to the assistant`,
      });
      setFile(null);
    } catch (error) {
      console.error('File upload error:', error);
      setFileError({
        title: 'Upload Error',
        description: 'Something went wrong during file upload',
        show: true,
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle adding URL to assistant
  const handleAddUrl = async () => {
    if (!url || !assistantId) return;

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

      // Use type assertion to bypass restrictive Supabase types
      const supabaseClient = supabase as unknown as {
        from: (table: string) => {
          insert: (data: Record<string, unknown>) => Promise<{
            data: Record<string, unknown>[] | null;
            error: Record<string, unknown> | null;
          }>;
        };
      };

      // Insert URL as a file record into database
      const urlData = {
        assistant_id: assistantId,
        name: url,
        file_type: 'url',
        status: 'processing',
        purpose: 'assistant_knowledge',
      };

      const { error: insertError } = await supabaseClient.from('assistant_files').insert(urlData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (insertError) {
        console.error('Error inserting URL:', insertError);
        throw new Error('Failed to save URL to database');
      }

      // Refresh the file list
      await fetchFiles(assistantId, pineconeName);

      toast('URL added successfully!', {
        description: `${url} has been added to the assistant`,
      });
      setUrl('');
    } catch (error) {
      console.error('URL addition error:', error);
      setFileError({
        title: 'URL Error',
        description: 'Something went wrong while adding this URL',
        show: true,
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Add file or URL to assistant
  const handleAddContent = () => {
    if (inputType === 'file') {
      void handleAddFile();
    } else {
      void handleAddUrl();
    }
  };

  // Delete file from assistant
  const handleDeleteFile = async (fileId: string) => {
    // Add to deletingFileIds immediately for better UX
    setDeletingFileIds(prev => [...prev, fileId]);

    try {
      // Use type assertion to bypass restrictive Supabase types
      const supabaseClient = supabase as unknown as {
        from: (table: string) => {
          delete: () => {
            eq: (
              column: string,
              value: string
            ) => Promise<{
              data: Record<string, unknown>[] | null;
              error: Record<string, unknown> | null;
            }>;
          };
        };
      };

      // Delete file from database
      const { error: deleteError } = await supabaseClient
        .from('assistant_files')
        .delete()
        .eq('id', fileId);

      if (deleteError) {
        console.error('Error deleting file:', deleteError);
        throw new Error('Failed to delete file from database');
      }

      // Refresh the file list
      await fetchFiles(assistantId, pineconeName);

      // Remove from deletingFileIds
      setDeletingFileIds(prev => prev.filter(id => id !== fileId));

      toast('File deleted successfully', {
        description: 'The file has been removed from your assistant',
      });
    } catch (error) {
      // Remove from deletingFileIds if there was an error
      setDeletingFileIds(prev => prev.filter(id => id !== fileId));

      console.error('Error deleting file:', error);
      toast('Error deleting file', {
        description: error instanceof Error ? error.message : 'Failed to delete file',
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

  // Helper function to render loading state
  const renderLoadingState = () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-lg">Loading...</p>
      </div>
    </div>
  );

  // Helper function to render authentication required state
  const renderAuthState = () => (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>Please log in to continue using this No-Show </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            onClick={() => {
              router.push('/sign-in');
            }}
          >
            Go to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  // Helper function to render chat interface
  const renderChatInterface = () => (
    <Card className="flex-1 flex flex-col overflow-hidden border-muted shadow-lg">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8 ring-2 ring-primary/10">
            <AvatarImage src="/bot-avatar.png" alt="Concierge" />
            <AvatarFallback>
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">{displayName}</CardTitle>
            <CardDescription className="text-xs">Your AI assistant</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        {chatHistory.length === 0 ||
        (chatHistory.length === 1 && chatHistory[0].role === 'system') ? (
          <div className="flex items-center justify-center h-full p-6">
            <div className="text-center max-w-lg">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">
                {fileList.files.length === 0
                  ? 'Add Files or links to Start'
                  : 'Start a conversation'}
              </h3>
              <p className="text-muted-foreground max-w-md mt-2">
                {fileList.files.length === 0
                  ? 'This No-Show needs information to work. Please add at least one file or link.'
                  : "Ask me anything about the documents you've provided. I'm here to help!"}
              </p>
              {fileList.files.length === 0 && (
                <Button
                  variant="default"
                  className="mt-6"
                  onClick={() => {
                    setActiveTab('files');
                  }}
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  Add
                </Button>
              )}
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {chatHistory
                .filter(msg => msg.role !== 'system')
                .map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      'flex gap-3',
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[80%] rounded-lg px-4 py-3 shadow-sm',
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground ml-auto'
                          : 'bg-muted'
                      )}
                    >
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-xs">
                              <Bot className="h-3 w-3" />
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground font-medium">
                            {displayName}
                          </span>
                        </div>
                      )}
                      {msg.role === 'user' && (
                        <div className="flex items-center gap-2 mb-2 justify-end">
                          <span className="text-xs text-primary-foreground/70 font-medium">
                            You
                          </span>
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={user?.user_metadata?.avatar_url} />
                            <AvatarFallback className="text-xs bg-primary-foreground/20">
                              <User className="h-3 w-3" />
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      )}
                      <div className="text-sm whitespace-pre-wrap break-words">{msg.content}</div>
                    </div>
                  </motion.div>
                ))}
              <div ref={chatEndRef} />
            </div>
          </ScrollArea>
        )}
      </CardContent>

      <CardFooter className="p-3 border-t bg-card/50">
        <form
          onSubmit={e => {
            void handleChat(e);
          }}
          className="w-full flex items-end gap-2"
        >
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              placeholder={getInputPlaceholder()}
              value={message}
              onChange={e => {
                setMessage(e.target.value);
              }}
              disabled={isChatDisabled || isSending}
              className={cn(
                'pr-10 py-5 shadow-sm focus-visible:ring-primary',
                isChatDisabled ? 'bg-muted text-muted-foreground' : 'bg-background'
              )}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void handleChat();
                }
              }}
            />
            <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-50">
              {isChatDisabled ? 'Disabled' : '/'}
            </kbd>
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={isChatDisabled || !message.trim() || isSending}
            className={cn('rounded-full shadow-sm p-3 h-auto', isSending && 'animate-pulse')}
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
  );

  // Helper function to render files interface
  const renderFilesInterface = () => (
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
              variant={inputType === 'file' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => {
                setInputType('file');
              }}
            >
              <FileText className="h-4 w-4 mr-2" /> File Upload
            </Button>
            <Button
              variant={inputType === 'url' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => {
                setInputType('url');
              }}
            >
              <Link className="h-4 w-4 mr-2" /> URL Import
            </Button>
          </div>

          {inputType === 'file' ? (
            <div className="mb-6">
              <div
                {...getRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-lg p-8 transition-colors cursor-pointer',
                  isDragActive
                    ? 'border-primary bg-primary/10'
                    : 'border-muted-foreground/20 hover:border-primary/50'
                )}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center justify-center gap-3 text-center">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {file ? file.name : 'Drop file here or click to upload'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {file
                        ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                        : 'PDF, TXT, DOCX, PPT and more'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <Label htmlFor="url-input" className="text-sm font-medium">
                Website URL
              </Label>
              <div className="mt-2">
                <Input
                  id="url-input"
                  placeholder="https://example.com"
                  value={url}
                  onChange={e => {
                    const value = e.target.value;
                    setUrl(value);
                    setIsUrlValid(value === '' || /^https?:\/\/.+/.test(value));
                  }}
                  className={cn('w-full', !isUrlValid && 'border-red-500 focus:border-red-500')}
                />
                {!isUrlValid && (
                  <p className="text-xs text-red-500 mt-1">
                    Please enter a valid URL (must start with http:// or https://)
                  </p>
                )}
              </div>
            </div>
          )}

          {(file ?? (url && isUrlValid)) && (
            <>
              {isUploading && (
                <div className="mb-4">
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    Upload progress
                  </Label>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
              <Button onClick={handleAddContent} disabled={isUploading} className="w-full">
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {inputType === 'file' ? 'Uploading...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    {inputType === 'file' ? 'Upload File' : 'Add URL'}
                  </>
                )}
              </Button>
            </>
          )}

          <div className="mt-6">
            <Label className="text-sm font-medium">Files ({fileList.files.length})</Label>
            {fileList.files.length === 0 ? (
              <div className="border rounded-md p-8 text-center mt-2">
                <p className="text-muted-foreground">No files uploaded yet</p>
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                {fileList.files.map(file => {
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
                          <p className="font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {file.purpose} • {new Date(file.created_at).toLocaleDateString()}
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
                              {isDeleting ? 'Deleting...' : 'Delete file'}
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

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setActiveTab('chat');
          }}
        >
          <Bot className="h-4 w-4 mr-2" />
          Back to Chat
        </Button>
      </CardFooter>
    </Card>
  );

  // Helper function to render processing files indicator
  const renderProcessingIndicator = () => {
    const processingFilesCount = fileList.files.filter(
      file => file.status === 'Processing' || processingFileIds.includes(file.id)
    ).length;

    if (processingFilesCount <= 0) return null;

    return (
      <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950/70 dark:border-blue-800 shadow-sm">
        <CardContent className="p-3 flex items-center gap-2">
          <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
          <p className="text-sm">
            {processingFilesCount} file(s) being processed. Chat will be available once processing
            completes.
          </p>
        </CardContent>
      </Card>
    );
  };

  // Helper function to render main header
  const renderMainHeader = () => (
    <div className="flex items-center mb-4 gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          if (activeTab === 'files') {
            setActiveTab('chat');
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
              onClick={() => {
                setActiveTab(activeTab === 'chat' ? 'files' : 'chat');
              }}
              className="shadow-sm hover:bg-accent"
            >
              {activeTab === 'chat' ? (
                <>
                  <Paperclip className="h-4 w-4 mr-2" /> Manage Knowledge
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4 mr-2" /> Back to Chat
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {activeTab === 'chat' ? 'Manage No-Show Files' : 'Return to Chat'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );

  // Helper function to get input placeholder text
  const getInputPlaceholder = () => {
    if (fileList.files.length === 0) {
      return 'Add files to enable chat functionality...';
    }
    if (isChatDisabled) {
      return 'Chat disabled - waiting for files to process...';
    }
    return 'Type your message... (Press / to focus)';
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
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === 'Enter' &&
        document.activeElement === inputRef.current
      ) {
        void handleChat();
      }
    };

    globalThis.addEventListener('keydown', handleKeyPress);
    return () => {
      globalThis.removeEventListener('keydown', handleKeyPress);
    };
  }, [message, isChatDisabled, handleChat]);

  // Loading state
  if (isLoading) {
    return renderLoadingState();
  }

  // Not logged in state
  if (!user) {
    return renderAuthState();
  }

  return (
    <div className="container mx-auto p-2 md:p-4 h-screen flex flex-col max-w-5xl">
      {renderMainHeader()}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsContent value="chat" className="flex-1 flex flex-col space-y-4 mt-0">
          {renderProcessingIndicator()}
          {renderChatInterface()}
        </TabsContent>

        <TabsContent value="files" className="flex-1 flex flex-col space-y-4 mt-0">
          {renderFilesInterface()}
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
