export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      assistant_activity: {
        Row: {
          assistant_id: string
          created_at: string
          last_activity_at: string | null
          last_message_at: string | null
          last_used_at: string | null
          total_documents: number | null
          total_interactions: number | null
          total_messages: number | null
          total_tokens: number | null
          total_webpages: number | null
          updated_at: string
        }
        Insert: {
          assistant_id: string
          created_at?: string
          last_activity_at?: string | null
          last_message_at?: string | null
          last_used_at?: string | null
          total_documents?: number | null
          total_interactions?: number | null
          total_messages?: number | null
          total_tokens?: number | null
          total_webpages?: number | null
          updated_at?: string
        }
        Update: {
          assistant_id?: string
          created_at?: string
          last_activity_at?: string | null
          last_message_at?: string | null
          last_used_at?: string | null
          total_documents?: number | null
          total_interactions?: number | null
          total_messages?: number | null
          total_tokens?: number | null
          total_webpages?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistant_activity_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: true
            referencedRelation: "assistant_detail_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistant_activity_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: true
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_configs: {
        Row: {
          business_name: string | null
          business_phone: string | null
          concierge_name: string | null
          created_at: string
          description: string | null
          display_name: string | null
          id: string
          personality: string | null
          pinecone_name: string | null
          share_phone_number: boolean | null
          system_prompt: string | null
          updated_at: string
        }
        Insert: {
          business_name?: string | null
          business_phone?: string | null
          concierge_name?: string | null
          created_at?: string
          description?: string | null
          display_name?: string | null
          id: string
          personality?: string | null
          pinecone_name?: string | null
          share_phone_number?: boolean | null
          system_prompt?: string | null
          updated_at?: string
        }
        Update: {
          business_name?: string | null
          business_phone?: string | null
          concierge_name?: string | null
          created_at?: string
          description?: string | null
          display_name?: string | null
          id?: string
          personality?: string | null
          pinecone_name?: string | null
          share_phone_number?: boolean | null
          system_prompt?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistant_configs_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "assistant_detail_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistant_configs_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_subscriptions: {
        Row: {
          assistant_id: string
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          payment_session_id: string | null
          plan_id: string
          status: string
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          assistant_id: string
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          payment_session_id?: string | null
          plan_id: string
          status: string
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          assistant_id?: string
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          payment_session_id?: string | null
          plan_id?: string
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistant_subscriptions_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: true
            referencedRelation: "assistant_detail_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistant_subscriptions_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: true
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistant_subscriptions_payment_session_id_fkey"
            columns: ["payment_session_id"]
            isOneToOne: false
            referencedRelation: "payment_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_usage_limits: {
        Row: {
          assistant_id: string
          created_at: string
          document_limit: number | null
          max_messages: number | null
          max_tokens: number | null
          message_limit: number | null
          token_limit: number | null
          updated_at: string
          webpage_limit: number | null
        }
        Insert: {
          assistant_id: string
          created_at?: string
          document_limit?: number | null
          max_messages?: number | null
          max_tokens?: number | null
          message_limit?: number | null
          token_limit?: number | null
          updated_at?: string
          webpage_limit?: number | null
        }
        Update: {
          assistant_id?: string
          created_at?: string
          document_limit?: number | null
          max_messages?: number | null
          max_tokens?: number | null
          message_limit?: number | null
          token_limit?: number | null
          updated_at?: string
          webpage_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assistant_usage_limits_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: true
            referencedRelation: "assistant_detail_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistant_usage_limits_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: true
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          },
        ]
      }
      assistants: {
        Row: {
          assigned_phone_number: string | null
          created_at: string
          id: string
          is_starred: boolean | null
          name: string
          pending: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_phone_number?: string | null
          created_at?: string
          id?: string
          is_starred?: boolean | null
          name: string
          pending?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_phone_number?: string | null
          created_at?: string
          id?: string
          is_starred?: boolean | null
          name?: string
          pending?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          action_timestamp: string
          created_at: string
          details: Json | null
          entity_id: string
          entity_type: string
          id: string
          performed_by: string
          related_entity_id: string | null
        }
        Insert: {
          action: string
          action_timestamp?: string
          created_at?: string
          details?: Json | null
          entity_id: string
          entity_type: string
          id?: string
          performed_by: string
          related_entity_id?: string | null
        }
        Update: {
          action?: string
          action_timestamp?: string
          created_at?: string
          details?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
          performed_by?: string
          related_entity_id?: string | null
        }
        Relationships: []
      }
      interactions: {
        Row: {
          assistant_id: string
          chat: Json | null
          cost_estimate: number | null
          created_at: string | null
          duration: number | null
          id: string
          input_tokens: number | null
          interaction_time: string | null
          is_error: boolean | null
          output_tokens: number | null
          request: string | null
          response: string | null
          token_usage: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assistant_id: string
          chat?: Json | null
          cost_estimate?: number | null
          created_at?: string | null
          duration?: number | null
          id?: string
          input_tokens?: number | null
          interaction_time?: string | null
          is_error?: boolean | null
          output_tokens?: number | null
          request?: string | null
          response?: string | null
          token_usage?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assistant_id?: string
          chat?: Json | null
          cost_estimate?: number | null
          created_at?: string | null
          duration?: number | null
          id?: string
          input_tokens?: number | null
          interaction_time?: string | null
          is_error?: boolean | null
          output_tokens?: number | null
          request?: string | null
          response?: string | null
          token_usage?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payment_sessions: {
        Row: {
          amount_total: number | null
          assistant_config_data: Json
          created_at: string
          currency: string | null
          customer_email: string | null
          expires_at: string | null
          id: string
          plan_id: string | null
          session_id: string
          status: string
          stripe_checkout_session_id: string | null
          stripe_customer_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_total?: number | null
          assistant_config_data: Json
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          expires_at?: string | null
          id?: string
          plan_id?: string | null
          session_id: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_total?: number | null
          assistant_config_data?: Json
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          expires_at?: string | null
          id?: string
          plan_id?: string | null
          session_id?: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      phone_numbers: {
        Row: {
          assistant_id: string | null
          capabilities: Json | null
          country: string | null
          created_at: string
          id: string
          is_assigned: boolean | null
          messaging_service_sid: string | null
          phone_number: string
          sms_fallback_url: string | null
          sms_url: string | null
          status: string | null
          twilio_sid: string | null
          updated_at: string
          voice_url: string | null
        }
        Insert: {
          assistant_id?: string | null
          capabilities?: Json | null
          country?: string | null
          created_at?: string
          id?: string
          is_assigned?: boolean | null
          messaging_service_sid?: string | null
          phone_number: string
          sms_fallback_url?: string | null
          sms_url?: string | null
          status?: string | null
          twilio_sid?: string | null
          updated_at?: string
          voice_url?: string | null
        }
        Update: {
          assistant_id?: string | null
          capabilities?: Json | null
          country?: string | null
          created_at?: string
          id?: string
          is_assigned?: boolean | null
          messaging_service_sid?: string | null
          phone_number?: string
          sms_fallback_url?: string | null
          sms_url?: string | null
          status?: string | null
          twilio_sid?: string | null
          updated_at?: string
          voice_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "phone_numbers_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "assistant_detail_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phone_numbers_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_statistics: {
        Row: {
          cost_estimate: number | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          input_tokens: number | null
          interactions_count: number | null
          last_activity: string | null
          messages_count: number | null
          output_tokens: number | null
          period: string | null
          token_usage: number | null
          updated_at: string
        }
        Insert: {
          cost_estimate?: number | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          input_tokens?: number | null
          interactions_count?: number | null
          last_activity?: string | null
          messages_count?: number | null
          output_tokens?: number | null
          period?: string | null
          token_usage?: number | null
          updated_at?: string
        }
        Update: {
          cost_estimate?: number | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          input_tokens?: number | null
          interactions_count?: number | null
          last_activity?: string | null
          messages_count?: number | null
          output_tokens?: number | null
          period?: string | null
          token_usage?: number | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      assistant_detail_view: {
        Row: {
          assistant_created_at: string | null
          assistant_name: string | null
          assistant_updated_at: string | null
          business_name: string | null
          config_created_at: string | null
          config_updated_at: string | null
          current_period_end: string | null
          description: string | null
          display_name: string | null
          id: string | null
          last_activity_at: string | null
          max_messages: number | null
          max_tokens: number | null
          personality: string | null
          pinecone_name: string | null
          plan_id: string | null
          subscription_status: string | null
          system_prompt: string | null
          total_interactions: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_old_audit_logs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      make_admin: {
        Args: { user_email: string }
        Returns: undefined
      }
      provision_twilio_number: {
        Args: {
          p_phone_number: string
          p_twilio_sid: string
          p_friendly_name?: string
          p_country?: string
          p_region?: string
          p_capabilities?: Json
        }
        Returns: string
      }
      remove_admin: {
        Args: { user_email: string }
        Returns: undefined
      }
      update_twilio_webhooks: {
        Args: {
          p_phone_id: string
          p_voice_url?: string
          p_sms_url?: string
          p_sms_fallback_url?: string
        }
        Returns: boolean
      }
    }
    Enums: {
      country: "US" | "Canada"
      monthly_interval:
        | "January"
        | "February"
        | "March"
        | "April"
        | "May"
        | "June"
        | "July"
        | "August"
        | "September"
        | "October"
        | "November"
        | "December"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      country: ["US", "Canada"],
      monthly_interval: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ],
    },
  },
} as const
