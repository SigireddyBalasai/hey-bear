export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      assistants: {
        Row: {
          assigned_phone_number: string | null
          created_at: string
          description: string | null
          id: string
          is_starred: boolean | null
          name: string
          params: Json | null
          pending: boolean | null
          pinecone_name: string | null
          system_prompt: string | null
          twilio_app_sid: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_phone_number?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_starred?: boolean | null
          name: string
          params?: Json | null
          pending?: boolean | null
          pinecone_name?: string | null
          system_prompt?: string | null
          twilio_app_sid?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_phone_number?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_starred?: boolean | null
          name?: string
          params?: Json | null
          pending?: boolean | null
          pinecone_name?: string | null
          system_prompt?: string | null
          twilio_app_sid?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assistants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "assistants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      interactions: {
        Row: {
          assistant_id: string | null
          chat: string | null
          cost_estimate: number | null
          duration: number | null
          id: string
          input_tokens: number | null
          interaction_time: string
          is_error: boolean | null
          monthly_period: string | null
          output_tokens: number | null
          request: string
          response: string
          token_usage: number | null
          user_id: string | null
        }
        Insert: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          duration?: number | null
          id?: string
          input_tokens?: number | null
          interaction_time?: string
          is_error?: boolean | null
          monthly_period?: string | null
          output_tokens?: number | null
          request: string
          response: string
          token_usage?: number | null
          user_id?: string | null
        }
        Update: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          duration?: number | null
          id?: string
          input_tokens?: number | null
          interaction_time?: string
          is_error?: boolean | null
          monthly_period?: string | null
          output_tokens?: number | null
          request?: string
          response?: string
          token_usage?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interactions_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "assistant_stats"
            referencedColumns: ["assistant_id"]
          },
          {
            foreignKeyName: "interactions_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_usage: {
        Row: {
          assistant_id: string | null
          created_at: string
          id: string
          input_tokens: number | null
          interaction_count: number | null
          month: Database["public"]["Enums"]["monthly_interval"]
          output_tokens: number | null
          total_cost: number | null
          updated_at: string
          user_id: string | null
          year: number
        }
        Insert: {
          assistant_id?: string | null
          created_at?: string
          id?: string
          input_tokens?: number | null
          interaction_count?: number | null
          month: Database["public"]["Enums"]["monthly_interval"]
          output_tokens?: number | null
          total_cost?: number | null
          updated_at?: string
          user_id?: string | null
          year: number
        }
        Update: {
          assistant_id?: string | null
          created_at?: string
          id?: string
          input_tokens?: number | null
          interaction_count?: number | null
          month?: Database["public"]["Enums"]["monthly_interval"]
          output_tokens?: number | null
          total_cost?: number | null
          updated_at?: string
          user_id?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_usage_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "assistant_stats"
            referencedColumns: ["assistant_id"]
          },
          {
            foreignKeyName: "monthly_usage_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "monthly_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_numbers: {
        Row: {
          assistant_id: string | null
          capabilities: Json | null
          country: Database["public"]["Enums"]["country"] | null
          created_at: string
          id: string
          is_assigned: boolean | null
          phone_number: string
          status: string | null
          updated_at: string
        }
        Insert: {
          assistant_id?: string | null
          capabilities?: Json | null
          country?: Database["public"]["Enums"]["country"] | null
          created_at?: string
          id?: string
          is_assigned?: boolean | null
          phone_number: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          assistant_id?: string | null
          capabilities?: Json | null
          country?: Database["public"]["Enums"]["country"] | null
          created_at?: string
          id?: string
          is_assigned?: boolean | null
          phone_number?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "phone_numbers_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "assistant_stats"
            referencedColumns: ["assistant_id"]
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
      subscriptions: {
        Row: {
          assistant_id: string | null
          created_at: string
          current_period_end: string | null
          id: string
          plan: string
          status: string
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          assistant_id?: string | null
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan: string
          status: string
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          assistant_id?: string | null
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: true
            referencedRelation: "assistant_stats"
            referencedColumns: ["assistant_id"]
          },
          {
            foreignKeyName: "subscriptions_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: true
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_user_id: string
          created_at: string
          id: string
          is_admin: boolean | null
          last_active: string | null
          metadata: Json | null
          stripe_customer_id: string | null
          updated_at: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          id?: string
          is_admin?: boolean | null
          last_active?: string | null
          metadata?: Json | null
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          id?: string
          is_admin?: boolean | null
          last_active?: string | null
          metadata?: Json | null
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      assistant_stats: {
        Row: {
          assistant_id: string | null
          assistant_name: string | null
          phone_number: string | null
          plan: string | null
          subscription_status: string | null
          total_cost: number | null
          total_input_tokens: number | null
          total_interactions: number | null
          total_output_tokens: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assistants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "assistants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stats: {
        Row: {
          assistants_count: number | null
          auth_user_id: string | null
          last_active: string | null
          total_cost: number | null
          total_interactions: number | null
          total_tokens: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      aggregate_daily_usage: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      aggregate_monthly_usage: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      assign_phone_number: {
        Args: {
          p_assistant_id: string
          p_phone_number_id: string
          p_phone_number?: string
        }
        Returns: Json
      }
      get_assistant_subscription_details: {
        Args: { p_assistant_id: string }
        Returns: {
          subscription_id: string
          stripe_subscription_id: string
          plan: string
          status: string
          current_period_end: string
          is_active: boolean
          days_remaining: number
          max_messages: number
          max_tokens: number
          max_documents: number
          max_webpages: number
        }[]
      }
      get_assistant_usage: {
        Args: {
          p_assistant_id: string
          p_start_date?: string
          p_end_date?: string
        }
        Returns: {
          interactions_count: number
          token_usage: number
          input_tokens: number
          output_tokens: number
          cost_estimate: number
        }[]
      }
      get_assistants_usage_stats: {
        Args: {
          p_start_date: string
          p_end_date: string
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          assistant_id: string
          assistant_name: string
          user_id: string
          interactions_count: number
          token_usage: number
          input_tokens: number
          output_tokens: number
          cost_estimate: number
        }[]
      }
      get_monthly_assistant_usage: {
        Args: {
          p_assistant_id: string
          p_start_date: string
          p_end_date: string
        }
        Returns: {
          year: number
          month: number
          month_name: string
          interactions_count: number
          token_usage: number
          input_tokens: number
          output_tokens: number
          cost_estimate: number
        }[]
      }
      get_monthly_user_usage: {
        Args: { p_user_id: string; p_start_date: string; p_end_date: string }
        Returns: {
          year: number
          month: number
          month_name: string
          interactions_count: number
          token_usage: number
          input_tokens: number
          output_tokens: number
          cost_estimate: number
        }[]
      }
      get_usage_limits_for_plan: {
        Args: { plan_type: string }
        Returns: {
          max_messages: number
          max_tokens: number
          max_documents: number
          max_webpages: number
        }[]
      }
      get_user_phone_numbers_count: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_user_usage: {
        Args: { p_user_id: string; p_start_date?: string; p_end_date?: string }
        Returns: {
          interactions_count: number
          token_usage: number
          input_tokens: number
          output_tokens: number
          cost_estimate: number
          assistants_count: number
        }[]
      }
      get_users_usage_stats: {
        Args: {
          p_start_date: string
          p_end_date: string
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          user_id: string
          auth_user_id: string
          interactions_count: number
          token_usage: number
          input_tokens: number
          output_tokens: number
          cost_estimate: number
          assistants_count: number
        }[]
      }
      prune_old_interactions: {
        Args: { retention_days?: number }
        Returns: number
      }
      unassign_phone_number: {
        Args: { p_phone_number: string }
        Returns: Json
      }
      update_subscription: {
        Args:
          | {
              p_assistant_id: string
              p_stripe_subscription_id: string
              p_plan: string
              p_status: string
              p_current_period_end: string
            }
          | {
              p_assistant_id: string
              p_stripe_subscription_id: string
              p_plan: string
              p_status: string
              p_current_period_end: string
              p_current_period_start?: string
            }
        Returns: undefined
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
  graphql_public: {
    Enums: {},
  },
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
