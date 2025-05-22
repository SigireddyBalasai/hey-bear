import { Tables } from '@/lib/db.types';

export type Interaction = Tables<{ schema: 'analytics'; table: 'interactions' }> & {
  date?: string;
  phoneNumber?: string;
  message?: string;
  assistantName?: string;
  status?: 'pending' | 'completed' | 'failed';
};

export interface DashboardStats {
  totalInteractions: number;
  activeContacts: number;
  interactionsPerContact: number;
  averageResponseTime: string;
  phoneNumbers: string;
  smsReceived: string;
  smsSent: string;
  planType: string;
}

export interface PaginationInfo {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DashboardResponse {
  interactions: Interaction[];
  stats: DashboardStats;
  dateRange: string;
  pagination: PaginationInfo;
}
