export interface Interaction {
  id: number | string;
  date: string;
  phoneNumber: string;
  message: string;
  response: string;
  type: string;
  responseTime: string;
  assistant_id?: string;
  user_id?: string;
  chat?: string;
  duration?: number;
  interaction_time?: string;
  request?: any;
  metadata?: {
    requestTimestamp?: string;
    responseTimestamp?: string;
    responseDuration?: string;
  };
}

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
