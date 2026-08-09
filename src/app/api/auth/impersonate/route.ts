import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser }, error } = await supabase.auth.getUser();

    if (error || !authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { impersonateId, clear } = body;

    const response = NextResponse.json({ success: true });

    if (clear) {
      response.cookies.delete("impersonated_user_id");
    } else if (impersonateId) {
      // You may want to add a check here to ensure authUser is Admin/CEO
      response.cookies.set("impersonated_user_id", impersonateId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Impersonation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
