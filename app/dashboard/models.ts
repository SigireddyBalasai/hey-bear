import { Tables } from '@/lib/db.types';

export type Interaction = Tables<'interactions'> & {
  date?: string;
  phoneNumber?: string;
  message?: string;
  type?: string;
  responseTime?: string;
  metadata?: {
    requestTimestamp?: string;
    responseTimestamp?: string;
    responseDuration?: string;
  };
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
