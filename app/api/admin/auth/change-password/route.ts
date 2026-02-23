import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // 验证当前登录态
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPassword, newPassword } = await request.json();
  if (!currentPassword || !newPassword)
    return NextResponse.json({ error: "参数缺失" }, { status: 400 });
  if (newPassword.length < 8)
    return NextResponse.json({ error: "新密码至少 8 位" }, { status: 400 });

  // 用当前密码重新验证身份
  const { error: verifyErr } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyErr)
    return NextResponse.json({ error: "当前密码不正确" }, { status: 400 });

  // 更新密码
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
