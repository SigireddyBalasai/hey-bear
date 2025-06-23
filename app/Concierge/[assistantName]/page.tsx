'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';

import { useRouter } from 'next/navigation';

import { AssistantHeader } from '@/components/concierge/chat/AssistantHeader';
import { ChatInterface } from '@/components/concierge/chat/ChatInterface';
import { FilesInterface } from '@/components/concierge/chat/FilesInterface';
import { LoadingState } from '@/components/concierge/chat/LoadingState';
import { ProcessingIndicator } from '@/components/concierge/chat/ProcessingIndicator';
import type { FileErrorState, FileWithStatus, User } from '@/components/concierge/chat/types';
import { useChat } from '@/components/concierge/chat/useChat';
import { useFileManagement } from '@/components/concierge/chat/useFileManagement';
import { FileErrorDialog } from '@/components/ui/file-error-dialog';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useMultipleLoadingStates } from '@/hooks/useLoadingState';
import type {
  AssistantConfig,
  AssistantRow,
  AssistantUsageLimits,
  AssistantWithRelations,
} from '@/types/assistant.types';
import { handleError } from '@/utils/error-handling';
import { createClient } from '@/utils/supabase/client';

const AssistantPage = ({ params }: { params: { assistantName: string } }) => {
  // Consolidated loading states using useMultipleLoadingStates
  const { loadingStates, setLoadingState } = useMultipleLoadingStates([
    'pageLoading',
    'uploading',
  ] as const);

  // Extract individual loading states for easy access
  const isLoading = loadingStates.pageLoading;
  const isUploading = loadingStates.uploading;

  // State variables
  const [assistantId, setAssistantId] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [pineconeName, setPineconeName] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isChatDisabled, setIsChatDisabled] = useState(true);
  const [fileList, setFileList] = useState<{ files: FileWithStatus[] }>({ files: [] });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [assignedPhoneNumber, setAssignedPhoneNumber] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [inputType, setInputType] = useState<'file' | 'url'>('file');
  const [url, setUrl] = useState<string>('');
  const [isUrlValid, setIsUrlValid] = useState<boolean>(true);
  const [fileError, setFileError] = useState<FileErrorState>({
    title: '',
    description: '',
    show: false,
  });

  const router = useRouter();
  const supabase = createClient();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Custom hooks for chat and file management
  const chat = useChat({
    assistantId,
    isChatDisabled,
  });

  // Define handleFilesUpdated before useFileManagement
  const handleFilesUpdated = useCallback(async () => {
    if (assistantId) {
      const updatedFiles = await fileManagement.fetchFiles(assistantId);
      setFileList(updatedFiles);
      setIsChatDisabled(updatedFiles.files.length === 0);
    }
  }, [assistantId]);

  const fileManagement = useFileManagement({
    assistantId,
    pineconeName,
    onFilesUpdated: handleFilesUpdated,
  });

  // File dropzone functionality
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: acceptedFiles => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
      }
    },
    maxFiles: 1,
  });

  // Fetch real assistant data from database with joins
  const fetchAssistantData = useCallback(
    async (assistantId: string): Promise<AssistantWithRelations | null> => {
      try {
        // Fetch assistant data with joins to get all related information
        const { data: assistantData, error: assistantError } = await supabase
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
          assistant_configs?: Record<string, unknown> | null;
          assistant_usage_limits?: Record<string, unknown> | null;
        };

        // Provide default objects if null to satisfy type requirements
        const defaultConfig: AssistantConfig = {
          business_hours: null,
          business_name: null,
          business_phone: null,
          concierge_name: null,
          created_at: '',
          description: null,
          display_name: null,
          features_enabled: null,
          id: '',
          personality: null,
          pinecone_name: null,
          share_phone_number: null,
          system_prompt: null,
          timezone: null,
          updated_at: '',
          webhook_enabled: null,
          webhook_url: null,
        };
        const defaultUsageLimits: AssistantUsageLimits = {
          assistant_id: '',
          created_at: '',
          document_limit: null,
          max_messages: null,
          max_tokens: null,
          message_limit: null,
          token_limit: null,
          updated_at: '',
          webpage_limit: null,
        };

        return {
          assistant: typedAssistantData as AssistantRow,
          config: (typedAssistantData.assistant_configs ?? defaultConfig) as AssistantConfig,
          usageLimits: (typedAssistantData.assistant_usage_limits ??
            defaultUsageLimits) as AssistantUsageLimits,
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
    (assistantData: AssistantWithRelations) => {
      setDisplayName(assistantData.assistant.name);
      setAssignedPhoneNumber(assistantData.assistant.assigned_phone_number);
      setPineconeName(assistantData.config?.pinecone_name ?? '');

      // Update document title
      document.title = `Chat with ${assistantData.assistant.name}`;

      // Set system prompt if available from config
      if (assistantData.config?.system_prompt) {
        chat.setSystemPrompt(assistantData.config.system_prompt);
      }

      // Fetch files after getting pinecone_name from config
      if (assistantData.config?.pinecone_name) {
        void handleFilesUpdated();
      }
    },
    [chat, handleFilesUpdated]
  );

  // Load params and fetch assistant details
  useEffect(() => {
    async function loadParams() {
      try {
        const { assistantName } = params;
        setAssistantId(assistantName); // This is actually the assistant ID from the URL

        // Fetch real assistant data from database
        const assistantData = await fetchAssistantData(assistantName);

        if (!assistantData?.assistant) {
          handleError(new Error('The requested assistant could not be found'), {
            toastTitle: 'Assistant not found',
          });
          router.push('/');
          return;
        }

        processAssistantData(assistantData);
      } catch (error) {
        console.error('Error loading params:', error);
        setLoadingState('pageLoading', false);
        handleError(
          error instanceof Error
            ? error
            : new Error('There was an error loading the assistant details'),
          {
            toastTitle: 'Failed to load Assistant',
          }
        );
      }
    }

    void loadParams();
  }, [params, router, fetchAssistantData, processAssistantData, setLoadingState]);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
        setLoadingState('pageLoading', false);
      } catch (error) {
        console.error('Error fetching user:', error);
        setLoadingState('pageLoading', false);
      }
    };
    void fetchUser();
  }, [supabase.auth, setLoadingState]);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.chatHistory]);

  // File and URL handlers
  const handleAddContent = async () => {
    try {
      setLoadingState('uploading', true);

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

      let success = false;
      if (inputType === 'file' && file) {
        success = await fileManagement.handleAddFile(file);
        if (success) setFile(null);
      } else if (inputType === 'url' && url && isUrlValid) {
        success = await fileManagement.handleAddUrl(url);
        if (success) setUrl('');
      }

      clearInterval(progressInterval);
      setUploadProgress(100);
    } catch (error) {
      setFileError({
        title: inputType === 'file' ? 'Upload Error' : 'URL Error',
        description:
          error instanceof Error
            ? error.message
            : `Something went wrong ${inputType === 'file' ? 'during file upload' : 'while adding this URL'}`,
        show: true,
      });
    } finally {
      setLoadingState('uploading', false);
      setUploadProgress(0);
    }
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    setIsUrlValid(value === '' || /^https?:\/\/.+/.test(value));
  };

  // Navigation handlers
  const handleBack = () => {
    if (activeTab === 'files') {
      setActiveTab('chat');
    } else {
      router.push('/Concierge');
    }
  };

  const handleToggleTab = () => {
    setActiveTab(activeTab === 'chat' ? 'files' : 'chat');
  };

  // Handle closing the file error dialog
  const closeFileErrorDialog = () => {
    setFileError(prev => ({ ...prev, show: false }));
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
        void chat.handleChat();
      }
    };

    globalThis.addEventListener('keydown', handleKeyPress);
    return () => {
      globalThis.removeEventListener('keydown', handleKeyPress);
    };
  }, [chat]);

  // Loading state
  if (isLoading) {
    return <LoadingState type="page" />;
  }

  // Not logged in state
  if (!user) {
    return <LoadingState type="auth" onNavigateToLogin={() => router.push('/sign-in')} />;
  }

  return (
    <div className="container mx-auto p-2 md:p-4 h-screen flex flex-col max-w-5xl">
      <AssistantHeader
        displayName={displayName}
        assignedPhoneNumber={assignedPhoneNumber}
        activeTab={activeTab}
        onBack={handleBack}
        onToggleTab={handleToggleTab}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsContent value="chat" className="flex-1 flex flex-col space-y-4 mt-0">
          <ProcessingIndicator
            fileList={fileList}
            processingFileIds={fileManagement.processingFileIds}
          />
          <ChatInterface
            displayName={displayName}
            chatHistory={chat.chatHistory}
            message={chat.message}
            setMessage={chat.setMessage}
            isChatDisabled={isChatDisabled}
            isSending={chat.isSending}
            fileCount={fileList.files.length}
            user={user}
            inputRef={inputRef}
            chatEndRef={chatEndRef}
            onSubmit={chat.handleSubmit}
            onSwitchToFiles={() => setActiveTab('files')}
          />
        </TabsContent>

        <TabsContent value="files" className="flex-1 flex flex-col space-y-4 mt-0">
          <FilesInterface
            fileList={fileList}
            file={file}
            url={url}
            inputType={inputType}
            isUrlValid={isUrlValid}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            assignedPhoneNumber={assignedPhoneNumber}
            deletingFileIds={fileManagement.deletingFileIds}
            processingFileIds={fileManagement.processingFileIds}
            getRootProps={getRootProps}
            getInputProps={getInputProps}
            isDragActive={isDragActive}
            onInputTypeChange={setInputType}
            onUrlChange={handleUrlChange}
            onAddContent={handleAddContent}
            onDeleteFile={fileManagement.handleDeleteFile}
            onSwitchToChat={() => setActiveTab('chat')}
          />
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
