'use client';

import { useCallback, useState } from 'react';

import type { FileWithStatus } from './types';

import { handleError, showSuccess } from '@/utils/error-handling';


interface UseFileManagementProps {
  assistantId: string;
  pineconeName: string;
  onFilesUpdated: () => void;
}

export function useFileManagement({
  assistantId,
  pineconeName,
  onFilesUpdated,
}: UseFileManagementProps) {
  const [deletingFileIds, setDeletingFileIds] = useState<string[]>([]);
  const [processingFileIds, setProcessingFileIds] = useState<string[]>([]);

  const fetchFiles = useCallback(
    async (assistantId: string) => {
      if (!assistantId) {
        return { files: [] };
      }

      try {
        const response = await fetch('/api/Concierge/file/list', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            assistantId,
            pinecone_name: pineconeName,
          }),
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error?: string };

          handleError(new Error(errorData.error ?? 'Failed to load assistant files'), {
            toastTitle: 'Error loading files',
            fallbackMessage: 'Failed to load assistant files. Please try again.',
          });

          return { files: [] };
        }

        const responseData = (await response.json()) as {
          files?: {
            id: string;
            name: string;
            created_at: string;
            [key: string]: unknown;
          }[];
        };

        // Ensure we have a valid array before calling map
        const filesArray = Array.isArray(responseData.files) ? responseData.files : [];

        const fileArray: FileWithStatus[] = filesArray.map(file => ({
          id: file.id,
          name: file.name,
          created_at: file.created_at,
          status: 'ready',
          purpose: 'assistant_knowledge',
        }));

        setProcessingFileIds([]);

        return { files: fileArray };
      } catch (error) {
        handleError(error as Error, {
          toastTitle: 'Connection error',
          fallbackMessage: 'Failed to connect to the server. Please try again.',
        });

        return { files: [] };
      }
    },
    [pineconeName]
  );

  const handleAddFile = async (file: File) => {
    if (!file || !assistantId) return false;

    try {
      const formData = new FormData();

      formData.append('file', file);
      formData.append('assistantId', assistantId);

      const response = await fetch('/api/Concierge/file/add', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };

        throw new Error(errorData.error ?? 'Failed to upload file');
      }

      onFilesUpdated();
      showSuccess('File uploaded successfully!', `${file.name} has been added to the assistant`);

      return true;
    } catch (error) {
      throw error;
    }
  };

  const handleAddUrl = async (url: string) => {
    if (!url || !assistantId) return false;

    try {
      const response = await fetch('/api/Concierge/file/add-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          assistantId,
          pinecone_name: pineconeName,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };

        throw new Error(errorData.error ?? 'Failed to add URL');
      }

      onFilesUpdated();
      showSuccess('URL added successfully!', `${url} has been added to the assistant`);

      return true;
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (deletingFileIds.includes(fileId)) {
      return;
    }
    setDeletingFileIds(prev => [...prev, fileId]);

    try {
      const response = await fetch('/api/Concierge/file/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId,
          assistantId,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to delete file';

        try {
          const errorData = (await response.json()) as { error?: string };

          errorMessage = errorData.error ?? errorMessage;
        } catch {
          // If JSON parsing fails, use the status text
          errorMessage = response.statusText ?? errorMessage;
        }
        if (errorMessage.includes('File deletion already started')) {
          showSuccess('File deletion in progress', 'The file is being removed from your assistant');
          onFilesUpdated();

          return;
        }

        throw new Error(errorMessage);
      }

      // Try to parse the success response
      try {
        await response.json(); // Parse but don't need to use the result
      } catch {
        // If JSON parsing fails, that's okay for a successful delete
        // Silent fail - the delete operation succeeded even if response isn't JSON
      }

      onFilesUpdated();
      showSuccess('File deleted successfully', 'The file has been removed from your assistant');
    } catch (error) {
      handleError(error as Error, {
        toastTitle: 'Error deleting file',
        fallbackMessage: 'Failed to delete file',
      });
    } finally {
      setDeletingFileIds(prev => prev.filter(id => id !== fileId));
    }
  };

  return {
    deletingFileIds,
    processingFileIds,
    fetchFiles,
    handleAddFile,
    handleAddUrl,
    handleDeleteFile,
  };
}
