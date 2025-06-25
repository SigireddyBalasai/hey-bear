import { NextResponse } from "next/server";
import twilio from "twilio";
import { createClient } from "@/utils/supabase/server";
import { isAdminRpc } from "@/app/utils/isAdminRpc";

export async function POST(req: Request) {
  try {
    // Check authentication and admin permissions
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = isAdminRpc();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 },
      );
    }
    // Use Supabase Auth user object for user identity
    const userId = user.id;

    // Get the phone number to import
    const { phoneNumber } = await req.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 },
      );
    }

    // Check if the number already exists
    const { data: existingNumber } = await supabase
      .from("phone_numbers")
      .select("id")
      .eq("number", phoneNumber)
      .single();

    if (existingNumber) {
      return NextResponse.json(
        { error: "This phone number already exists in the system" },
        { status: 400 },
      );
    }

    // Add the phone number to the database
    const { data: number, error: insertError } = await supabase
      .from("phone_numbers")
      .insert({
        phone_number: phoneNumber,
        is_assigned: false,
        created_at: new Date().toISOString(),
      })
      .select("id, phone_number, is_assigned, created_at") // explicitly select id and other columns
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to add phone number to database" },
        { status: 500 },
      );
    }

    // Add to phone number pool
    await supabase.from("phone_numbers").insert({
      phone_number: number.phone_number,
      added_by_admin: user.id, // Use the directly retrieved user
      added_at: new Date().toISOString(),
    });

    // Log the import as an interaction for auditing

    return NextResponse.json({
      success: true,
      message: "Phone number imported successfully",
      number: number,
    });
  } catch (error: any) {
    console.error("Error importing phone number:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to import phone number",
      },
      { status: 500 },
    );
  }
}
