/** Signs the owner out (step A.2): ends the session at Supabase and clears the cookies. POST only, from the button in the header. */
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url), 303);
}
