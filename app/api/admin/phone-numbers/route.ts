import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { checkIsAdmin } from "@/utils/admin";

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Verify admin user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin status using the utility function
    const { isAdmin, error: adminError } = await checkIsAdmin(supabase, user.id);
    
    if (adminError || !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get phone numbers
    const { data: numbers, error: numbersError } = await supabase
      .from("phone_numbers")
      .select("*")
      .order("assigned_at", { ascending: false });

    if (numbersError) {
      console.error("DB error fetching phone numbers:", numbersError);
      return NextResponse.json(
        { error: "Failed to fetch phone numbers" },
        { status: 500 }
      );
    }

    return NextResponse.json({ numbers });
  } catch (error) {
    console.error("Unexpected error in phone numbers API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { phoneNumber, twilioSid } = await request.json();
    
    if (!phoneNumber && !twilioSid) {
      return NextResponse.json(
        { error: "Phone number or Twilio SID is required" },
        { status: 400 }
      );
    }

    // Verify admin user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin status using the utility function
    const { isAdmin, error: adminError } = await checkIsAdmin(supabase, user.id);
    
    if (adminError || !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete from database first
    const query = supabase.from("phone_numbers").delete();
    
    if (phoneNumber) {
      query.eq("phone_number", phoneNumber);
    } else if (twilioSid) {
      query.eq("twilio_sid", twilioSid);
    }
    
    const { error: deleteError } = await query;

    if (deleteError) {
      console.error("Error deleting phone number:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete phone number from database" },
        { status: 500 }
      );
    }

    // Call Twilio API to release the number
    // Note: This assumes you have a separate API endpoint that handles Twilio operations
    const twilioResponse = await fetch("/api/twilio/release", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        phoneNumber, 
        twilioSid,
        adminId: user.id 
      }),
    });

    const twilioResult = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.warn(
        "Phone number deleted from database but Twilio release failed:",
        twilioResult.error
      );
      return NextResponse.json(
        { 
          success: true, 
          warning: "Phone number removed from database but may not have been released from Twilio"
        }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: "Phone number released successfully"
    });
  } catch (error) {
    console.error("Unexpected error releasing phone number:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
