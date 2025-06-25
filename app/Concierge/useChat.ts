"use client";

import { useCallback, useState } from "react";

import type { ChatMessage } from "./types";

interface UseChatProps {
  assistantId: string;
  isChatDisabled: boolean;
}

export function useChat({ assistantId, isChatDisabled }: UseChatProps) {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);

  const getCurrentTimestamp = () => new Date().toISOString();

  const handleChat = useCallback(
    async (currentMessage?: string) => {
      const messageToSend = currentMessage || message;

      if (isChatDisabled || !messageToSend.trim() || isSending) return;

      try {
        setIsSending(true);
        const userMessage: ChatMessage = {
          role: "user",
          content: messageToSend,
          timestamp: getCurrentTimestamp(),
        };

        const newChatHistory = [...chatHistory, userMessage];

        setChatHistory(newChatHistory);
        setMessage("");

        const response = await fetch("/api/Concierge/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            assistantId,
            message: messageToSend,
            chatHistory: newChatHistory,
          }),
        });

        if (!response.ok) {
          throw new Error(`API call failed: ${String(response.status)}`);
        }

        const data = await response.json();
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: data.response || "No response received",
          timestamp: getCurrentTimestamp(),
        };

        setChatHistory([...newChatHistory, assistantMessage]);
      } catch (error) {
        console.log("Failed to send message", error);
      } finally {
        setIsSending(false);
      }
    },
    [assistantId, isChatDisabled, message, chatHistory, isSending],
  );

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      void handleChat();
    },
    [handleChat],
  );

  const setSystemPrompt = (systemPrompt: string) => {
    setChatHistory([
      {
        role: "system",
        content: systemPrompt,
        timestamp: getCurrentTimestamp(),
      },
    ]);
  };

  return {
    message,
    setMessage,
    chatHistory,
    setChatHistory,
    isSending,
    handleChat,
    handleSubmit,
    setSystemPrompt,
  };
}
