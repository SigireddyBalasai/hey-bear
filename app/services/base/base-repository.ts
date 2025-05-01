import { SupabaseClient } from './base-service';
import { PostgrestSingleResponse } from '@supabase/supabase-js';

/**
 * Base repository class with common database operations
 * Using a more flexible approach with dynamic table names while maintaining type safety
 */
export abstract class BaseRepository<T> {
  constructor(protected readonly supabase: SupabaseClient, protected readonly tableName: string) {}

  /**
   * Find all records in the table
   */
  async findAll(orderBy?: string, ascending: boolean = true): Promise<{data?: T[], error?: any}> {
    // Use type assertion to allow dynamic table names
    const query = this.supabase
      .from(this.tableName as any)
      .select('*');
    
    if (orderBy) {
      query.order(orderBy, { ascending });
    }
    
    // Handle Supabase response explicitly
    const response = await query;
    return {
      data: response.data as T[] | undefined,
      error: response.error
    };
  }

  /**
   * Find a record by ID
   */
  async findById(id: string | number): Promise<{data?: T, error?: any}> {
    const response = await this.supabase
      .from(this.tableName as any)
      .select('*')
      .eq('id', String(id))
      .single();
    
    return {
      data: response.data as T | undefined,
      error: response.error
    };
  }

  /**
   * Find records by a field value
   */
  async findBy(field: string, value: any): Promise<{data?: T[], error?: any}> {
    const response = await this.supabase
      .from(this.tableName as any)
      .select('*')
      .eq(field, value);
    
    return {
      data: response.data as T[] | undefined,
      error: response.error
    };
  }

  /**
   * Create a new record
   */
  async create(data: Partial<T>): Promise<{data?: T, error?: any}> {
    const response = await this.supabase
      .from(this.tableName as any)
      .insert(data)
      .select('*')
      .single();
    
    return {
      data: response.data as T | undefined,
      error: response.error
    };
  }

  /**
   * Update a record
   */
  async update(id: string | number, data: Partial<T>): Promise<{data?: T, error?: any}> {
    const response = await this.supabase
      .from(this.tableName as any)
      .update(data)
      .eq('id', String(id))
      .select('*')
      .single();
    
    return {
      data: response.data as T | undefined,
      error: response.error
    };
  }

  /**
   * Delete a record
   */
  async delete(id: string | number): Promise<{error?: any}> {
    const response = await this.supabase
      .from(this.tableName as any)
      .delete()
      .eq('id', String(id));
    
    return {
      error: response.error
    };
  }
}