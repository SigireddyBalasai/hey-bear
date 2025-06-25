"use client";

import { useCallback, useState } from "react";

import type { FileWithStatus } from "./types";

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
        const response = await fetch("/api/Concierge/file/list", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            assistantId,
            pinecone_name: pineconeName,
          }),
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error?: string };

          console.log(
            "Error loading files:",
            errorData.error ?? "Failed to load assistant files",
          );

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
        const filesArray = Array.isArray(responseData.files)
          ? responseData.files
          : [];

        const fileArray: FileWithStatus[] = filesArray.map((file) => ({
          id: file.id,
          name: file.name,
          created_at: file.created_at,
          status: "ready",
          purpose: "assistant_knowledge",
        }));

        setProcessingFileIds([]);

        return { files: fileArray };
      } catch (error) {
        console.log("Connection error:", error);

        return { files: [] };
      }
    },
    [pineconeName],
  );

  const handleAddFile = async (file: File) => {
    if (!file || !assistantId) return false;

    try {
      const formData = new FormData();

      formData.append("file", file);
      formData.append("assistantId", assistantId);

      const response = await fetch("/api/Concierge/file/add", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };

        throw new Error(errorData.error ?? "Failed to upload file");
      }

      onFilesUpdated();
      console.log(
        "File uploaded successfully:",
        `${file.name} has been added to the assistant`,
      );

      return true;
    } catch (error) {
      console.log("Error uploading file:", error);
      return false;
    }
  };

  const handleAddUrl = async (url: string) => {
    if (!url || !assistantId) return false;

    try {
      const response = await fetch("/api/Concierge/file/add-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          assistantId,
          pinecone_name: pineconeName,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };

        throw new Error(errorData.error ?? "Failed to add URL");
      }

      onFilesUpdated();
      console.log(
        "URL added successfully:",
        `${url} has been added to the assistant`,
      );

      return true;
    } catch (error) {
      console.log("Error adding URL:", error);
      return false;
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (deletingFileIds.includes(fileId)) {
      return;
    }
    setDeletingFileIds((prev) => [...prev, fileId]);

    try {
      const response = await fetch("/api/Concierge/file/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileId,
          assistantId,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to delete file";

        try {
          const errorData = (await response.json()) as { error?: string };

          errorMessage = errorData.error ?? errorMessage;
        } catch {
          // If JSON parsing fails, use the status text
          errorMessage = response.statusText ?? errorMessage;
        }
        if (errorMessage.includes("File deletion already started")) {
          console.log(
            "File deletion in progress:",
            "The file is being removed from your assistant",
          );
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
      console.log(
        "File deleted successfully:",
        "The file has been removed from your assistant",
      );
    } catch (error) {
      console.log("Error deleting file:", error);
    } finally {
      setDeletingFileIds((prev) => prev.filter((id) => id !== fileId));
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
