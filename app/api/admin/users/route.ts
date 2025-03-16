import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

// Get all users with their profile info
export async function GET(request: Request) {
  const supabase = await createClient();
  
  try {
    // Check if user is authenticated and an admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    // Check admin status
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('auth_user_id', user.id)
      .single();
      
    if (userError || !userData?.is_admin) {
      return NextResponse.json(
        { error: 'Forbidden' }, 
        { status: 403 }
      );
    }
    
    // Get all users with their profile info from auth.users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        created_at,
        auth_user_id,
        is_admin,
        plan_id,
        last_active,
        plans (name, description),
        userusage (assistants_used, interactions_used)
      `)
      .order('created_at', { ascending: false });
    
    if (usersError) throw usersError;
    
    // For each user, fetch their email and other auth data
    const usersWithProfiles = await Promise.all(
      (users || []).map(async (user) => {
        if (!user.auth_user_id) return user;
        
        // Fetch user profile from auth.users
        const { data, error } = await supabase.auth.admin.getUserById(
          user.auth_user_id
        );
        
        if (error || !data.user) return user;
        
        return {
          ...user,
          email: data.user.email,
          last_sign_in: data.user.last_sign_in_at,
          identity_data: data.user.user_metadata
        };
      })
    );
    
    return NextResponse.json({ users: usersWithProfiles });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' }, 
      { status: 500 }
    );
  }
}

// Update a user (for admin operations like enabling/disabling)
export async function PATCH(request: Request) {
  const supabase = await createClient();
  
  try {
    // Check if user is authenticated and an admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    // Check admin status
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('auth_user_id', user.id)
      .single();
      
    if (userError || !userData?.is_admin) {
      return NextResponse.json(
        { error: 'Forbidden' }, 
        { status: 403 }
      );
    }
    
    // Get request body
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' }, 
        { status: 400 }
      );
    }
    
    // Update user in database
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
      
    if (updateError) throw updateError;
    
    return NextResponse.json({ 
      success: true, 
      user: updatedUser 
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' }, 
      { status: 500 }
    );
  }
}

// Delete a user (admin operation)
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const url = new URL(request.url);
  const userId = url.searchParams.get('id');
  
  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' }, 
      { status: 400 }
    );
  }
  
  try {
    // Check if user is authenticated and an admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    // Check admin status
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('auth_user_id', user.id)
      .single();
      
    if (userError || !userData?.is_admin) {
      return NextResponse.json(
        { error: 'Forbidden' }, 
        { status: 403 }
      );
    }
    
    // Get user auth_user_id
    const { data: targetUser, error: targetUserError } = await supabase
      .from('users')
      .select('auth_user_id')
      .eq('id', userId)
      .single();
    
    if (targetUserError || !targetUser) {
      return NextResponse.json(
        { error: 'User not found' }, 
        { status: 404 }
      );
    }
    
    // Delete user's auth record
    if (targetUser.auth_user_id) {
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(
        targetUser.auth_user_id
      );
      
      if (authDeleteError) {
        console.error('Error deleting user auth record:', authDeleteError);
      }
    }
    
    // Delete user from database (should cascade to related records)
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
      
    if (deleteError) throw deleteError;
    
    return NextResponse.json({ 
      success: true, 
      message: 'User deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' }, 
      { status: 500 }
    );
  }
}
