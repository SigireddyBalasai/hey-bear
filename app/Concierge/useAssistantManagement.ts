"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AssistantRow } from "@/types/basics";
import type { AssistantWithNonNullableFields } from "@/types/AssistantWithNonNullableFields";
import type { ConciergeFormData } from "@/types/ConciergeFormData";
import { createClient } from "@/utils/supabase/client";
import { useLoadingState } from "./useLoadingState";

interface UserState {
  id: string;
  user_metadata: {
    name: string;
    avatar_url: string;
  };
}

export function useAssistantManagement() {
  const [user, setUser] = useState<UserState | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [normalizedAssistants, setNormalizedAssistants] = useState<
    AssistantWithNonNullableFields[]
  >([]);
  const [formData, setFormData] = useState<ConciergeFormData>({
    name: "",
    description: "",
    concierge_name: "",
    personality: "Business Casual",
    business_name: "",
    share_phone_number: false,
    business_phone: "",
  });

  const { isLoading, setIsLoading } = useLoadingState(false);
  const router = useRouter();

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDeleteAssistant = async (assistantId: string) => {
    setIsLoading(true);
    try {
      const assistantToDelete = normalizedAssistants.find(
        (a) => a.assistant.id === assistantId,
      );
      if (!assistantToDelete?.assistant.id) {
        console.log("Assistant not found");
        return;
      }
      const response = await fetch("/api/Concierge/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assistantName: assistantToDelete.assistant.name,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log(errorData.error || "Failed to delete assistant");
        return;
      }
      setNormalizedAssistants((prev: AssistantWithNonNullableFields[]) =>
        prev.filter(
          (a: AssistantWithNonNullableFields) => a.assistant.id !== assistantId,
        ),
      );
      console.log(
        "Assistant deleted",
        `${assistantToDelete.assistant.name} has been removed`,
      );
    } catch (err) {
      console.log("Error deleting assistant", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAssistant = async () => {
    setFormData({
      name: "",
      description: "",
      concierge_name: "",
      personality: "Business Casual",
      business_name: "",
      share_phone_number: false,
      business_phone: "",
    });
    console.log(
      "Creation pending",
      "Assistant creation will be implemented elsewhere",
    );
  };

  const fetchAssistants = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push("/sign-in");
        return;
      }
      setUser({
        id: user.id,
        user_metadata: {
          name:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email ||
            "",
          avatar_url: user.user_metadata?.avatar_url || "",
        },
      });
      setUserId(user.id);
      const { data: assistantsData, error: assistantsError } = await supabase
        .from("assistants")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (assistantsError) {
        console.log("Failed to fetch assistants from server");
        return;
      }
      if (!assistantsData || assistantsData.length === 0) {
        setNormalizedAssistants([]);
      } else {
        const transformedAssistants = assistantsData
          .filter((assistant: AssistantRow | null) => assistant !== null)
          .map((assistant: AssistantRow) => ({
            assistant: {
              ...assistant,
              name: assistant.name || "",
              is_starred: assistant.is_starred ?? false,
            },
            config: {
              description: "",
              business_phone: "",
            },
            subscription: undefined,
            usageLimits: undefined,
            activity: undefined,
            interactions_count: 0,
            last_interaction_at: null,
          })) as AssistantWithNonNullableFields[];
        setNormalizedAssistants(transformedAssistants);
      }
    } catch (err) {
      console.log("Connection error", err);
    } finally {
      setIsLoading(false);
    }
  }, [router, setIsLoading]);

  return {
    user,
    userId,
    normalizedAssistants,
    isLoading,
    formData,
    setFormData,
    handleInputChange,
    handleDeleteAssistant,
    handleCreateAssistant,
    fetchAssistants,
  };
}
