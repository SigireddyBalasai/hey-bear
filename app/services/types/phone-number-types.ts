import { Database } from '@/lib/db.types';
import { ServiceResponse } from '../base/base-service';

/**
 * Type definition for phone number from database
 * Updated to include assistant_id field
 */
export interface PhoneNumber {
  id: string;
  number?: string;
  phone_number?: string;
  created_at: string | null;
  is_assigned: boolean | null;
  country: "US" | "Canada" | null;
  twilio_sid?: string;
  assistant_id?: string | null;
}

/**
 * Response type for operations returning multiple phone numbers
 */
export interface PhoneNumbersResponse extends ServiceResponse {
  phoneNumbers?: PhoneNumber[];
}

/**
 * Response type for operations returning a single phone number
 */
export interface PhoneNumberResponse extends ServiceResponse {
  phoneNumber?: PhoneNumber | null;
}

/**
 * Parameters for assigning a phone number to an assistant
 */
export interface AssignPhoneNumberParams {
  assistantId: string;
  phoneNumberId: number;
}

/**
 * Parameters for unassigning a phone number
 */
export interface UnassignPhoneNumberParams {
  phoneNumberId: number;
}