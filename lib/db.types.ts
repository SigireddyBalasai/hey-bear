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
          assistant_id: string
          id: string
          last_used_at: string | null
          message_count: number | null
          metadata: Json | null
          started_at: string | null
          user_id: string
        }
        Insert: {
          assistant_id: string
          id?: string
          last_used_at?: string | null
          message_count?: number | null
          metadata?: Json | null
          started_at?: string | null
          user_id: string
        }
        Update: {
          assistant_id?: string
          id?: string
          last_used_at?: string | null
          message_count?: number | null
          metadata?: Json | null
          started_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chat_history: {
        Row: {
          answer: string
          assistant_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          question: string
          user_id: string | null
        }
        Insert: {
          answer: string
          assistant_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          question: string
          user_id?: string | null
        }
        Update: {
          answer?: string
          assistant_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          question?: string
          user_id?: string | null
        }
        Relationships: []
      }
      phone_numbers: {
        Row: {
          assigned_at: string | null
          assigned_to_user_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          phone_number: string
          twilio_sid: string
          unassigned_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_to_user_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          phone_number: string
          twilio_sid: string
          unassigned_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_to_user_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          phone_number?: string
          twilio_sid?: string
          unassigned_at?: string | null
        }
        Relationships: []
      }
      user_plans: {
        Row: {
          created_at: string | null
          id: string
          max_sms: number
          metadata: Json | null
          plan_cost: number
          plan_type: string
          renewal_date: string
          sms_received: number | null
          sms_sent: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          max_sms?: number
          metadata?: Json | null
          plan_cost?: number
          plan_type?: string
          renewal_date: string
          sms_received?: number | null
          sms_sent?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          max_sms?: number
          metadata?: Json | null
          plan_cost?: number
          plan_type?: string
          renewal_date?: string
          sms_received?: number | null
          sms_sent?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          is_admin: boolean | null
          user_id: string
        }
        Insert: {
          is_admin?: boolean | null
          user_id: string
        }
        Update: {
          is_admin?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
