export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  auth: {
    Tables: {
      audit_log_entries: {
        Row: {
          created_at: string | null;
          id: string;
          instance_id: string | null;
          ip_address: string;
          payload: Json | null;
        };
        Insert: {
          created_at?: string | null;
          id: string;
          instance_id?: string | null;
          ip_address?: string;
          payload?: Json | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          instance_id?: string | null;
          ip_address?: string;
          payload?: Json | null;
        };
        Relationships: [];
      };
      flow_state: {
        Row: {
          auth_code: string;
          auth_code_issued_at: string | null;
          authentication_method: string;
          code_challenge: string;
          code_challenge_method: Database["auth"]["Enums"]["code_challenge_method"];
          created_at: string | null;
          id: string;
          provider_access_token: string | null;
          provider_refresh_token: string | null;
          provider_type: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          auth_code: string;
          auth_code_issued_at?: string | null;
          authentication_method: string;
          code_challenge: string;
          code_challenge_method: Database["auth"]["Enums"]["code_challenge_method"];
          created_at?: string | null;
          id: string;
          provider_access_token?: string | null;
          provider_refresh_token?: string | null;
          provider_type: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          auth_code?: string;
          auth_code_issued_at?: string | null;
          authentication_method?: string;
          code_challenge?: string;
          code_challenge_method?: Database["auth"]["Enums"]["code_challenge_method"];
          created_at?: string | null;
          id?: string;
          provider_access_token?: string | null;
          provider_refresh_token?: string | null;
          provider_type?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      identities: {
        Row: {
          created_at: string | null;
          email: string | null;
          id: string;
          identity_data: Json;
          last_sign_in_at: string | null;
          provider: string;
          provider_id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          email?: string | null;
          id?: string;
          identity_data: Json;
          last_sign_in_at?: string | null;
          provider: string;
          provider_id: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          email?: string | null;
          id?: string;
          identity_data?: Json;
          last_sign_in_at?: string | null;
          provider?: string;
          provider_id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "identities_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      instances: {
        Row: {
          created_at: string | null;
          id: string;
          raw_base_config: string | null;
          updated_at: string | null;
          uuid: string | null;
        };
        Insert: {
          created_at?: string | null;
          id: string;
          raw_base_config?: string | null;
          updated_at?: string | null;
          uuid?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          raw_base_config?: string | null;
          updated_at?: string | null;
          uuid?: string | null;
        };
        Relationships: [];
      };
      mfa_amr_claims: {
        Row: {
          authentication_method: string;
          created_at: string;
          id: string;
          session_id: string;
          updated_at: string;
        };
        Insert: {
          authentication_method: string;
          created_at: string;
          id: string;
          session_id: string;
          updated_at: string;
        };
        Update: {
          authentication_method?: string;
          created_at?: string;
          id?: string;
          session_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mfa_amr_claims_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      mfa_challenges: {
        Row: {
          created_at: string;
          factor_id: string;
          id: string;
          ip_address: unknown;
          otp_code: string | null;
          verified_at: string | null;
          web_authn_session_data: Json | null;
        };
        Insert: {
          created_at: string;
          factor_id: string;
          id: string;
          ip_address: unknown;
          otp_code?: string | null;
          verified_at?: string | null;
          web_authn_session_data?: Json | null;
        };
        Update: {
          created_at?: string;
          factor_id?: string;
          id?: string;
          ip_address?: unknown;
          otp_code?: string | null;
          verified_at?: string | null;
          web_authn_session_data?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "mfa_challenges_auth_factor_id_fkey";
            columns: ["factor_id"];
            isOneToOne: false;
            referencedRelation: "mfa_factors";
            referencedColumns: ["id"];
          },
        ];
      };
      mfa_factors: {
        Row: {
          created_at: string;
          factor_type: Database["auth"]["Enums"]["factor_type"];
          friendly_name: string | null;
          id: string;
          last_challenged_at: string | null;
          phone: string | null;
          secret: string | null;
          status: Database["auth"]["Enums"]["factor_status"];
          updated_at: string;
          user_id: string;
          web_authn_aaguid: string | null;
          web_authn_credential: Json | null;
        };
        Insert: {
          created_at: string;
          factor_type: Database["auth"]["Enums"]["factor_type"];
          friendly_name?: string | null;
          id: string;
          last_challenged_at?: string | null;
          phone?: string | null;
          secret?: string | null;
          status: Database["auth"]["Enums"]["factor_status"];
          updated_at: string;
          user_id: string;
          web_authn_aaguid?: string | null;
          web_authn_credential?: Json | null;
        };
        Update: {
          created_at?: string;
          factor_type?: Database["auth"]["Enums"]["factor_type"];
          friendly_name?: string | null;
          id?: string;
          last_challenged_at?: string | null;
          phone?: string | null;
          secret?: string | null;
          status?: Database["auth"]["Enums"]["factor_status"];
          updated_at?: string;
          user_id?: string;
          web_authn_aaguid?: string | null;
          web_authn_credential?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "mfa_factors_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      one_time_tokens: {
        Row: {
          created_at: string;
          id: string;
          relates_to: string;
          token_hash: string;
          token_type: Database["auth"]["Enums"]["one_time_token_type"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id: string;
          relates_to: string;
          token_hash: string;
          token_type: Database["auth"]["Enums"]["one_time_token_type"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          relates_to?: string;
          token_hash?: string;
          token_type?: Database["auth"]["Enums"]["one_time_token_type"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "one_time_tokens_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      refresh_tokens: {
        Row: {
          created_at: string | null;
          id: number;
          instance_id: string | null;
          parent: string | null;
          revoked: boolean | null;
          session_id: string | null;
          token: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: number;
          instance_id?: string | null;
          parent?: string | null;
          revoked?: boolean | null;
          session_id?: string | null;
          token?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: number;
          instance_id?: string | null;
          parent?: string | null;
          revoked?: boolean | null;
          session_id?: string | null;
          token?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "refresh_tokens_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      saml_providers: {
        Row: {
          attribute_mapping: Json | null;
          created_at: string | null;
          entity_id: string;
          id: string;
          metadata_url: string | null;
          metadata_xml: string;
          name_id_format: string | null;
          sso_provider_id: string;
          updated_at: string | null;
        };
        Insert: {
          attribute_mapping?: Json | null;
          created_at?: string | null;
          entity_id: string;
          id: string;
          metadata_url?: string | null;
          metadata_xml: string;
          name_id_format?: string | null;
          sso_provider_id: string;
          updated_at?: string | null;
        };
        Update: {
          attribute_mapping?: Json | null;
          created_at?: string | null;
          entity_id?: string;
          id?: string;
          metadata_url?: string | null;
          metadata_xml?: string;
          name_id_format?: string | null;
          sso_provider_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "saml_providers_sso_provider_id_fkey";
            columns: ["sso_provider_id"];
            isOneToOne: false;
            referencedRelation: "sso_providers";
            referencedColumns: ["id"];
          },
        ];
      };
      saml_relay_states: {
        Row: {
          created_at: string | null;
          flow_state_id: string | null;
          for_email: string | null;
          id: string;
          redirect_to: string | null;
          request_id: string;
          sso_provider_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          flow_state_id?: string | null;
          for_email?: string | null;
          id: string;
          redirect_to?: string | null;
          request_id: string;
          sso_provider_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          flow_state_id?: string | null;
          for_email?: string | null;
          id?: string;
          redirect_to?: string | null;
          request_id?: string;
          sso_provider_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "saml_relay_states_flow_state_id_fkey";
            columns: ["flow_state_id"];
            isOneToOne: false;
            referencedRelation: "flow_state";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "saml_relay_states_sso_provider_id_fkey";
            columns: ["sso_provider_id"];
            isOneToOne: false;
            referencedRelation: "sso_providers";
            referencedColumns: ["id"];
          },
        ];
      };
      schema_migrations: {
        Row: {
          version: string;
        };
        Insert: {
          version: string;
        };
        Update: {
          version?: string;
        };
        Relationships: [];
      };
      sessions: {
        Row: {
          aal: Database["auth"]["Enums"]["aal_level"] | null;
          created_at: string | null;
          factor_id: string | null;
          id: string;
          ip: unknown | null;
          not_after: string | null;
          refreshed_at: string | null;
          tag: string | null;
          updated_at: string | null;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          aal?: Database["auth"]["Enums"]["aal_level"] | null;
          created_at?: string | null;
          factor_id?: string | null;
          id: string;
          ip?: unknown | null;
          not_after?: string | null;
          refreshed_at?: string | null;
          tag?: string | null;
          updated_at?: string | null;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          aal?: Database["auth"]["Enums"]["aal_level"] | null;
          created_at?: string | null;
          factor_id?: string | null;
          id?: string;
          ip?: unknown | null;
          not_after?: string | null;
          refreshed_at?: string | null;
          tag?: string | null;
          updated_at?: string | null;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      sso_domains: {
        Row: {
          created_at: string | null;
          domain: string;
          id: string;
          sso_provider_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          domain: string;
          id: string;
          sso_provider_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          domain?: string;
          id?: string;
          sso_provider_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sso_domains_sso_provider_id_fkey";
            columns: ["sso_provider_id"];
            isOneToOne: false;
            referencedRelation: "sso_providers";
            referencedColumns: ["id"];
          },
        ];
      };
      sso_providers: {
        Row: {
          created_at: string | null;
          id: string;
          resource_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id: string;
          resource_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          resource_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      users: {
        Row: {
          aud: string | null;
          banned_until: string | null;
          confirmation_sent_at: string | null;
          confirmation_token: string | null;
          confirmed_at: string | null;
          created_at: string | null;
          deleted_at: string | null;
          email: string | null;
          email_change: string | null;
          email_change_confirm_status: number | null;
          email_change_sent_at: string | null;
          email_change_token_current: string | null;
          email_change_token_new: string | null;
          email_confirmed_at: string | null;
          encrypted_password: string | null;
          id: string;
          instance_id: string | null;
          invited_at: string | null;
          is_anonymous: boolean;
          is_sso_user: boolean;
          is_super_admin: boolean | null;
          last_sign_in_at: string | null;
          phone: string | null;
          phone_change: string | null;
          phone_change_sent_at: string | null;
          phone_change_token: string | null;
          phone_confirmed_at: string | null;
          raw_app_meta_data: Json | null;
          raw_user_meta_data: Json | null;
          reauthentication_sent_at: string | null;
          reauthentication_token: string | null;
          recovery_sent_at: string | null;
          recovery_token: string | null;
          role: string | null;
          updated_at: string | null;
        };
        Insert: {
          aud?: string | null;
          banned_until?: string | null;
          confirmation_sent_at?: string | null;
          confirmation_token?: string | null;
          confirmed_at?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          email?: string | null;
          email_change?: string | null;
          email_change_confirm_status?: number | null;
          email_change_sent_at?: string | null;
          email_change_token_current?: string | null;
          email_change_token_new?: string | null;
          email_confirmed_at?: string | null;
          encrypted_password?: string | null;
          id: string;
          instance_id?: string | null;
          invited_at?: string | null;
          is_anonymous?: boolean;
          is_sso_user?: boolean;
          is_super_admin?: boolean | null;
          last_sign_in_at?: string | null;
          phone?: string | null;
          phone_change?: string | null;
          phone_change_sent_at?: string | null;
          phone_change_token?: string | null;
          phone_confirmed_at?: string | null;
          raw_app_meta_data?: Json | null;
          raw_user_meta_data?: Json | null;
          reauthentication_sent_at?: string | null;
          reauthentication_token?: string | null;
          recovery_sent_at?: string | null;
          recovery_token?: string | null;
          role?: string | null;
          updated_at?: string | null;
        };
        Update: {
          aud?: string | null;
          banned_until?: string | null;
          confirmation_sent_at?: string | null;
          confirmation_token?: string | null;
          confirmed_at?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          email?: string | null;
          email_change?: string | null;
          email_change_confirm_status?: number | null;
          email_change_sent_at?: string | null;
          email_change_token_current?: string | null;
          email_change_token_new?: string | null;
          email_confirmed_at?: string | null;
          encrypted_password?: string | null;
          id?: string;
          instance_id?: string | null;
          invited_at?: string | null;
          is_anonymous?: boolean;
          is_sso_user?: boolean;
          is_super_admin?: boolean | null;
          last_sign_in_at?: string | null;
          phone?: string | null;
          phone_change?: string | null;
          phone_change_sent_at?: string | null;
          phone_change_token?: string | null;
          phone_confirmed_at?: string | null;
          raw_app_meta_data?: Json | null;
          raw_user_meta_data?: Json | null;
          reauthentication_sent_at?: string | null;
          reauthentication_token?: string | null;
          recovery_sent_at?: string | null;
          recovery_token?: string | null;
          role?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      email: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      jwt: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      role: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      uid: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
    };
    Enums: {
      aal_level: "aal1" | "aal2" | "aal3";
      code_challenge_method: "s256" | "plain";
      factor_status: "unverified" | "verified";
      factor_type: "totp" | "webauthn" | "phone";
      one_time_token_type:
        | "confirmation_token"
        | "reauthentication_token"
        | "recovery_token"
        | "email_change_token_new"
        | "email_change_token_current"
        | "phone_change_token";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      assistant_activity: {
        Row: {
          assistant_id: string;
          created_at: string;
          last_activity_at: string | null;
          last_message_at: string | null;
          last_used_at: string | null;
          total_documents: number | null;
          total_interactions: number | null;
          total_messages: number | null;
          total_tokens: number | null;
          total_webpages: number | null;
          updated_at: string;
        };
        Insert: {
          assistant_id: string;
          created_at?: string;
          last_activity_at?: string | null;
          last_message_at?: string | null;
          last_used_at?: string | null;
          total_documents?: number | null;
          total_interactions?: number | null;
          total_messages?: number | null;
          total_tokens?: number | null;
          total_webpages?: number | null;
          updated_at?: string;
        };
        Update: {
          assistant_id?: string;
          created_at?: string;
          last_activity_at?: string | null;
          last_message_at?: string | null;
          last_used_at?: string | null;
          total_documents?: number | null;
          total_interactions?: number | null;
          total_messages?: number | null;
          total_tokens?: number | null;
          total_webpages?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assistant_activity_assistant_id_fkey";
            columns: ["assistant_id"];
            isOneToOne: true;
            referencedRelation: "assistant_detail_view";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assistant_activity_assistant_id_fkey";
            columns: ["assistant_id"];
            isOneToOne: true;
            referencedRelation: "assistants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assistant_activity_assistant_id_fkey";
            columns: ["assistant_id"];
            isOneToOne: true;
            referencedRelation: "usage_overview";
            referencedColumns: ["assistant_id"];
          },
        ];
      };
      assistant_configs: {
        Row: {
          business_hours: Json | null;
          business_name: string | null;
          business_phone: string | null;
          concierge_name: string | null;
          created_at: string;
          description: string | null;
          display_name: string | null;
          features_enabled: Json | null;
          id: string;
          personality: string | null;
          pinecone_name: string | null;
          share_phone_number: boolean | null;
          system_prompt: string | null;
          timezone: string | null;
          updated_at: string;
          webhook_enabled: boolean | null;
          webhook_url: string | null;
        };
        Insert: {
          business_hours?: Json | null;
          business_name?: string | null;
          business_phone?: string | null;
          concierge_name?: string | null;
          created_at?: string;
          description?: string | null;
          display_name?: string | null;
          features_enabled?: Json | null;
          id: string;
          personality?: string | null;
          pinecone_name?: string | null;
          share_phone_number?: boolean | null;
          system_prompt?: string | null;
          timezone?: string | null;
          updated_at?: string;
          webhook_enabled?: boolean | null;
          webhook_url?: string | null;
        };
        Update: {
          business_hours?: Json | null;
          business_name?: string | null;
          business_phone?: string | null;
          concierge_name?: string | null;
          created_at?: string;
          description?: string | null;
          display_name?: string | null;
          features_enabled?: Json | null;
          id?: string;
          personality?: string | null;
          pinecone_name?: string | null;
          share_phone_number?: boolean | null;
          system_prompt?: string | null;
          timezone?: string | null;
          updated_at?: string;
          webhook_enabled?: boolean | null;
          webhook_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "assistant_configs_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "assistant_detail_view";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assistant_configs_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "assistants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assistant_configs_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "usage_overview";
            referencedColumns: ["assistant_id"];
          },
        ];
      };
      assistant_limits: {
        Row: {
          assistant_id: string;
          created_at: string;
          current_month_documents: number;
          current_month_messages: number;
          current_month_tokens: number;
          current_month_webpages: number;
          current_period_start: string;
          documents_used: number;
          last_reset: string;
          message_used: number;
          token_used: number;
          updated_at: string;
          webpages_used: number;
        };
        Insert: {
          assistant_id: string;
          created_at?: string;
          current_month_documents?: number;
          current_month_messages?: number;
          current_month_tokens?: number;
          current_month_webpages?: number;
          current_period_start?: string;
          documents_used?: number;
          last_reset?: string;
          message_used?: number;
          token_used?: number;
          updated_at?: string;
          webpages_used?: number;
        };
        Update: {
          assistant_id?: string;
          created_at?: string;
          current_month_documents?: number;
          current_month_messages?: number;
          current_month_tokens?: number;
          current_month_webpages?: number;
          current_period_start?: string;
          documents_used?: number;
          last_reset?: string;
          message_used?: number;
          token_used?: number;
          updated_at?: string;
          webpages_used?: number;
        };
        Relationships: [
          {
            foreignKeyName: "assistant_limits_assistant_id_fkey";
            columns: ["assistant_id"];
            isOneToOne: true;
            referencedRelation: "assistant_detail_view";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assistant_limits_assistant_id_fkey";
            columns: ["assistant_id"];
            isOneToOne: true;
            referencedRelation: "assistants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assistant_limits_assistant_id_fkey";
            columns: ["assistant_id"];
            isOneToOne: true;
            referencedRelation: "usage_overview";
            referencedColumns: ["assistant_id"];
          },
        ];
      };
      assistant_subscriptions: {
        Row: {
          assistant_id: string;
          cancel_at_period_end: boolean | null;
          created_at: string;
          currency: string | null;
          current_period_end: string | null;
          current_period_start: string | null;
          document_limit: number | null;
          id: string;
          message_limit: number | null;
          payment_session_id: string | null;
          plan_id: string;
          plan_name: string | null;
          price: number | null;
          product_id: string | null;
          status: Database["public"]["Enums"]["subscription_status"];
          stripe_subscription_id: string | null;
          support_email: string | null;
          support_level: string | null;
          updated_at: string;
          webpage_limit: number | null;
        };
        Insert: {
          assistant_id: string;
          cancel_at_period_end?: boolean | null;
          created_at?: string;
          currency?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          document_limit?: number | null;
          id?: string;
          message_limit?: number | null;
          payment_session_id?: string | null;
          plan_id: string;
          plan_name?: string | null;
          price?: number | null;
          product_id?: string | null;
          status: Database["public"]["Enums"]["subscription_status"];
          stripe_subscription_id?: string | null;
          support_email?: string | null;
          support_level?: string | null;
          updated_at?: string;
          webpage_limit?: number | null;
        };
        Update: {
          assistant_id?: string;
          cancel_at_period_end?: boolean | null;
          created_at?: string;
          currency?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          document_limit?: number | null;
          id?: string;
          message_limit?: number | null;
          payment_session_id?: string | null;
          plan_id?: string;
          plan_name?: string | null;
          price?: number | null;
          product_id?: string | null;
          status?: Database["public"]["Enums"]["subscription_status"];
          stripe_subscription_id?: string | null;
          support_email?: string | null;
          support_level?: string | null;
          updated_at?: string;
          webpage_limit?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "assistant_subscriptions_assistant_id_fkey";
            columns: ["assistant_id"];
            isOneToOne: true;
            referencedRelation: "assistant_detail_view";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assistant_subscriptions_assistant_id_fkey";
            columns: ["assistant_id"];
            isOneToOne: true;
            referencedRelation: "assistants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assistant_subscriptions_assistant_id_fkey";
            columns: ["assistant_id"];
            isOneToOne: true;
            referencedRelation: "usage_overview";
            referencedColumns: ["assistant_id"];
          },
          {
            foreignKeyName: "assistant_subscriptions_payment_session_id_fkey";
            columns: ["payment_session_id"];
            isOneToOne: false;
            referencedRelation: "payment_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      assistant_usage_limits: {
        Row: {
          assistant_id: string;
          created_at: string;
          document_limit: number | null;
          max_messages: number | null;
          max_tokens: number | null;
          message_limit: number | null;
          token_limit: number | null;
          updated_at: string;
          webpage_limit: number | null;
        };
        Insert: {
          assistant_id: string;
          created_at?: string;
          document_limit?: number | null;
          max_messages?: number | null;
          max_tokens?: number | null;
          message_limit?: number | null;
          token_limit?: number | null;
          updated_at?: string;
          webpage_limit?: number | null;
        };
        Update: {
          assistant_id?: string;
          created_at?: string;
          document_limit?: number | null;
          max_messages?: number | null;
          max_tokens?: number | null;
          message_limit?: number | null;
          token_limit?: number | null;
          updated_at?: string;
          webpage_limit?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "assistant_usage_limits_assistant_id_fkey";
            columns: ["assistant_id"];
            isOneToOne: true;
            referencedRelation: "assistant_detail_view";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assistant_usage_limits_assistant_id_fkey";
            columns: ["assistant_id"];
            isOneToOne: true;
            referencedRelation: "assistants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assistant_usage_limits_assistant_id_fkey";
            columns: ["assistant_id"];
            isOneToOne: true;
            referencedRelation: "usage_overview";
            referencedColumns: ["assistant_id"];
          },
        ];
      };
      assistants: {
        Row: {
          assigned_phone_number: string | null;
          created_at: string;
          id: string;
          is_active: boolean;
          is_starred: boolean | null;
          name: string;
          pending: boolean | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          assigned_phone_number?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          is_starred?: boolean | null;
          name: string;
          pending?: boolean | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          assigned_phone_number?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          is_starred?: boolean | null;
          name?: string;
          pending?: boolean | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          action: string;
          action_timestamp: string;
          created_at: string;
          details: Json | null;
          entity_id: string;
          entity_type: string;
          id: string;
          performed_by: string;
          related_entity_id: string | null;
        };
        Insert: {
          action: string;
          action_timestamp?: string;
          created_at?: string;
          details?: Json | null;
          entity_id: string;
          entity_type: string;
          id?: string;
          performed_by: string;
          related_entity_id?: string | null;
        };
        Update: {
          action?: string;
          action_timestamp?: string;
          created_at?: string;
          details?: Json | null;
          entity_id?: string;
          entity_type?: string;
          id?: string;
          performed_by?: string;
          related_entity_id?: string | null;
        };
        Relationships: [];
      };
      historical_usage: {
        Row: {
          assistant_id: string;
          avg_daily_messages: number | null;
          created_at: string;
          documents_used: number;
          id: string;
          messages_used: number;
          peak_usage_date: string | null;
          period: string;
          tokens_used: number;
          updated_at: string;
          webpages_used: number;
        };
        Insert: {
          assistant_id: string;
          avg_daily_messages?: number | null;
          created_at?: string;
          documents_used: number;
          id?: string;
          messages_used: number;
          peak_usage_date?: string | null;
          period: string;
          tokens_used: number;
          updated_at?: string;
          webpages_used: number;
        };
        Update: {
          assistant_id?: string;
          avg_daily_messages?: number | null;
          created_at?: string;
          documents_used?: number;
          id?: string;
          messages_used?: number;
          peak_usage_date?: string | null;
          period?: string;
          tokens_used?: number;
          updated_at?: string;
          webpages_used?: number;
        };
        Relationships: [
          {
            foreignKeyName: "historical_usage_assistant_id_fkey";
            columns: ["assistant_id"];
            isOneToOne: false;
            referencedRelation: "assistant_detail_view";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "historical_usage_assistant_id_fkey";
            columns: ["assistant_id"];
            isOneToOne: false;
            referencedRelation: "assistants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "historical_usage_assistant_id_fkey";
            columns: ["assistant_id"];
            isOneToOne: false;
            referencedRelation: "usage_overview";
            referencedColumns: ["assistant_id"];
          },
        ];
      };
      interactions: {
        Row: {
          assistant_id: string;
          chat: Json | null;
          cost_estimate: number | null;
          created_at: string | null;
          duration: number | null;
          error_message: string | null;
          id: string;
          input_tokens: number | null;
          interaction_time: string | null;
          is_error: boolean | null;
          metadata: Json | null;
          model: string | null;
          output_tokens: number | null;
          request: Json | null;
          response: Json | null;
          session_id: string | null;
          source: string | null;
          status: string | null;
          token_usage: number | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          assistant_id: string;
          chat?: Json | null;
          cost_estimate?: number | null;
          created_at?: string | null;
          duration?: number | null;
          error_message?: string | null;
          id?: string;
          input_tokens?: number | null;
          interaction_time?: string | null;
          is_error?: boolean | null;
          metadata?: Json | null;
          model?: string | null;
          output_tokens?: number | null;
          request?: Json | null;
          response?: Json | null;
          session_id?: string | null;
          source?: string | null;
          status?: string | null;
          token_usage?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          assistant_id?: string;
          chat?: Json | null;
          cost_estimate?: number | null;
          created_at?: string | null;
          duration?: number | null;
          error_message?: string | null;
          id?: string;
          input_tokens?: number | null;
          interaction_time?: string | null;
          is_error?: boolean | null;
          metadata?: Json | null;
          model?: string | null;
          output_tokens?: number | null;
          request?: Json | null;
          response?: Json | null;
          session_id?: string | null;
          source?: string | null;
          status?: string | null;
          token_usage?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      payment_sessions: {
        Row: {
          amount_total: number | null;
          assistant_config_data: Json;
          created_at: string;
          currency: string | null;
          customer_email: string | null;
          expires_at: string | null;
          id: string;
          plan_id: string | null;
          session_id: string;
          status: string;
          stripe_checkout_session_id: string | null;
          stripe_customer_id: string | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          amount_total?: number | null;
          assistant_config_data: Json;
          created_at?: string;
          currency?: string | null;
          customer_email?: string | null;
          expires_at?: string | null;
          id?: string;
          plan_id?: string | null;
          session_id: string;
          status?: string;
          stripe_checkout_session_id?: string | null;
          stripe_customer_id?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          amount_total?: number | null;
          assistant_config_data?: Json;
          created_at?: string;
          currency?: string | null;
          customer_email?: string | null;
          expires_at?: string | null;
          id?: string;
          plan_id?: string | null;
          session_id?: string;
          status?: string;
          stripe_checkout_session_id?: string | null;
          stripe_customer_id?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      phone_numbers: {
        Row: {
          assistant_id: string | null;
          capabilities: Json | null;
          capabilities_enabled: Json | null;
          country: string | null;
          created_at: string;
          id: string;
          is_assigned: boolean | null;
          messaging_service_sid: string | null;
          phone_number: string;
          sms_fallback_url: string | null;
          sms_url: string | null;
          status: string | null;
          twilio_sid: string | null;
          updated_at: string;
          voice_url: string | null;
        };
        Insert: {
          assistant_id?: string | null;
          capabilities?: Json | null;
          capabilities_enabled?: Json | null;
          country?: string | null;
          created_at?: string;
          id?: string;
          is_assigned?: boolean | null;
          messaging_service_sid?: string | null;
          phone_number: string;
          sms_fallback_url?: string | null;
          sms_url?: string | null;
          status?: string | null;
          twilio_sid?: string | null;
          updated_at?: string;
          voice_url?: string | null;
        };
        Update: {
          assistant_id?: string | null;
          capabilities?: Json | null;
          capabilities_enabled?: Json | null;
          country?: string | null;
          created_at?: string;
          id?: string;
          is_assigned?: boolean | null;
          messaging_service_sid?: string | null;
          phone_number?: string;
          sms_fallback_url?: string | null;
          sms_url?: string | null;
          status?: string | null;
          twilio_sid?: string | null;
          updated_at?: string;
          voice_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "phone_numbers_assistant_id_fkey";
            columns: ["assistant_id"];
            isOneToOne: false;
            referencedRelation: "assistant_detail_view";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "phone_numbers_assistant_id_fkey";
            columns: ["assistant_id"];
            isOneToOne: false;
            referencedRelation: "assistants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "phone_numbers_assistant_id_fkey";
            columns: ["assistant_id"];
            isOneToOne: false;
            referencedRelation: "usage_overview";
            referencedColumns: ["assistant_id"];
          },
        ];
      };
      usage_statistics: {
        Row: {
          cost_estimate: number | null;
          created_at: string;
          entity_id: string;
          entity_type: string;
          id: string;
          input_tokens: number | null;
          interactions_count: number | null;
          last_activity: string | null;
          messages_count: number | null;
          output_tokens: number | null;
          period: string | null;
          token_usage: number | null;
          updated_at: string;
        };
        Insert: {
          cost_estimate?: number | null;
          created_at?: string;
          entity_id: string;
          entity_type: string;
          id?: string;
          input_tokens?: number | null;
          interactions_count?: number | null;
          last_activity?: string | null;
          messages_count?: number | null;
          output_tokens?: number | null;
          period?: string | null;
          token_usage?: number | null;
          updated_at?: string;
        };
        Update: {
          cost_estimate?: number | null;
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          id?: string;
          input_tokens?: number | null;
          interactions_count?: number | null;
          last_activity?: string | null;
          messages_count?: number | null;
          output_tokens?: number | null;
          period?: string | null;
          token_usage?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      assistant_detail_view: {
        Row: {
          activity_updated_at: string | null;
          assigned_phone_number: string | null;
          assistant_created_at: string | null;
          assistant_name: string | null;
          assistant_updated_at: string | null;
          business_name: string | null;
          config_created_at: string | null;
          config_updated_at: string | null;
          current_period_end: string | null;
          description: string | null;
          display_name: string | null;
          document_limit: number | null;
          features_enabled: Json | null;
          id: string | null;
          is_active: boolean | null;
          is_starred: boolean | null;
          last_activity_at: string | null;
          last_message_at: string | null;
          last_used_at: string | null;
          message_limit: number | null;
          personality: string | null;
          pinecone_name: string | null;
          plan_id: string | null;
          plan_name: string | null;
          price: number | null;
          product_id: string | null;
          share_phone_number: boolean | null;
          stripe_subscription_id: string | null;
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null;
          support_email: string | null;
          support_level: string | null;
          system_prompt: string | null;
          timezone: string | null;
          total_documents: number | null;
          total_interactions: number | null;
          total_messages: number | null;
          total_tokens: number | null;
          total_webpages: number | null;
          user_id: string | null;
          webhook_enabled: boolean | null;
          webhook_url: string | null;
          webpage_limit: number | null;
        };
        Relationships: [];
      };
      interaction_phone_summary: {
        Row: {
          assistant_id: string | null;
          avg_duration: number | null;
          phone: string | null;
          total_calls: number | null;
        };
        Relationships: [];
      };
      plan_details: {
        Row: {
          assistant_id: string | null;
          capabilities_enabled: Json | null;
          currency: string | null;
          document_limit: number | null;
          features_enabled: Json | null;
          message_limit: number | null;
          plan_name: string | null;
          price: number | null;
          product_id: string | null;
          support_email: string | null;
          support_level: string | null;
          webpage_limit: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "assistant_subscriptions_assistant_id_fkey";
            columns: ["assistant_id"];
            isOneToOne: true;
            referencedRelation: "assistant_detail_view";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assistant_subscriptions_assistant_id_fkey";
            columns: ["assistant_id"];
            isOneToOne: true;
            referencedRelation: "assistants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assistant_subscriptions_assistant_id_fkey";
            columns: ["assistant_id"];
            isOneToOne: true;
            referencedRelation: "usage_overview";
            referencedColumns: ["assistant_id"];
          },
        ];
      };
      usage_overview: {
        Row: {
          assistant_id: string | null;
          assistant_name: string | null;
          current_month_messages: number | null;
          current_month_tokens: number | null;
          document_limit: number | null;
          documents_remaining: number | null;
          documents_used: number | null;
          message_limit: number | null;
          message_used: number | null;
          messages_remaining: number | null;
          plan_name: string | null;
          token_used: number | null;
          webpage_limit: number | null;
          webpages_remaining: number | null;
          webpages_used: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      cleanup_old_audit_logs: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      has_feature_access: {
        Args: { p_assistant_id: string; p_feature: string };
        Returns: boolean;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      provision_twilio_number: {
        Args: {
          p_phone_number: string;
          p_twilio_sid: string;
          p_friendly_name?: string;
          p_country?: string;
          p_region?: string;
          p_capabilities?: Json;
        };
        Returns: string;
      };
      update_twilio_webhooks: {
        Args: {
          p_phone_id: string;
          p_voice_url?: string;
          p_sms_url?: string;
          p_sms_fallback_url?: string;
        };
        Returns: boolean;
      };
      update_usage: {
        Args: {
          p_assistant_id: string;
          p_messages?: number;
          p_tokens?: number;
          p_documents?: number;
          p_webpages?: number;
        };
        Returns: undefined;
      };
    };
    Enums: {
      country: "US" | "Canada";
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
        | "December";
      subscription_status:
        | "active"
        | "trialing"
        | "past_due"
        | "canceled"
        | "unpaid";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  auth: {
    Enums: {
      aal_level: ["aal1", "aal2", "aal3"],
      code_challenge_method: ["s256", "plain"],
      factor_status: ["unverified", "verified"],
      factor_type: ["totp", "webauthn", "phone"],
      one_time_token_type: [
        "confirmation_token",
        "reauthentication_token",
        "recovery_token",
        "email_change_token_new",
        "email_change_token_current",
        "phone_change_token",
      ],
    },
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
      subscription_status: [
        "active",
        "trialing",
        "past_due",
        "canceled",
        "unpaid",
      ],
    },
  },
} as const;
