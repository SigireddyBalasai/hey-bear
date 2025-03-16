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
          created_at: string | null
          id: string
          is_assigned: boolean | null
          number: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_assigned?: boolean | null
          number: string
        }
        Update: {
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
          plan_id: string | null
          updated_at: string | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string | null
          id?: string
          is_admin?: boolean | null
          last_active?: string | null
          plan_id?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string | null
          id?: string
          is_admin?: boolean | null
          last_active?: string | null
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
