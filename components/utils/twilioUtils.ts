import { createClient } from '@/utils/supabase/client';

/**
 * Interface for Twilio API settings
 */
export interface TwilioSettings {
  accountSid: string;
  authToken: string;
  phoneNumbers: string[];
  isConfigured: boolean;
}

/**
 * Interface for a Twilio phone number
 */
export interface TwilioPhoneNumber {
  sid: string;
  phoneNumber: string;
  friendlyName: string;
  region: string;
  capabilities: {
    sms: boolean;
    voice: boolean;
    mms: boolean;
  };
  status: string;
  inUse: boolean;
  assignedTo?: string;
}

/**
 * Fetch Twilio settings
 * @returns Twilio settings object
 */
export const fetchTwilioSettings = async (): Promise<TwilioSettings> => {
  try {
    const response = await fetch('/api/twilio/settings');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Twilio settings: ${response.status}`);
    }
    
    const { success, settings } = await response.json();
    
    if (!success || !settings) {
      return {
        accountSid: '',
        authToken: '',
        phoneNumbers: [],
        isConfigured: false
      };
    }
    
    return {
      ...settings,
      isConfigured: !!settings.accountSid
    };
  } catch (error) {
    console.error('Error fetching Twilio settings:', error);
    return {
      accountSid: '',
      authToken: '',
      phoneNumbers: [],
      isConfigured: false
    };
  }
};

/**
 * Save Twilio settings
 * @param settings Twilio settings object
 * @returns Success status
 */
export const saveTwilioSettings = async (settings: TwilioSettings): Promise<boolean> => {
  try {
    const response = await fetch('/api/twilio/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to save Twilio settings: ${response.status}`);
    }
    
    const { success } = await response.json();
    return success;
  } catch (error) {
    console.error('Error saving Twilio settings:', error);
    return false;
  }
};

/**
 * Fetch available Twilio phone numbers
 * @returns Array of Twilio phone numbers
 */
export const fetchTwilioPhoneNumbers = async (): Promise<TwilioPhoneNumber[]> => {
  try {
    const response = await fetch('/api/twilio/numbers');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Twilio phone numbers: ${response.status}`);
    }
    
    const { success, numbers } = await response.json();
    
    if (!success || !numbers) {
      return [];
    }
    
    return numbers;
  } catch (error) {
    console.error('Error fetching Twilio phone numbers:', error);
    return [];
  }
};

/**
 * Purchase a new Twilio phone number
 * @param phoneNumber Phone number to purchase
 * @returns Success status and the purchased number details
 */
export const purchaseTwilioPhoneNumber = async (phoneNumber: string): Promise<{
  success: boolean;
  number?: TwilioPhoneNumber;
  error?: string;
}> => {
  try {
    const response = await fetch('/api/twilio/purchase-number', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to purchase number: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error purchasing Twilio phone number:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to purchase phone number' 
    };
  }
};

/**
 * Search for available Twilio phone numbers
 * @param countryCode Country code to search numbers for
 * @param areaCode Optional area code to filter by
 * @returns Array of available phone numbers
 */
export const searchAvailablePhoneNumbers = async (
  countryCode: string = 'US',
  areaCode?: string
): Promise<string[]> => {
  try {
    const url = new URL('/api/twilio/search-numbers', window.location.origin);
    url.searchParams.append('countryCode', countryCode);
    if (areaCode) {
      url.searchParams.append('areaCode', areaCode);
    }
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Failed to search available numbers: ${response.status}`);
    }
    
    const { success, numbers } = await response.json();
    
    if (!success || !numbers) {
      return [];
    }
    
    return numbers;
  } catch (error) {
    console.error('Error searching for available numbers:', error);
    return [];
  }
};

/**
 * Release a Twilio phone number
 * @param phoneNumberSid SID of the phone number to release
 * @returns Success status
 */
export const releaseTwilioPhoneNumber = async (phoneNumberSid: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/twilio/release-number`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sid: phoneNumberSid }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to release phone number: ${response.status}`);
    }
    
    const { success } = await response.json();
    return success;
  } catch (error) {
    console.error('Error releasing Twilio phone number:', error);
    return false;
  }
};

/**
 * Get available and assigned phone numbers
 * @returns Object with available and assigned numbers
 */
export const getPhoneNumbersStatus = async (): Promise<{
  available: TwilioPhoneNumber[];
  assigned: { number: TwilioPhoneNumber; assistantName: string }[];
}> => {
  try {
    const supabase = createClient();
    
    // Get all Twilio numbers
    const twilioNumbers = await fetchTwilioPhoneNumbers();
    
    // Get all assistants with their assigned phone numbers
    const { data: assistants, error } = await supabase
      .schema('assistants')
      .from('assistants')
      .select('id, name, assigned_phone_number');
    
    if (error) throw error;
    
    // Map of phone numbers to assistant names
    const assignedNumbers = new Map();
    
    assistants?.forEach(assistant => {
      if (assistant.assigned_phone_number) {
        assignedNumbers.set(assistant.assigned_phone_number, assistant.name);
      }
    });
    
    // Categorize numbers
    const available: TwilioPhoneNumber[] = [];
    const assigned: { number: TwilioPhoneNumber; assistantName: string }[] = [];
    
    twilioNumbers.forEach(number => {
      const assistantName = assignedNumbers.get(number.phoneNumber);
      
      if (assistantName) {
        assigned.push({
          number,
          assistantName
        });
      } else {
        available.push(number);
      }
    });
    
    return { available, assigned };
  } catch (error) {
    console.error('Error getting phone numbers status:', error);
    return { available: [], assigned: [] };
  }
};

/**
 * Fetch phone numbers assigned to assistants
 * @returns Array of assigned phone number records
 */
export const fetchAssignedPhoneNumbers = async (): Promise<any[]> => {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .schema('assistants')
      .from('assistants')
      .select(`
        id,
        name,
        assigned_phone_number,
        user_id
      `)
      .not('assigned_phone_number', 'is', null);
    
    if (error) throw error;
    
    // Format the result for consistency with previous API
    const formattedData = (data || []).map(assistant => ({
      id: assistant.id,
      number: assistant.assigned_phone_number,
      assistants: {
        id: assistant.id,
        name: assistant.name,
        user_id: assistant.user_id
      }
    }));
    
    return formattedData;
  } catch (error) {
    console.error('Error fetching assigned phone numbers:', error);
    return [];
  }
};

/**
 * Fetch assistants without phone numbers
 * @returns Array of assistants without phone numbers
 */
export const fetchAssistantsWithoutPhoneNumbers = async (): Promise<any[]> => {
  try {
    const supabase = createClient();
    
    // Get all assistants
    const { data: allAssistants, error: assistantsError } = await supabase
      .schema('assistants')
      .from('assistants')
      .select('id, name, assigned_phone_number, user_id');
    
    if (assistantsError) throw assistantsError;
    
    // Filter out assistants with phone numbers
    const assistantsWithoutPhoneNumbers = allAssistants.filter(
      assistant => !assistant.assigned_phone_number
    );
    
    return assistantsWithoutPhoneNumbers;
  } catch (error) {
    console.error('Error fetching assistants without phone numbers:', error);
    return [];
  }
};

/**
 * Add a new phone number to the system
 * @param phoneNumber The phone number to add
 * @returns Success status
 */
export const addPhoneNumber = async (phoneNumber: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/phone-numbers/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to add phone number: ${response.status}`);
    }
    
    const { success } = await response.json();
    return success;
  } catch (error) {
    console.error('Error adding phone number:', error);
    return false;
  }
};

/**
 * Unassign a phone number from an assistant
 * @param phoneNumber The phone number to unassign
 * @returns Success status
 */
export const unassignPhoneNumber = async (phoneNumber: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/phone-numbers/unassign', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to unassign phone number: ${response.status}`);
    }
    
    const { success } = await response.json();
    return success;
  } catch (error) {
    console.error('Error unassigning phone number:', error);
    return false;
  }
};