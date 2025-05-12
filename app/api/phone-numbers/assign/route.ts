import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { logTwilio, logTwilioError } from '@/utils/twilio-logger';

export async function POST(request: Request) {
  const startTime = new Date();
  console.log(`[${startTime.toISOString()}] Phone Number Assignment - START`);
  
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log(`[${new Date().toISOString()}] Phone Number Assignment - Unauthorized request`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log(`[${new Date().toISOString()}] Phone Number Assignment - User authenticated: ${user.id}`);

    // Parse the request body
    const { assistantId, phoneNumber, webhook, webhookUrl, audioUrl, countryCode, areaCode } = await request.json();
    // Use webhookUrl if provided, otherwise fall back to webhook
    const finalWebhookUrl = webhookUrl || webhook;
    
    console.log(`[${new Date().toISOString()}] Phone Number Assignment - Request body:`, { 
      assistantId, 
      phoneNumber, 
      webhookUrl: finalWebhookUrl,
      audioUrl: audioUrl || 'Not provided',
      countryCode,
      areaCode
    });
    
    // Validate required fields
    if (!assistantId || !countryCode) {
      console.log(`[${new Date().toISOString()}] Phone Number Assignment - Missing fields`);
      return NextResponse.json(
        { error: 'Missing required fields: assistantId and countryCode are required' }, 
        { status: 400 }
      );
    }

    let phoneNumberToAssign = phoneNumber;
    if (!phoneNumber) {
      // If phoneNumber is not provided, search for an available number in the specified country
      console.log(`[${new Date().toISOString()}] Phone Number Assignment - No phone number provided, searching for available number in ${countryCode}`);

      // Search for available phone numbers
      const searchParams: {
        country: string;
        smsEnabled: boolean;
        areaCode?: number;
      } = {
        country: countryCode,
        smsEnabled: true
      };

      // Only add areaCode to the search params if it's provided and not empty
      if (areaCode && areaCode.trim() !== '') {
        searchParams.areaCode = parseInt(areaCode.trim(), 10);
      }

      try {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;

        if (!accountSid || !authToken) {
          console.log(`[${new Date().toISOString()}] Phone Number Assignment - Twilio credentials not configured`);
          return NextResponse.json({ error: 'Twilio credentials not configured' }, { status: 500 });
        }

        const twilio = await import('twilio');
        const client = twilio.default(accountSid, authToken);

        const availableNumbers = await client.availablePhoneNumbers(countryCode).local.list(searchParams);

        if (!availableNumbers || availableNumbers.length === 0) {
          console.log(`[${new Date().toISOString()}] Phone Number Assignment - No available numbers found in ${countryCode}, attempting to purchase`);
          
          // Attempt to purchase a number
          try {
            // Don't include areaCode in purchaseParams if it doesn't exist or is empty
            const purchaseSearchParams = {
              country: countryCode,
              smsEnabled: true
            };
            
            // Only add areaCode if it's valid
            if (areaCode && areaCode.trim() !== '') {
              Object.assign(purchaseSearchParams, { areaCode: parseInt(areaCode.trim(), 10) });
            }
            
            const availableNumbersForPurchase = await client.availablePhoneNumbers(countryCode)
              .local.list(purchaseSearchParams);
            
            if (!availableNumbersForPurchase || availableNumbersForPurchase.length === 0) {
              const errorMessage = areaCode && areaCode.trim() !== '' 
                ? `No numbers available for purchase in ${countryCode} with area code ${areaCode}`
                : `No numbers available for purchase in ${countryCode}`;
              
              console.log(`[${new Date().toISOString()}] Phone Number Assignment - ${errorMessage}`);
              return NextResponse.json({ error: errorMessage }, { status: 404 });
            }
            
            const phoneNumberToPurchase = availableNumbersForPurchase[0].phoneNumber;
            
            const purchasedNumber = await client.incomingPhoneNumbers.create({
              phoneNumber: phoneNumberToPurchase,
              smsApplicationSid: process.env.TWILIO_APP_SID,
              voiceApplicationSid: process.env.TWILIO_APP_SID
            });
            
            if (!purchasedNumber) {
              console.log(`[${new Date().toISOString()}] Phone Number Assignment - Failed to purchase number in ${countryCode}`);
              return NextResponse.json({ error: `Failed to purchase number in ${countryCode}` }, { status: 500 });
            }
            
            phoneNumberToAssign = purchasedNumber.phoneNumber;
            console.log(`[${new Date().toISOString()}] Phone Number Assignment - Purchased number: ${phoneNumberToAssign}`);
            
            // Add the purchased number to the pool
            try {
              const supabase = await createClient();
              const { data: number, error: insertError } = await supabase
                .from('phone_numbers')
                .insert({
                  phone_number: phoneNumberToAssign,
                  is_assigned: false,
                  created_at: new Date().toISOString(),
                })
                .select()
                .single();
              
              if (insertError) {
                console.error(`[${new Date().toISOString()}] Phone Number Assignment - Error adding purchased number to pool:`, insertError);
                return NextResponse.json({ error: `Error adding purchased number to pool: ${insertError.message}` }, { status: 500 });
              }
            } catch (poolError: any) {
              console.error(`[${new Date().toISOString()}] Phone Number Assignment - Error adding purchased number to pool:`, poolError);
              return NextResponse.json({ error: `Error adding purchased number to pool: ${poolError.message}` }, { status: 500 });
            }
          } catch (purchaseError: any) {
            console.error(`[${new Date().toISOString()}] Phone Number Assignment - Error purchasing number:`, purchaseError);
            return NextResponse.json({ error: `Error purchasing number: ${purchaseError.message}` }, { status: 500 });
          }
        } else {
          phoneNumberToAssign = availableNumbers[0].phoneNumber;
          console.log(`[${new Date().toISOString()}] Phone Number Assignment - Found available number: ${phoneNumberToAssign}`);
          
          const { data: existingNumber, error: checkError } = await supabase
            .from('phone_numbers')
            .select('*')
            .eq('number', phoneNumberToAssign)
            .single();
          
          // If the number doesn't exist in our database, add it
          if (checkError || !existingNumber) {
            console.log(`[${new Date().toISOString()}] Phone Number Assignment - Number not in database, adding it: ${phoneNumberToAssign}`);
            
            try {
              const { data: insertedNumber, error: insertError } = await supabase
                .from('phone_numbers')
                .insert({
                  phone_number: phoneNumberToAssign,
                  is_assigned: false,
                  created_at: new Date().toISOString(),
                })
                .select()
                .single();
              
              if (insertError) {
                console.error(`[${new Date().toISOString()}] Phone Number Assignment - Error adding found number to database:`, insertError);
                return NextResponse.json({ error: `Error adding number to database: ${insertError.message}` }, { status: 500 });
              }
              
              console.log(`[${new Date().toISOString()}] Phone Number Assignment - Successfully added number to database: ${phoneNumberToAssign}`);
            } catch (dbError: any) {
              console.error(`[${new Date().toISOString()}] Phone Number Assignment - Failed to add number to database:`, dbError);
              return NextResponse.json({ error: `Failed to add number to database: ${dbError.message}` }, { status: 500 });
            }
          }
        }
      } catch (searchError: any) {
        console.error(`[${new Date().toISOString()}] Phone Number Assignment - Error searching for phone numbers:`, searchError);
        return NextResponse.json({ error: `Error searching for phone numbers: ${searchError.message}` }, { status: 500 });
      }
    }
    
    // Validate webhook URL if provided
    if (!finalWebhookUrl) {
      console.log(`[${new Date().toISOString()}] Phone Number Assignment - Missing webhook URL`);
      return NextResponse.json(
        { error: 'Webhook URL is required for Twilio integration' }, 
        { status: 400 }
      );
    }
    
    if (!isValidURL(finalWebhookUrl)) {
      console.log(`[${new Date().toISOString()}] Phone Number Assignment - Invalid webhook URL`);
      return NextResponse.json(
        { error: 'Invalid webhook URL format' }, 
        { status: 400 }
      );
    }
    
    // Check if assistant exists
    const { data: assistantData, error: assistantError } = await supabase
      .from('assistants')
      .select('id, assigned_phone_number')
      .eq('id', assistantId)
      .single();
    
    if (assistantError || !assistantData) {
      console.log(`[${new Date().toISOString()}] Phone Number Assignment - No-Show not found`);
      return NextResponse.json(
        { error: 'No-Show not found' }, 
        { status: 404 }
      );
    }
    
    // Check if assistant already has a phone number
    if (assistantData.assigned_phone_number) {
      console.log(`[${new Date().toISOString()}] Phone Number Assignment - No-Show already has a phone number`);
      return NextResponse.json(
        { error: 'No-show already has a phone number assigned' }, 
        { status: 400 }
      );
    }
    
    // Get the phone number record
    const { data: phoneNumberData, error: phoneNumberError } = await supabase
      .from('phone_numbers')
      .select('*')
      .eq('number', phoneNumberToAssign)
      .single();
    
    if (phoneNumberError || !phoneNumberData) {
      console.log(`[${new Date().toISOString()}] Phone Number Assignment - Phone number not found in database`);
      return NextResponse.json(
        { error: 'Phone number not found in database' }, 
        { status: 404 }
      );
    }
    
    // Check if phone number is already assigned
    if (phoneNumberData.is_assigned) {
      console.log(`[${new Date().toISOString()}] Phone Number Assignment - Phone number already assigned`);
      return NextResponse.json(
        { error: 'Phone number is already assigned to an assistant' }, 
        { status: 400 }
      );
    }
    
    // 1. Create and configure TwiML app if using Twilio or other SMS provider
    let twimlAppSid: string | null = null;
    let twimlAppDetails: any = null;
    let incomingPhoneNumbers: any[] | null = null;
    try {
      // Removed SMS_PROVIDER check - always using Twilio
      console.log(`[${new Date().toISOString()}] Phone Number Assignment - Creating and configuring Twilio TwiML app...`);
      console.log(`[${new Date().toISOString()}] Phone Number Assignment - Using webhook URL: ${finalWebhookUrl}`);
      
      // Update to return full TwiML app details and pass audioUrl
      const twilioResult = await createAndConfigureTwilioTwiMLApp(phoneNumberToAssign, finalWebhookUrl, audioUrl);
      if (!twilioResult || !twilioResult.sid) {
        throw new Error('Failed to create Twilio TwiML app - no app SID returned');
      }
      
      // Check if the number changed during the process
      if (twilioResult.actualPhoneNumber && twilioResult.actualPhoneNumber !== phoneNumberToAssign) {
        console.log(`[${new Date().toISOString()}] Phone Number Assignment - Phone number changed from ${phoneNumberToAssign} to ${twilioResult.actualPhoneNumber}`);
        
        // Remove the old number from our database
        try {
          await supabase
            .from('phone_numbers')
            .delete()
            .eq('number', phoneNumberToAssign);
          
          console.log(`[${new Date().toISOString()}] Phone Number Assignment - Removed old phone number from database: ${phoneNumberToAssign}`);
        } catch (deleteError) {
          console.error(`[${new Date().toISOString()}] Phone Number Assignment - Error removing old phone number:`, deleteError);
          // Continue anyway as this is not fatal
        }
        
        // Add the new number to our database
        try {
          const { data: newNumber, error: insertError } = await supabase
            .from('phone_numbers')
            .insert({
              phone_number: twilioResult.actualPhoneNumber,
              is_assigned: false,
              created_at: new Date().toISOString(),
            })
            .select()
            .single();
          
          if (insertError) {
            console.error(`[${new Date().toISOString()}] Phone Number Assignment - Error adding new phone number to database: ${insertError}`);
            return NextResponse.json({ error: `Error adding new phone number to database: ${insertError.message}` }, { status: 500 });
          }
          
          console.log(`[${new Date().toISOString()}] Phone Number Assignment - Added new phone number to database: ${twilioResult.actualPhoneNumber}`);
          
          // Update the phone number to use
          phoneNumberToAssign = twilioResult.actualPhoneNumber;
        } catch (insertError: any) {
          console.error(`[${new Date().toISOString()}] Phone Number Assignment - Error adding new phone number to database:`, insertError);
          return NextResponse.json({ error: `Error adding new phone number to database: ${insertError.message || 'Unknown error'}` }, { status: 500 });
        }
      }
      
      twimlAppSid = twilioResult.sid;
      twimlAppDetails = twilioResult;
      incomingPhoneNumbers = twilioResult.incomingPhoneNumbers;
      
      console.log(`[${new Date().toISOString()}] Phone Number Assignment - Successfully created and configured Twilio TwiML app with SID: ${twimlAppSid}`);
      console.log(`[${new Date().toISOString()}] Phone Number Assignment - TwiML app details: ${JSON.stringify({
        sid: twilioResult.sid,
        friendlyName: twilioResult.friendlyName,
        smsUrl: twilioResult.smsUrl,
      })}`);
      
      // Verify the TwiML app was correctly assigned to the phone number
      if (twimlAppSid) {
        const phoneVerification = await verifyTwilioPhoneConfig(phoneNumberToAssign, twimlAppSid);
        if (!phoneVerification.success) {
          throw new Error(`TwiML app created but not correctly assigned to phone number: ${phoneVerification.error || 'Unknown error'}`);
        }
      } else {
        throw new Error('TwiML app was not created successfully (no app SID available)');
      }
      
      // Removed Twilio sessions table insertion
    } catch (smsError: any) {
      console.error(`[${new Date().toISOString()}] Phone Number Assignment - SMS provider error:`, smsError);
      return NextResponse.json(
        { error: `Failed to configure SMS provider: ${smsError.message}` }, 
        { status: 500 }
      );
    }
    
    // 2. Update phone number as assigned
    const { error: updatePhoneError } = await supabase
      .from('phone_numbers')
      .update({ 
        is_assigned: true,
      })
      .eq('number', phoneNumberToAssign);
    
    if (updatePhoneError) {
      console.error(`[${new Date().toISOString()}] Phone Number Assignment - Update phone error:`, updatePhoneError);
      
      // Clean up the TwiML app if it was created
      if (twimlAppSid) {
        try {
          await cleanupTwilioTwiMLApp(phoneNumberToAssign, twimlAppSid);
        } catch (cleanupError) {
          console.error("Failed to clean up TwiML app:", cleanupError);
        }
      }
      
      return NextResponse.json(
        { error: 'Failed to assign phone number' }, 
        { status: 500 }
      );
    }
    
    // 3. Update assistant with phone number
    const { error: updateAssistantError } = await supabase
      .from('assistants')
      .update({ assigned_phone_number: phoneNumberToAssign })
      .eq('id', assistantId);
    
    if (updateAssistantError) {
      console.error(`[${new Date().toISOString()}] Phone Number Assignment - Update No-Show error:`, updateAssistantError);
      
      // Revert phone number assignment
      try {
        await supabase
          .from('phone_numbers')
          .update({ 
            is_assigned: false,
            twilio_app_sid: null
          })
          .eq('number', phoneNumberToAssign);
      } catch (revertError) {
        console.error("Failed to revert phone number assignment:", revertError);
      }
      
      // Clean up the TwiML app if it was created
      if (twimlAppSid) {
        try {
          await cleanupTwilioTwiMLApp(phoneNumberToAssign, twimlAppSid);
        } catch (cleanupError) {
          console.error("Failed to clean up TwiML app:", cleanupError);
        }
      }
      
      return NextResponse.json(
        { error: 'Failed to update No-Show record' }, 
        { status: 500 }
      );
    }
    
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    console.log(`[${endTime.toISOString()}] Phone Number Assignment - END - Duration: ${duration}ms`);
    
    return NextResponse.json({
      success: true,
      message: 'Phone number assigned successfully',
      data: {
        phoneNumber: phoneNumberToAssign,
        assistantId,
        twimlAppSid,
        twilioDetails: twimlAppDetails ? {
          twimlApp: {
            sid: twimlAppDetails.sid || 'unavailable',
            name: twimlAppDetails.friendlyName || 'SMS Handler App',
            smsUrl: twimlAppDetails.smsUrl || webhookUrl, // Fallback to the original webhookUrl
            voiceUrl: twimlAppDetails.voiceUrl || null,
            dateCreated: twimlAppDetails.dateCreated || new Date().toISOString()
          },
          phoneNumber: {
            number: phoneNumberToAssign,
            sid: incomingPhoneNumbers?.[0]?.sid || 'unavailable'
          }
        } : null
      }
    });
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Phone Number Assignment - ERROR:`, error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message || 'Unknown error'}` }, 
      { status: 500 }
    );
  }
}

// Function to verify Twilio phone configuration
async function verifyTwilioPhoneConfig(phoneNumber: string, expectedAppSid: string): Promise<{success: boolean, error?: string}> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (!accountSid || !authToken) {
    return { success: false, error: 'Twilio credentials not configured' };
  }
  
  try {
    console.log(`[TWILIO][${new Date().toISOString()}] Verifying phone configuration: ${phoneNumber} -> ${expectedAppSid}`);
    
    // Dynamic import of twilio to avoid server-side issues
    const twilio = await import('twilio');
    const client = twilio.default(accountSid, authToken);
    
    // Format number for Twilio if needed
    const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    
    // Find the Twilio phone number
    console.log(`[TWILIO][${new Date().toISOString()}] Looking up phone number for verification: ${formattedNumber}`);
    const incomingPhoneNumbers = await client.incomingPhoneNumbers.list({
      phoneNumber: formattedNumber
    });
    
    if (!incomingPhoneNumbers || incomingPhoneNumbers.length === 0) {
      console.log(`[TWILIO][${new Date().toISOString()}] No phone number found for verification`);
      return { success: false, error: `No Twilio number found matching ${phoneNumber}` };
    }
    
    // Get the phone details to verify application SID
    const phoneDetails = incomingPhoneNumbers[0];
    console.log(`[TWILIO][${new Date().toISOString()}] Phone verification details:`, {
      sid: phoneDetails.sid,
      phoneNumber: phoneDetails.phoneNumber,
      currentAppSid: phoneDetails.smsApplicationSid || 'none',
      expectedAppSid
    });
    
    // Check if the app SID matches what we expect
    if (phoneDetails.smsApplicationSid !== expectedAppSid) {
      console.log(`[TWILIO][${new Date().toISOString()}] Phone number has incorrect TwiML app SID`);
      console.log(`[TWILIO][${new Date().toISOString()}] Expected: ${expectedAppSid}, Found: ${phoneDetails.smsApplicationSid || 'none'}`);
      return { 
        success: false, 
        error: `Phone number has incorrect TwiML app SID. Expected: ${expectedAppSid}, Found: ${phoneDetails.smsApplicationSid || 'none'}` 
      };
    }
    
    console.log(`[TWILIO][${new Date().toISOString()}] Phone configuration verified successfully`);
    return { success: true };
  } catch (error: any) {
    console.error(`[TWILIO][${new Date().toISOString()}] Error verifying Twilio phone configuration:`, error);
    return { success: false, error: error.message };
  }
}

// Function to create and configure Twilio TwiML app
async function createAndConfigureTwilioTwiMLApp(phoneNumber: string, webhookUrl: string, audioUrl?: string): Promise<any> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured');
  }
  
  try {
    logTwilio('Assignment', `Creating TwiML app for phone number: ${phoneNumber}`);
    logTwilio('Assignment', `Using webhook URL: ${webhookUrl}`);
    logTwilio('Assignment', `Using audio URL: ${audioUrl || 'Not provided'}`);
    
    // Dynamic import of twilio to avoid server-side issues
    const twilio = await import('twilio');
    const client = twilio.default(accountSid, authToken);
    
    // Format number for Twilio if needed
    const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    logTwilio('Assignment', `Formatted phone number: ${formattedNumber}`);
    
    // Extract country code to use if we need to purchase a number
    let countryCode = 'US'; // Default to US
    if (formattedNumber.startsWith('+1')) countryCode = 'US';
    else if (formattedNumber.startsWith('+44')) countryCode = 'GB';
    else if (formattedNumber.startsWith('+61')) countryCode = 'AU';
    else if (formattedNumber.startsWith('+49')) countryCode = 'DE';
    else if (formattedNumber.startsWith('+33')) countryCode = 'FR';
    else if (formattedNumber.startsWith('+34')) countryCode = 'ES';
    else if (formattedNumber.startsWith('+39')) countryCode = 'IT';
    else if (formattedNumber.startsWith('+81')) countryCode = 'JP';
    else if (formattedNumber.startsWith('+')) {
      // Try to extract country code from the number
      const countryCodePart = formattedNumber.substring(1, 3);
      countryCode = countryCodePart;
    }
    
    logTwilio('Assignment', `Derived country code: ${countryCode}`);
    
    // Find the Twilio phone number
    logTwilio('Assignment', `Looking up phone number in Twilio account...`);
    let incomingPhoneNumbers = await client.incomingPhoneNumbers.list({
      phoneNumber: formattedNumber
    });
    
    logTwilio('Assignment', `Found ${incomingPhoneNumbers.length} matching phone number(s)`);
    
    // If phone number not found, try to purchase it or find another available number
    let incomingPhoneNumberSid: string;
    let actualPhoneNumber = formattedNumber;
    
    if (!incomingPhoneNumbers || incomingPhoneNumbers.length === 0) {
      logTwilioError('Assignment', `No phone number found matching ${formattedNumber}`);
      logTwilio('Assignment', `Will attempt to purchase a number in ${countryCode}`);
      
      try {
        // Try to purchase the specific number first
        logTwilio('Assignment', `Attempting to purchase specific number: ${formattedNumber}`);
        
        try {
          const purchasedNumber = await client.incomingPhoneNumbers.create({
            phoneNumber: formattedNumber
          });
          
          logTwilio('Assignment', `Successfully purchased number: ${purchasedNumber.phoneNumber}`);
          incomingPhoneNumberSid = purchasedNumber.sid;
          actualPhoneNumber = purchasedNumber.phoneNumber;
          
          // Refresh the list with the new number
          incomingPhoneNumbers = await client.incomingPhoneNumbers.list({
            phoneNumber: actualPhoneNumber
          });
          
          if (incomingPhoneNumbers.length === 0) {
            throw new Error(`Successfully purchased ${formattedNumber}, but could not find it in account afterward`);
          }
        } catch (purchaseError: any) {
          // If we can't purchase the specific number, try to find any available number in that country
          logTwilioError('Assignment', `Error purchasing specific number: ${purchaseError.message}`);
          logTwilio('Assignment', `Will try to find an available one in the same country`);
          
          // Get available numbers in that country - ensure we don't include any undefined params
          const searchParams = { limit: 1 };
          const availableNumbers = await client.availablePhoneNumbers(countryCode)
            .local.list(searchParams);
          
          if (!availableNumbers || availableNumbers.length === 0) {
            throw new Error(`No available numbers in ${countryCode}`);
          }
          
          const numberToPurchase = availableNumbers[0].phoneNumber;
          logTwilio('Assignment', `Found available number to purchase: ${numberToPurchase}`);
          
          const purchasedNumber = await client.incomingPhoneNumbers.create({
            phoneNumber: numberToPurchase
          });
          
          logTwilio('Assignment', `Purchased alternative number: ${purchasedNumber.phoneNumber}`);
          
          // We'll use this purchased number going forward since it's different from what was requested
          // This could create a mismatch with what's in our database, so we'll update the returned value
          incomingPhoneNumberSid = purchasedNumber.sid;
          actualPhoneNumber = purchasedNumber.phoneNumber;
          
          // Refresh the list with the new number
          incomingPhoneNumbers = await client.incomingPhoneNumbers.list({
            phoneNumber: actualPhoneNumber
          });
          
          if (incomingPhoneNumbers.length === 0) {
            throw new Error(`Successfully purchased ${actualPhoneNumber}, but could not find it in account afterward`);
          }
        }
      } catch (error: any) {
        logTwilioError('Assignment', `Failed to purchase phone number: ${error.message}`);
        throw new Error(`Could not find or purchase phone number ${formattedNumber}: ${error.message}`);
      }
    } else {
      incomingPhoneNumberSid = incomingPhoneNumbers[0].sid;
    }
    
    // Log phone number details
    logTwilio('Assignment', `Phone number details:`, {
      sid: incomingPhoneNumbers[0].sid,
      phoneNumber: incomingPhoneNumbers[0].phoneNumber,
      friendlyName: incomingPhoneNumbers[0].friendlyName,
      smsUrl: incomingPhoneNumbers[0].smsUrl,
      smsMethod: incomingPhoneNumbers[0].smsMethod,
      smsApplicationSid: incomingPhoneNumbers[0].smsApplicationSid || 'none'
    });
    
    // Create Application for SMS and Voice handling
    const friendlyName = `Communication Handler for ${actualPhoneNumber} (${new Date().toISOString()})`;
    logTwilio('Assignment', `Creating new TwiML app: ${friendlyName}`);
    
    // Create URL objects to manipulate the URLs
    const webhookUrlObj = new URL(webhookUrl);
    const assistantId = webhookUrlObj.searchParams.get('assistantId');
    
    if (!assistantId) {
      logTwilioError('Assignment', `Warning: webhook URL does not contain No-Show parameter`);
    }
    
    // Create a voice transcription URL instead of using the webhook route
    const voiceTranscriptionUrl = new URL('/api/twilio/voice-transcription', webhookUrlObj.origin);
    
    // Copy assistantId and any other needed parameters to the voice URL
    if (assistantId) {
      voiceTranscriptionUrl.searchParams.set('assistantId', assistantId);
    }
    
    // Add token if present in the original webhook URL
    const token = webhookUrlObj.searchParams.get('token');
    if (token) {
      voiceTranscriptionUrl.searchParams.set('token', token);
    }
    
    logTwilio('Assignment', `Using SMS webhook URL: ${webhookUrl}`);
    logTwilio('Assignment', `Using Voice transcription URL: ${voiceTranscriptionUrl.toString()}`);
    
    // Create app with separate URLs for SMS and Voice
    logTwilio('Assignment', `TwiML app creation params:`, {
      friendlyName: friendlyName,
      smsUrl: webhookUrl,
      smsMethod: 'POST',
      voiceUrl: voiceTranscriptionUrl.toString(),
      voiceMethod: 'POST'
    });
    
    const newTwiMLApp = await client.applications.create({
      friendlyName: friendlyName,
      smsUrl: webhookUrl,
      smsMethod: 'POST',
      voiceUrl: voiceTranscriptionUrl.toString(),
      voiceMethod: 'POST'
    });
    
    if (!newTwiMLApp || !newTwiMLApp.sid) {
      logTwilioError('Assignment', `Failed to create TwiML app, no SID returned`);
      throw new Error('Failed to create TwiML app: No SID returned from Twilio');
    }
    
    logTwilio('Assignment', `Created TwiML app with SID: ${newTwiMLApp.sid}`);
    logTwilio('Assignment', `TwiML app details:`, {
      sid: newTwiMLApp.sid,
      friendlyName: newTwiMLApp.friendlyName,
      dateCreated: newTwiMLApp.dateCreated,
      smsUrl: newTwiMLApp.smsUrl,
      smsMethod: newTwiMLApp.smsMethod,
      voiceUrl: newTwiMLApp.voiceUrl,
      voiceMethod: newTwiMLApp.voiceMethod
    });
    
    // Assign the TwiML app to the phone number for both voice and SMS
    logTwilio('Assignment', `Updating phone number ${formattedNumber} with TwiML app SID: ${newTwiMLApp.sid}`);
    
    const updateParams: {
      smsApplicationSid: string,
      voiceApplicationSid: string,
      voiceReceiveMode: 'voice' | 'fax' | undefined
    } = {
      smsApplicationSid: newTwiMLApp.sid,
      voiceApplicationSid: newTwiMLApp.sid,  // Use the same app for voice calls
      voiceReceiveMode: 'voice' // Enable voice capabilities
    };
    
    logTwilio('Assignment', `Phone number update params:`, updateParams);
    
    const updatedPhoneNumber = await client.incomingPhoneNumbers(incomingPhoneNumberSid)
      .update(updateParams);
    
    if (!updatedPhoneNumber || updatedPhoneNumber.smsApplicationSid !== newTwiMLApp.sid) {
      logTwilioError('Assignment', `Failed to update phone number with TwiML app SID`);
      logTwilio('Assignment', `Updated phone number details:`, {
        sid: updatedPhoneNumber?.sid,
        phoneNumber: updatedPhoneNumber?.phoneNumber,
        smsApplicationSid: updatedPhoneNumber?.smsApplicationSid,
        voiceApplicationSid: updatedPhoneNumber?.voiceApplicationSid
      });
      
      // If the update didn't take, try to clean up
      try {
        logTwilio('Assignment', `Cleaning up TwiML app due to failed update: ${newTwiMLApp.sid}`);
        await client.applications(newTwiMLApp.sid).remove();
      } catch (cleanupError) {
        logTwilioError('Assignment', `Failed to clean up TwiML app after failed phone update:`, cleanupError);
      }
      throw new Error('Failed to assign TwiML app to phone number');
    }
    
    logTwilio('Assignment', `Successfully assigned TwiML app to phone number ${phoneNumber}`);
    logTwilio('Assignment', `Updated phone number details:`, {
      sid: updatedPhoneNumber.sid,
      phoneNumber: updatedPhoneNumber.phoneNumber,
      smsApplicationSid: updatedPhoneNumber.smsApplicationSid,
      voiceApplicationSid: updatedPhoneNumber.voiceApplicationSid,
      smsUrl: updatedPhoneNumber.smsUrl,
      smsMethod: updatedPhoneNumber.smsMethod,
      voiceUrl: updatedPhoneNumber.voiceUrl,
      voiceMethod: updatedPhoneNumber.voiceMethod
    });
    
    // Before returning, fetch the TwiML app again to ensure all fields are populated
    logTwilio('Assignment', `Verifying TwiML app configuration...`);
    const verifiedTwiMLApp = await client.applications(newTwiMLApp.sid).fetch();
    
    logTwilio('Assignment', `Verified TwiML app details:`, {
      sid: verifiedTwiMLApp.sid,
      friendlyName: verifiedTwiMLApp.friendlyName,
      dateCreated: verifiedTwiMLApp.dateCreated,
      smsUrl: verifiedTwiMLApp.smsUrl,
      smsMethod: verifiedTwiMLApp.smsMethod,
      voiceUrl: verifiedTwiMLApp.voiceUrl,
      voiceMethod: verifiedTwiMLApp.voiceMethod
    });
    
    // Add the phone number details to the returned object, including voice URL
    return {
      ...verifiedTwiMLApp,
      phoneDetails: {
        sid: updatedPhoneNumber.sid,
        phoneNumber: updatedPhoneNumber.phoneNumber,
        smsApplicationSid: updatedPhoneNumber.smsApplicationSid,
        voiceApplicationSid: updatedPhoneNumber.voiceApplicationSid,
        voiceUrl: updatedPhoneNumber.voiceUrl || webhookUrl
      },
      incomingPhoneNumbers: [updatedPhoneNumber],
      actualPhoneNumber: actualPhoneNumber, // Add the actual phone number used, which might be different from the requested one
    };
  } catch (error: any) {
    logTwilioError('Assignment', `Error configuring Twilio webhook:`, error);
    if (error.code) {
      logTwilioError('Assignment', `Twilio error code: ${error.code}`);
    }
    if (error.moreInfo) {
      logTwilioError('Assignment', `Twilio error info: ${error.moreInfo}`);
    }
    throw new Error(`Twilio configuration failed: ${error.message}`);
  }
}

// Function to clean up Twilio TwiML app in case of errors
async function cleanupTwilioTwiMLApp(phoneNumber: string, twimlAppSid: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured');
  }
  
  try {
    console.log(`[TWILIO][${new Date().toISOString()}] Starting cleanup for phone number: ${phoneNumber}, TwiML app SID: ${twimlAppSid}`);
    
    // Dynamic import of twilio to avoid server-side issues
    const twilio = await import('twilio');
    const client = twilio.default(accountSid, authToken);
    
    // Format number for Twilio if needed
    const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    
    // Find the Twilio phone number
    console.log(`[TWILIO][${new Date().toISOString()}] Looking up phone number for cleanup: ${formattedNumber}`);
    const incomingPhoneNumbers = await client.incomingPhoneNumbers.list({
      phoneNumber: formattedNumber
    });
    
    if (incomingPhoneNumbers && incomingPhoneNumbers.length > 0) {
      const incomingPhoneNumberSid = incomingPhoneNumbers[0].sid;
      console.log(`[TWILIO][${new Date().toISOString()}] Found phone number for cleanup with SID: ${incomingPhoneNumberSid}`);
      
      // Clear the TwiML app from the phone number
      console.log(`[TWILIO][${new Date().toISOString()}] Clearing TwiML app SID from phone number`);
      const updateResult = await client.incomingPhoneNumbers(incomingPhoneNumberSid)
        .update({
          smsApplicationSid: ''
        });
      
      console.log(`[TWILIO][${new Date().toISOString()}] Cleared TwiML app from phone number ${phoneNumber}`);
      console.log(`[TWILIO][${new Date().toISOString()}] Updated phone details:`, {
        sid: updateResult.sid,
        phoneNumber: updateResult.phoneNumber,
        smsApplicationSid: updateResult.smsApplicationSid || 'cleared'
      });
    } else {
      console.log(`[TWILIO][${new Date().toISOString()}] No phone number found to clean up for: ${formattedNumber}`);
    }
    
    // Delete the TwiML app
    console.log(`[TWILIO][${new Date().toISOString()}] Deleting TwiML app with SID: ${twimlAppSid}`);
    await client.applications(twimlAppSid).remove();
    console.log(`[TWILIO][${new Date().toISOString()}] Successfully deleted TwiML app with SID: ${twimlAppSid}`);
  } catch (error) {
    console.error(`[TWILIO][${new Date().toISOString()}] Error cleaning up Twilio resources:`, error);
    throw error;
  }
}

// Function to update Twilio webhook (for unassignment - kept from original code)
async function updateTwilioWebhook(phoneNumber: string, webhookUrl: string | null) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured');
  }
  
  try {
    // Dynamic import of twilio to avoid server-side issues
    const twilio = await import('twilio');
    const client = twilio.default(accountSid, authToken);
    
    // Format number for Twilio if needed
    const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    
    // Find the Twilio phone number
    const incomingPhoneNumbers = await client.incomingPhoneNumbers.list({
      phoneNumber: formattedNumber
    });
    
    if (!incomingPhoneNumbers || incomingPhoneNumbers.length === 0) {
      throw new Error(`No Twilio number found matching ${phoneNumber}`);
    }
    
    const incomingPhoneNumberSid = incomingPhoneNumbers[0].sid;

    // Get the TwiML app SID from the phone number
    const incomingPhoneNumber = await client.incomingPhoneNumbers(incomingPhoneNumberSid).fetch();
    const twimlAppSid = incomingPhoneNumber.smsApplicationSid;

    console.log('Found TwiML app SID:', twimlAppSid);

    // Use empty strings instead of null to clear the ApplicationSid fields
    // Twilio's TypeScript types don't allow null, but empty strings work to clear these values
    const updateParams = {
      smsApplicationSid: '',
      voiceApplicationSid: ''
    };

    // Clear the webhook URL for SMS and Voice
    await client.incomingPhoneNumbers(incomingPhoneNumberSid)
      .update(updateParams)
      .catch(err => {
        throw new Error(`Failed to clear webhook URLs: ${err.message}`);
      });
      
    console.log('Cleared application SIDs from phone number');

    // Delete the TwiML app
    if (twimlAppSid) {
      console.log('Attempting to delete TwiML app:', twimlAppSid);
      await client.applications(twimlAppSid).remove()
        .catch(err => {
          throw new Error(`Failed to delete TwiML app: ${err.message}`);
        });
      console.log('TwiML app deleted successfully');
    }
  } catch (error) {
    console.error('Error updating Twilio webhook:', error);
    throw error;
  }
}
function isValidURL(url: string): boolean {
  try {
    // Check if URL is valid using URL constructor
    const parsedUrl = new URL(url);
    // Make sure the protocol is http or https
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch (e) {
    // URL constructor will throw if given an invalid URL
    return false;
  }
}
