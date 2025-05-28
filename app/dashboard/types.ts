export interface TransformedInteraction {
  id: string;
  date: string;            // Formatted date
  phoneNumber: string;     // Derived from assistant_id or other source in API
  message: string;         // Request content
  response: string;        // Response content
  type: string;            // e.g., 'Inbound, Outbound', 'Inbound', 'Outbound'
  responseTime: string;    // Formatted duration
  assistant_id?: string | null;
  user_id?: string | null;
  duration?: number | null;       // Raw duration in ms
  interaction_time?: string | null; // Raw interaction time string
  chat?: string | null;           // chat log if available
  assistant_name?: string | null; // Name of the assistant
  status: string;               // Interaction status (e.g., 'Completed', 'Pending', 'Failed') - needs a source or default
}
