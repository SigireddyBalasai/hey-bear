import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db.types'

// Common API response types
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  status?: number
}

// Twilio related types
export interface TwilioPhone {
  phoneNumber: string
  friendlyName: string
  status: string
  capabilities: {
    voice: boolean
    SMS: boolean
    MMS: boolean
  }
}

export interface TwilioSettings {
  accountSid: string
  authToken: string
  serviceSid: string
  status: 'active' | 'inactive' | 'error'
  error?: string
}

// Shared context types
export interface UserContext {
  user: {
    id: string
    email: string
    role: string
  } | null
  loading: boolean
  supabase: SupabaseClient<Database>
}

// Admin types
export interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalAssistants: number
  totalInteractions: number
  dailyStats: {
    date: string
    interactions: number
    users: number
  }[]
}

// Usage types
export interface UsageStats {
  totalCalls: number
  totalMessages: number
  totalTokens: number
  periodStart: string
  periodEnd: string
  details: {
    date: string
    calls: number
    messages: number
    tokens: number
  }[]
}

// Phone number types
export interface PhoneNumberDetails {
  id: string
  phone_number: string | null
  status: string
  assignedTo?: string
  createdAt: string
  updatedAt: string
  capabilities: {
    voice: boolean
    sms: boolean
    mms: boolean
  }
}

// Request handler types
export type RequestHandler<_T = unknown> = (
  req: Request,
  params: { [key: string]: string | string[] }
) => Promise<Response> | Response

// Database action types
export type DatabaseAction = 'create' | 'update' | 'delete' | 'read'

// Error handling types
export interface ApiError {
  message: string
  code: string
  status: number
  details?: unknown
}
