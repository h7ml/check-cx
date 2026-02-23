import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAuth() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims ?? null;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const { message, level, scope, start_time, end_time } = body;
  if (start_time && end_time && new Date(start_time) > new Date(end_time))
    return NextResponse.json({ error: "结束时间不能早于开始时间" }, { status: 400 });
  const admin = createAdminClient();
  const { error } = await admin.from("system_notifications").update({ message, level: level || "info", scope: scope || "public", start_time: start_time || null, end_time: end_time || null }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const admin = createAdminClient();
  const { error } = await admin.from("system_notifications").update(body).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin.from("system_notifications").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
