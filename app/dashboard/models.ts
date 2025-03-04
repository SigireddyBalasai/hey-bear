export interface Interaction {
  id: number;
  date: string;
  phoneNumber: string;
  message: string;
  response: string;
  type: string;
  responseTime: string;
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
