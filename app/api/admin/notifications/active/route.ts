import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date().toISOString();
  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from("system_notifications")
    .select("id, message, level, scope")
    .eq("is_active", true)
    .or("scope.eq.admin,scope.eq.both")
    .or(`start_time.is.null,start_time.lte.${now}`)
    .or(`end_time.is.null,end_time.gte.${now}`)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json([]);
  return NextResponse.json(rows ?? []);
}
