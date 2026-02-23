import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAuth() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims ?? null;
}

export async function GET() {
  if (!(await requireAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createAdminClient();
  const { data, error } = await admin.from("system_notifications").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  if (!(await requireAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { message, level, scope, start_time, end_time } = body;
  if (!message) return NextResponse.json({ error: "message 必填" }, { status: 400 });
  if (start_time && end_time && new Date(start_time) > new Date(end_time))
    return NextResponse.json({ error: "结束时间不能早于开始时间" }, { status: 400 });
  const admin = createAdminClient();
  const { data, error } = await admin.from("system_notifications").insert({ message, level: level || "info", scope: scope || "public", start_time: start_time || null, end_time: end_time || null }).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id }, { status: 201 });
}
