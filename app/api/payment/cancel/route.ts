import { redirect } from "next/navigation";

export async function GET() {
  console.log("Payment cancel route called");

  // Since Stripe pricing table cancellation doesn't pass assistant data,
  // simply redirect back to Concierge with cancellation status
  return redirect("/Concierge?payment=cancelled");
}
