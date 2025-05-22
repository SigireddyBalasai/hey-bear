export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  analytics: {
    Tables: {
      interaction_metrics: {
        Row: {
          ai_model: string | null
          client_info: Json | null
          cost_estimate: number | null
          created_at: string
          input_tokens: number | null
          interaction_id: string
          output_tokens: number | null
          response_time_ms: number | null
          sentiment_score: number | null
          total_tokens: number | null
          updated_at: string
        }
        Insert: {
          ai_model?: string | null
          client_info?: Json | null
          cost_estimate?: number | null
          created_at?: string
          input_tokens?: number | null
          interaction_id: string
          output_tokens?: number | null
          response_time_ms?: number | null
          sentiment_score?: number | null
          total_tokens?: number | null
          updated_at?: string
        }
        Update: {
          ai_model?: string | null
          client_info?: Json | null
          cost_estimate?: number | null
          created_at?: string
          input_tokens?: number | null
          interaction_id?: string
          output_tokens?: number | null
          response_time_ms?: number | null
          sentiment_score?: number | null
          total_tokens?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interaction_metrics_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: true
            referencedRelation: "interactions"
            referencedColumns: ["id"]
          },
        ]
      }
      interactions: {
        Row: {
          assistant_id: string | null
          chat: string | null
          cost_estimate: number | null
          created_at: string | null
          duration: number | null
          id: string
          input_tokens: number | null
          interaction_time: string | null
          is_error: boolean | null
          monthly_period: string | null
          output_tokens: number | null
          request: string
          response: string
          token_usage: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string | null
          duration?: number | null
          id?: string
          input_tokens?: number | null
          interaction_time?: string | null
          is_error?: boolean | null
          monthly_period?: string | null
          output_tokens?: number | null
          request: string
          response: string
          token_usage?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string | null
          duration?: number | null
          id?: string
          input_tokens?: number | null
          interaction_time?: string | null
          is_error?: boolean | null
          monthly_period?: string | null
          output_tokens?: number | null
          request?: string
          response?: string
          token_usage?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      interactions_p2024_05: {
        Row: {
          assistant_id: string | null
          chat: string | null
          cost_estimate: number | null
          created_at: string
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
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
          duration?: number | null
          id?: string
          input_tokens?: number | null
          interaction_time: string
          is_error?: boolean | null
          monthly_period?: string | null
          output_tokens?: number | null
          request: string
          response: string
          token_usage?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
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
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      interactions_p2024_06: {
        Row: {
          assistant_id: string | null
          chat: string | null
          cost_estimate: number | null
          created_at: string
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
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
          duration?: number | null
          id?: string
          input_tokens?: number | null
          interaction_time: string
          is_error?: boolean | null
          monthly_period?: string | null
          output_tokens?: number | null
          request: string
          response: string
          token_usage?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
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
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      interactions_p2024_07: {
        Row: {
          assistant_id: string | null
          chat: string | null
          cost_estimate: number | null
          created_at: string
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
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
          duration?: number | null
          id?: string
          input_tokens?: number | null
          interaction_time: string
          is_error?: boolean | null
          monthly_period?: string | null
          output_tokens?: number | null
          request: string
          response: string
          token_usage?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
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
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      interactions_p2024_08: {
        Row: {
          assistant_id: string | null
          chat: string | null
          cost_estimate: number | null
          created_at: string
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
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
          duration?: number | null
          id?: string
          input_tokens?: number | null
          interaction_time: string
          is_error?: boolean | null
          monthly_period?: string | null
          output_tokens?: number | null
          request: string
          response: string
          token_usage?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
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
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      interactions_p2024_09: {
        Row: {
          assistant_id: string | null
          chat: string | null
          cost_estimate: number | null
          created_at: string
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
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
          duration?: number | null
          id?: string
          input_tokens?: number | null
          interaction_time: string
          is_error?: boolean | null
          monthly_period?: string | null
          output_tokens?: number | null
          request: string
          response: string
          token_usage?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
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
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      interactions_p2024_10: {
        Row: {
          assistant_id: string | null
          chat: string | null
          cost_estimate: number | null
          created_at: string
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
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
          duration?: number | null
          id?: string
          input_tokens?: number | null
          interaction_time: string
          is_error?: boolean | null
          monthly_period?: string | null
          output_tokens?: number | null
          request: string
          response: string
          token_usage?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
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
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      interactions_p2024_11: {
        Row: {
          assistant_id: string | null
          chat: string | null
          cost_estimate: number | null
          created_at: string
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
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
          duration?: number | null
          id?: string
          input_tokens?: number | null
          interaction_time: string
          is_error?: boolean | null
          monthly_period?: string | null
          output_tokens?: number | null
          request: string
          response: string
          token_usage?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
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
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      interactions_p2024_12: {
        Row: {
          assistant_id: string | null
          chat: string | null
          cost_estimate: number | null
          created_at: string
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
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
          duration?: number | null
          id?: string
          input_tokens?: number | null
          interaction_time: string
          is_error?: boolean | null
          monthly_period?: string | null
          output_tokens?: number | null
          request: string
          response: string
          token_usage?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
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
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      interactions_p2025_01: {
        Row: {
          assistant_id: string | null
          chat: string | null
          cost_estimate: number | null
          created_at: string
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
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
          duration?: number | null
          id?: string
          input_tokens?: number | null
          interaction_time: string
          is_error?: boolean | null
          monthly_period?: string | null
          output_tokens?: number | null
          request: string
          response: string
          token_usage?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
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
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      interactions_p2025_02: {
        Row: {
          assistant_id: string | null
          chat: string | null
          cost_estimate: number | null
          created_at: string
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
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
          duration?: number | null
          id?: string
          input_tokens?: number | null
          interaction_time: string
          is_error?: boolean | null
          monthly_period?: string | null
          output_tokens?: number | null
          request: string
          response: string
          token_usage?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
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
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      interactions_p2025_03: {
        Row: {
          assistant_id: string | null
          chat: string | null
          cost_estimate: number | null
          created_at: string
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
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
          duration?: number | null
          id?: string
          input_tokens?: number | null
          interaction_time: string
          is_error?: boolean | null
          monthly_period?: string | null
          output_tokens?: number | null
          request: string
          response: string
          token_usage?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
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
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      interactions_p2025_04: {
        Row: {
          assistant_id: string | null
          chat: string | null
          cost_estimate: number | null
          created_at: string
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
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
          duration?: number | null
          id?: string
          input_tokens?: number | null
          interaction_time: string
          is_error?: boolean | null
          monthly_period?: string | null
          output_tokens?: number | null
          request: string
          response: string
          token_usage?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
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
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      interactions_p2025_05: {
        Row: {
          assistant_id: string | null
          chat: string | null
          cost_estimate: number | null
          created_at: string
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
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
          duration?: number | null
          id?: string
          input_tokens?: number | null
          interaction_time: string
          is_error?: boolean | null
          monthly_period?: string | null
          output_tokens?: number | null
          request: string
          response: string
          token_usage?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
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
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      interactions_p2025_06: {
        Row: {
          assistant_id: string | null
          chat: string | null
          cost_estimate: number | null
          created_at: string
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
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
          duration?: number | null
          id?: string
          input_tokens?: number | null
          interaction_time: string
          is_error?: boolean | null
          monthly_period?: string | null
          output_tokens?: number | null
          request: string
          response: string
          token_usage?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
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
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      interactions_p2025_07: {
        Row: {
          assistant_id: string | null
          chat: string | null
          cost_estimate: number | null
          created_at: string
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
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
          duration?: number | null
          id?: string
          input_tokens?: number | null
          interaction_time: string
          is_error?: boolean | null
          monthly_period?: string | null
          output_tokens?: number | null
          request: string
          response: string
          token_usage?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
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
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      interactions_p2025_08: {
        Row: {
          assistant_id: string | null
          chat: string | null
          cost_estimate: number | null
          created_at: string
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
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
          duration?: number | null
          id?: string
          input_tokens?: number | null
          interaction_time: string
          is_error?: boolean | null
          monthly_period?: string | null
          output_tokens?: number | null
          request: string
          response: string
          token_usage?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
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
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      interactions_p2025_09: {
        Row: {
          assistant_id: string | null
          chat: string | null
          cost_estimate: number | null
          created_at: string
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
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
          duration?: number | null
          id?: string
          input_tokens?: number | null
          interaction_time: string
          is_error?: boolean | null
          monthly_period?: string | null
          output_tokens?: number | null
          request: string
          response: string
          token_usage?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
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
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      interactions_p2025_10: {
        Row: {
          assistant_id: string | null
          chat: string | null
          cost_estimate: number | null
          created_at: string
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
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
          duration?: number | null
          id?: string
          input_tokens?: number | null
          interaction_time: string
          is_error?: boolean | null
          monthly_period?: string | null
          output_tokens?: number | null
          request: string
          response: string
          token_usage?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
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
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      interactions_p2025_11: {
        Row: {
          assistant_id: string | null
          chat: string | null
          cost_estimate: number | null
          created_at: string
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
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
          duration?: number | null
          id?: string
          input_tokens?: number | null
          interaction_time: string
          is_error?: boolean | null
          monthly_period?: string | null
          output_tokens?: number | null
          request: string
          response: string
          token_usage?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
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
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      interactions_p2025_12: {
        Row: {
          assistant_id: string | null
          chat: string | null
          cost_estimate: number | null
          created_at: string
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
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
          duration?: number | null
          id?: string
          input_tokens?: number | null
          interaction_time: string
          is_error?: boolean | null
          monthly_period?: string | null
          output_tokens?: number | null
          request: string
          response: string
          token_usage?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
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
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      interactions_p2026_01: {
        Row: {
          assistant_id: string | null
          chat: string | null
          cost_estimate: number | null
          created_at: string
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
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
          duration?: number | null
          id?: string
          input_tokens?: number | null
          interaction_time: string
          is_error?: boolean | null
          monthly_period?: string | null
          output_tokens?: number | null
          request: string
          response: string
          token_usage?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
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
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      interactions_p2026_02: {
        Row: {
          assistant_id: string | null
          chat: string | null
          cost_estimate: number | null
          created_at: string
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
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
          duration?: number | null
          id?: string
          input_tokens?: number | null
          interaction_time: string
          is_error?: boolean | null
          monthly_period?: string | null
          output_tokens?: number | null
          request: string
          response: string
          token_usage?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
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
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      interactions_p2026_03: {
        Row: {
          assistant_id: string | null
          chat: string | null
          cost_estimate: number | null
          created_at: string
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
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
          duration?: number | null
          id?: string
          input_tokens?: number | null
          interaction_time: string
          is_error?: boolean | null
          monthly_period?: string | null
          output_tokens?: number | null
          request: string
          response: string
          token_usage?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
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
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      interactions_p2026_04: {
        Row: {
          assistant_id: string | null
          chat: string | null
          cost_estimate: number | null
          created_at: string
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
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
          duration?: number | null
          id?: string
          input_tokens?: number | null
          interaction_time: string
          is_error?: boolean | null
          monthly_period?: string | null
          output_tokens?: number | null
          request: string
          response: string
          token_usage?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
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
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      interactions_p2026_05: {
        Row: {
          assistant_id: string | null
          chat: string | null
          cost_estimate: number | null
          created_at: string
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
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
          duration?: number | null
          id?: string
          input_tokens?: number | null
          interaction_time: string
          is_error?: boolean | null
          monthly_period?: string | null
          output_tokens?: number | null
          request: string
          response: string
          token_usage?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
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
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      interactions_partitioned: {
        Row: {
          assistant_id: string | null
          chat: string | null
          cost_estimate: number | null
          created_at: string
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
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
          duration?: number | null
          id?: string
          input_tokens?: number | null
          interaction_time: string
          is_error?: boolean | null
          monthly_period?: string | null
          output_tokens?: number | null
          request: string
          response: string
          token_usage?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string
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
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      interactions_shadow: {
        Row: {
          assistant_id: string | null
          chat: string | null
          cost_estimate: number | null
          created_at: string | null
          duration: number | null
          id: string
          input_tokens: number | null
          interaction_time: string | null
          is_error: boolean | null
          monthly_period: string | null
          output_tokens: number | null
          request: string
          response: string
          token_usage: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string | null
          duration?: number | null
          id?: string
          input_tokens?: number | null
          interaction_time?: string | null
          is_error?: boolean | null
          monthly_period?: string | null
          output_tokens?: number | null
          request: string
          response: string
          token_usage?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assistant_id?: string | null
          chat?: string | null
          cost_estimate?: number | null
          created_at?: string | null
          duration?: number | null
          id?: string
          input_tokens?: number | null
          interaction_time?: string | null
          is_error?: boolean | null
          monthly_period?: string | null
          output_tokens?: number | null
          request?: string
          response?: string
          token_usage?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      all_interactions: {
        Row: {
          assistant_id: string | null
          chat: string | null
          cost_estimate: number | null
          created_at: string | null
          duration: number | null
          id: string | null
          input_tokens: number | null
          interaction_time: string | null
          is_error: boolean | null
          monthly_period: string | null
          output_tokens: number | null
          request: string | null
          response: string | null
          token_usage: number | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
      mv_daily_activity_summary: {
        Row: {
          avg_duration_ms: number | null
          day: string | null
          error_count: number | null
          total_cost: number | null
          total_input_tokens: number | null
          total_interactions: number | null
          total_output_tokens: number | null
          total_tokens: number | null
          unique_assistants: number | null
          unique_users: number | null
        }
        Relationships: []
      }
      mv_user_activity_timeline: {
        Row: {
          day: string | null
          error_count: number | null
          interaction_count: number | null
          total_cost: number | null
          total_input_tokens: number | null
          total_output_tokens: number | null
          total_tokens: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      apply_partition_policies: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      ensure_partition_exists: {
        Args: { year_month: string }
        Returns: undefined
      }
      get_daily_activity_summary: {
        Args: Record<PropertyKey, never>
        Returns: unknown[]
      }
      get_user_activity_timeline: {
        Args: { user_id_filter?: string }
        Returns: unknown[]
      }
      insert_interaction: {
        Args: {
          p_assistant_id: string
          p_user_id: string
          p_request: string
          p_response: string
          p_interaction_time?: string
          p_chat?: string
          p_is_error?: boolean
          p_token_usage?: number
          p_input_tokens?: number
          p_output_tokens?: number
          p_duration?: number
          p_cost_estimate?: number
        }
        Returns: string
      }
      insert_interaction_metrics: {
        Args: {
          p_interaction_id: string
          p_input_tokens?: number
          p_output_tokens?: number
          p_cost_estimate?: number
          p_response_time_ms?: number
          p_ai_model?: string
          p_client_info?: Json
          p_sentiment_score?: number
        }
        Returns: undefined
      }
      refresh_materialized_views: {
        Args: Record<PropertyKey, never>
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
  assistants: {
    Tables: {
      assistant_activity: {
        Row: {
          assistant_id: string
          created_at: string
          last_message_at: string | null
          last_used_at: string | null
          total_documents: number | null
          total_messages: number | null
          total_tokens: number | null
          total_webpages: number | null
          updated_at: string
        }
        Insert: {
          assistant_id: string
          created_at?: string
          last_message_at?: string | null
          last_used_at?: string | null
          total_documents?: number | null
          total_messages?: number | null
          total_tokens?: number | null
          total_webpages?: number | null
          updated_at?: string
        }
        Update: {
          assistant_id?: string
          created_at?: string
          last_message_at?: string | null
          last_used_at?: string | null
          total_documents?: number | null
          total_messages?: number | null
          total_tokens?: number | null
          total_webpages?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      assistant_configs: {
        Row: {
          address: string | null
          business_name: string | null
          business_phone: string | null
          concierge_name: string | null
          concierge_personality: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          pinecone_name: string | null
          share_phone_number: boolean | null
          system_prompt: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          business_name?: string | null
          business_phone?: string | null
          concierge_name?: string | null
          concierge_personality?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id: string
          pinecone_name?: string | null
          share_phone_number?: boolean | null
          system_prompt?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string | null
          business_phone?: string | null
          concierge_name?: string | null
          concierge_personality?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          pinecone_name?: string | null
          share_phone_number?: boolean | null
          system_prompt?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      assistant_contact_info: {
        Row: {
          address: string | null
          assistant_id: string
          business_phone: string | null
          created_at: string
          email: string | null
          share_phone_number: boolean | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          assistant_id: string
          business_phone?: string | null
          created_at?: string
          email?: string | null
          share_phone_number?: boolean | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          assistant_id?: string
          business_phone?: string | null
          created_at?: string
          email?: string | null
          share_phone_number?: boolean | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      assistant_settings: {
        Row: {
          assistant_id: string
          business_name: string | null
          created_at: string
          description: string | null
          display_name: string | null
          personality: string | null
          pinecone_name: string | null
          system_prompt: string | null
          updated_at: string
        }
        Insert: {
          assistant_id: string
          business_name?: string | null
          created_at?: string
          description?: string | null
          display_name?: string | null
          personality?: string | null
          pinecone_name?: string | null
          system_prompt?: string | null
          updated_at?: string
        }
        Update: {
          assistant_id?: string
          business_name?: string | null
          created_at?: string
          description?: string | null
          display_name?: string | null
          personality?: string | null
          pinecone_name?: string | null
          system_prompt?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      assistant_subscriptions: {
        Row: {
          assistant_id: string
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
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
          plan_id?: string
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      assistant_usage_limits: {
        Row: {
          assistant_id: string
          created_at: string
          document_limit: number | null
          message_limit: number | null
          token_limit: number | null
          updated_at: string
          webpage_limit: number | null
        }
        Insert: {
          assistant_id: string
          created_at?: string
          document_limit?: number | null
          message_limit?: number | null
          token_limit?: number | null
          updated_at?: string
          webpage_limit?: number | null
        }
        Update: {
          assistant_id?: string
          created_at?: string
          document_limit?: number | null
          message_limit?: number | null
          token_limit?: number | null
          updated_at?: string
          webpage_limit?: number | null
        }
        Relationships: []
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
    }
    Views: {
      assistant_detail_view: {
        Row: {
          address: string | null
          assigned_phone_number: string | null
          business_name: string | null
          business_phone: string | null
          concierge_name: string | null
          concierge_personality: string | null
          contact_address: string | null
          contact_email: string | null
          contact_phone: string | null
          contact_share_phone: boolean | null
          contact_website: string | null
          created_at: string | null
          description: string | null
          document_limit: number | null
          email: string | null
          id: string | null
          is_starred: boolean | null
          last_message_at: string | null
          last_used_at: string | null
          message_limit: number | null
          name: string | null
          pending: boolean | null
          personality: string | null
          pinecone_name: string | null
          setting_business_name: string | null
          setting_description: string | null
          setting_pinecone_name: string | null
          setting_system_prompt: string | null
          share_phone_number: boolean | null
          system_prompt: string | null
          token_limit: number | null
          total_messages: number | null
          total_tokens: number | null
          updated_at: string | null
          user_id: string | null
          webpage_limit: number | null
          website: string | null
        }
        Relationships: []
      }
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
  public: {
    Tables: {
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
      phone_numbers: {
        Row: {
          assistant_id: string | null
          capabilities: Json | null
          country: string | null
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
          country?: string | null
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
          country?: string | null
          created_at?: string
          id?: string
          is_assigned?: boolean | null
          phone_number?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          max_documents: number | null
          max_messages: number | null
          max_tokens: number | null
          max_webpages: number | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_documents?: number | null
          max_messages?: number | null
          max_tokens?: number | null
          max_webpages?: number | null
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_documents?: number | null
          max_messages?: number | null
          max_tokens?: number | null
          max_webpages?: number | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
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
      [_ in never]: never
    }
    Functions: {
      cleanup_old_audit_logs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_unpaid_assistant: {
        Args:
          | {
              p_user_id: string
              p_name: string
              p_description?: string
              p_personality?: string
            }
          | {
              p_user_id: string
              p_name: string
              p_description?: string
              p_personality?: string
              p_business_name?: string
              p_concierge_name?: string
              p_share_phone_number?: boolean
              p_business_phone?: string
            }
        Returns: string
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
  users: {
    Tables: {
      customer_profiles: {
        Row: {
          company: string | null
          country: string | null
          created_at: string
          feature_flags: Json | null
          full_name: string | null
          onboarding_completed: boolean | null
          preferred_payment_method: string | null
          stripe_customer_id: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          country?: string | null
          created_at?: string
          feature_flags?: Json | null
          full_name?: string | null
          onboarding_completed?: boolean | null
          preferred_payment_method?: string | null
          stripe_customer_id?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          country?: string | null
          created_at?: string
          feature_flags?: Json | null
          full_name?: string | null
          onboarding_completed?: boolean | null
          preferred_payment_method?: string | null
          stripe_customer_id?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
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
          updated_at: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          id?: string
          is_admin?: boolean | null
          last_active?: string | null
          updated_at?: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          id?: string
          is_admin?: boolean | null
          last_active?: string | null
          updated_at?: string
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
  analytics: {
    Enums: {},
  },
  assistants: {
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
  users: {
    Enums: {},
  },
} as const
