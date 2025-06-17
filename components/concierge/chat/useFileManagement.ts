'use client';

import { useCallback, useState } from 'react';

import { handleError, showSuccess } from '@/utils/error-handling';

import type { FileWithStatus } from './types';

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
          console.error('Error fetching files:', errorData);
          handleError(new Error(errorData.error ?? 'Failed to load assistant files'), {
            toastTitle: 'Error loading files',
            fallbackMessage: 'Failed to load assistant files. Please try again.',
          });
          return { files: [] };
        }

        const responseData = (await response.json()) as {
          files?: Array<{
            id: string;
            name: string;
            created_at: string;
            [key: string]: unknown;
          }>;
        };

        const fileArray: FileWithStatus[] = (responseData.files ?? []).map(file => ({
          id: file.id,
          name: file.name,
          created_at: file.created_at,
          status: 'ready',
          purpose: 'assistant_knowledge',
        }));

        setProcessingFileIds([]);
        return { files: fileArray };
      } catch (error) {
        console.error('Failed to fetch files:', error);
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
        throw new Error(errorData.error || 'Failed to upload file');
      }

      onFilesUpdated();
      showSuccess('File uploaded successfully!', `${file.name} has been added to the assistant`);
      return true;
    } catch (error) {
      console.error('File upload error:', error);
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
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || 'Failed to add URL');
      }

      onFilesUpdated();
      showSuccess('URL added successfully!', `${url} has been added to the assistant`);
      return true;
    } catch (error) {
      console.error('URL addition error:', error);
      throw error;
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    setDeletingFileIds(prev => [...prev, fileId]);

    try {
      const response = await fetch('/api/Concierge/file/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId,
          assistantId,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || 'Failed to delete file');
      }

      onFilesUpdated();
      showSuccess('File deleted successfully', 'The file has been removed from your assistant');
    } catch (error) {
      console.error('Error deleting file:', error);
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
