import { createClient } from '@/utils/supabase/server';

type SMSLog = {
  messageId: string;
  fromNumber: string;
  toNumber: string;
  message: string;
  direction: 'incoming' | 'outgoing';
  status: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
  assistantId?: string;
  userId?: string;
};

export async function logSMSMessage(data: SMSLog): Promise<void> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from('interactions').insert({
      id: data.messageId,
      assistant_id: data.assistantId ?? null,
      user_id: data.userId ?? null,
      request: `SMS ${data.direction}: ${data.message}`,
      response: `Status: ${data.status}`,
      chat: `SMS conversation between ${data.fromNumber} and ${data.toNumber}`,
      interaction_time: data.timestamp,
      created_at: data.timestamp,
      updated_at: data.timestamp,
      is_error: data.status === 'failed',
    });

    if (error) {
      console.error('Error logging SMS to interactions:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in logSMSMessage:', error);
    throw error;
  }
}

export async function updateSMSStatus(messageId: string, status: string): Promise<void> {
  try {
    const supabase = await createClient();

    const { error } = await supabase

      .from('interactions')
      .update({
        response: `Status: ${status}`,
        is_error: status === 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId);

    if (error) {
      console.error('Error updating SMS status in interactions:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in updateSMSStatus:', error);
    throw error;
  }
}

export async function getSMSLogs(assistantId: string): Promise<SMSLog[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase

      .from('interactions')
      .select('*')
      .eq('assistant_id', assistantId)
      .like('request', 'SMS %')
      .order('interaction_time', { ascending: false });

    if (error) {
      console.error('Error fetching SMS logs from interactions:', error);
      throw error;
    }

    // Transform interactions data back to SMSLog format
    return data.map(interaction => {
      const isIncoming = interaction.request.includes('SMS incoming:');
      const message = interaction.request.replace(/^SMS (incoming|outgoing): /, '');
      const status = interaction.is_error ? 'failed' : 'delivered';

      return {
        messageId: interaction.id,
        fromNumber: '', // Would need to extract from chat field or store separately
        toNumber: '', // Would need to extract from chat field or store separately
        message,
        direction: isIncoming ? 'incoming' : 'outgoing',
        status,
        timestamp: interaction.interaction_time ?? interaction.created_at ?? '',
        assistantId: interaction.assistant_id ?? undefined,
        userId: interaction.user_id ?? undefined,
      };
    });
  } catch (error) {
    console.error('Error in getSMSLogs:', error);
    throw error;
  }
}

export async function getFailedSMSCount(assistantId: string): Promise<number> {
  try {
    const supabase = await createClient();

    const { count, error } = await supabase

      .from('interactions')
      .select('*', { count: 'exact', head: true })
      .eq('assistant_id', assistantId)
      .like('request', 'SMS %')
      .eq('is_error', true);

    if (error) {
      console.error('Error counting failed SMS from interactions:', error);
      throw error;
    }

    return count ?? 0;
  } catch (error) {
    console.error('Error in getFailedSMSCount:', error);
    throw error;
  }
}
