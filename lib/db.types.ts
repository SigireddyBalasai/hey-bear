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
          created_at: string | null
          id: string
          is_starred: boolean | null
          name: string
          params: Json | null
          pinecone_name: string | null
          plan_id: string | null
          user_id: string | null
        }
        Insert: {
          assigned_phone_number?: string | null
          created_at?: string | null
          id?: string
          is_starred?: boolean | null
          name: string
          params?: Json | null
          pinecone_name?: string | null
          plan_id?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_phone_number?: string | null
          created_at?: string | null
          id?: string
          is_starred?: boolean | null
          name?: string
          params?: Json | null
          pinecone_name?: string | null
          plan_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assistants_assigned_phone_number_fkey"
            columns: ["assigned_phone_number"]
            isOneToOne: false
            referencedRelation: "phonenumbers"
            referencedColumns: ["number"]
          },
          {
            foreignKeyName: "assistants_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
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
      assistantusage: {
        Row: {
          assistant_id: string | null
          id: string
          interactions_used: number | null
          last_reset_at: string | null
          usage_tier_id: string | null
        }
        Insert: {
          assistant_id?: string | null
          id?: string
          interactions_used?: number | null
          last_reset_at?: string | null
          usage_tier_id?: string | null
        }
        Update: {
          assistant_id?: string | null
          id?: string
          interactions_used?: number | null
          last_reset_at?: string | null
          usage_tier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assistantusage_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistantusage_usage_tier_id_fkey"
            columns: ["usage_tier_id"]
            isOneToOne: false
            referencedRelation: "usagetiers"
            referencedColumns: ["id"]
          },
        ]
      }
      interactions: {
        Row: {
          assistant_id: string | null
          chat: string
          cost_estimate: number | null
          duration: number | null
          id: string
          input_tokens: number | null
          interaction_time: string | null
          is_error: boolean | null
          output_tokens: number | null
          request: string
          response: string
          token_usage: number | null
          user_id: string | null
        }
        Insert: {
          assistant_id?: string | null
          chat: string
          cost_estimate?: number | null
          duration?: number | null
          id?: string
          input_tokens?: number | null
          interaction_time?: string | null
          is_error?: boolean | null
          output_tokens?: number | null
          request: string
          response: string
          token_usage?: number | null
          user_id?: string | null
        }
        Update: {
          assistant_id?: string | null
          chat?: string
          cost_estimate?: number | null
          duration?: number | null
          id?: string
          input_tokens?: number | null
          interaction_time?: string | null
          is_error?: boolean | null
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
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_user_id_fkey1"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_assistants: {
        Row: {
          checkout_session_id: string | null
          created_at: string | null
          id: string
          name: string
          params: Json | null
          plan_id: string | null
          user_id: string
        }
        Insert: {
          checkout_session_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          params?: Json | null
          plan_id?: string | null
          user_id: string
        }
        Update: {
          checkout_session_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          params?: Json | null
          plan_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_assistants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      phonenumberpool: {
        Row: {
          added_at: string | null
          added_by_admin: string | null
          id: string
          phone_number_id: string | null
        }
        Insert: {
          added_at?: string | null
          added_by_admin?: string | null
          id?: string
          phone_number_id?: string | null
        }
        Update: {
          added_at?: string | null
          added_by_admin?: string | null
          id?: string
          phone_number_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "phonenumberpool_added_by_admin_fkey"
            columns: ["added_by_admin"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phonenumberpool_phone_number_id_fkey"
            columns: ["phone_number_id"]
            isOneToOne: false
            referencedRelation: "phonenumbers"
            referencedColumns: ["id"]
          },
        ]
      }
      phonenumbers: {
        Row: {
          country: Database["public"]["Enums"]["country"] | null
          created_at: string | null
          id: string
          is_assigned: boolean | null
          number: string
        }
        Insert: {
          country?: Database["public"]["Enums"]["country"] | null
          created_at?: string | null
          id?: string
          is_assigned?: boolean | null
          number: string
        }
        Update: {
          country?: Database["public"]["Enums"]["country"] | null
          created_at?: string | null
          id?: string
          is_assigned?: boolean | null
          number?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          max_assistants: number | null
          max_interactions: number | null
          name: string
          price: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          max_assistants?: number | null
          max_interactions?: number | null
          name: string
          price?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          max_assistants?: number | null
          max_interactions?: number | null
          name?: string
          price?: number | null
        }
        Relationships: []
      }
      usage_limits: {
        Row: {
          assistant_id: string
          created_at: string
          documents_count: number
          id: string
          last_reset: string
          messages_received: number
          messages_sent: number
          updated_at: string
          webpages_crawled: number
        }
        Insert: {
          assistant_id: string
          created_at?: string
          documents_count?: number
          id?: string
          last_reset?: string
          messages_received?: number
          messages_sent?: number
          updated_at?: string
          webpages_crawled?: number
        }
        Update: {
          assistant_id?: string
          created_at?: string
          documents_count?: number
          id?: string
          last_reset?: string
          messages_received?: number
          messages_sent?: number
          updated_at?: string
          webpages_crawled?: number
        }
        Relationships: [
          {
            foreignKeyName: "usage_limits_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: true
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          },
        ]
      }
      usagetiers: {
        Row: {
          created_at: string | null
          id: string
          max_phone_numbers: number | null
          max_requests_per_month: number | null
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          max_phone_numbers?: number | null
          max_requests_per_month?: number | null
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          max_phone_numbers?: number | null
          max_requests_per_month?: number | null
          name?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          auth_user_id: string | null
          created_at: string | null
          id: string
          is_admin: boolean | null
          last_active: string | null
          metadata: Json | null
          plan_id: string | null
          updated_at: string | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string | null
          id?: string
          is_admin?: boolean | null
          last_active?: string | null
          metadata?: Json | null
          plan_id?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string | null
          id?: string
          is_admin?: boolean | null
          last_active?: string | null
          metadata?: Json | null
          plan_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      userusage: {
        Row: {
          assistants_used: number | null
          cost_estimate: number | null
          id: string
          interactions_used: number | null
          last_reset_at: string | null
          phone_numbers_used: number | null
          token_usage: number | null
          usage_tier_id: string | null
          user_id: string | null
        }
        Insert: {
          assistants_used?: number | null
          cost_estimate?: number | null
          id?: string
          interactions_used?: number | null
          last_reset_at?: string | null
          phone_numbers_used?: number | null
          token_usage?: number | null
          usage_tier_id?: string | null
          user_id?: string | null
        }
        Update: {
          assistants_used?: number | null
          cost_estimate?: number | null
          id?: string
          interactions_used?: number | null
          last_reset_at?: string | null
          phone_numbers_used?: number | null
          token_usage?: number | null
          usage_tier_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "userusage_usage_tier_id_fkey"
            columns: ["usage_tier_id"]
            isOneToOne: false
            referencedRelation: "usagetiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "userusage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_phone_number: {
        Args: {
          p_assistant_id: string
          p_phone_number: string
          p_phone_number_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      country: "US" | "Canada"
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
    },
  },
} as const
