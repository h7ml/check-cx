import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Activity, ArrowLeft, AlertCircle } from "lucide-react";

export async function signIn(formData: FormData) {
  "use server";
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/admin/login?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/admin");
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* 左侧装饰面板（桌面端） */}
      <div className="relative hidden w-full flex-col items-center justify-center overflow-hidden border-r border-border bg-muted/30 lg:flex lg:w-1/2 xl:w-[60%]">
        {/* 网格背景 */}
        <div
          className="absolute inset-0 z-0 opacity-[0.06]"
          style={{
            backgroundImage: "linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-tr from-background via-transparent to-transparent" />

        {/* 动态节点 */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div className="absolute top-[18%] left-[28%] h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <div className="absolute top-[38%] left-[12%] h-1.5 w-1.5 rounded-full bg-primary animate-ping [animation-duration:2.5s]" />
          <div className="absolute top-[58%] left-[22%] h-1 w-1 rounded-full bg-primary/50 animate-pulse [animation-delay:1.2s]" />
          <div className="absolute top-[78%] left-[18%] h-1.5 w-1.5 rounded-full bg-primary animate-pulse [animation-delay:0.7s]" />
          <div className="absolute top-[28%] right-[18%] h-1.5 w-1.5 rounded-full bg-primary animate-ping [animation-delay:1.5s] [animation-duration:3s]" />
          <div className="absolute top-[48%] right-[32%] h-1 w-1 rounded-full bg-primary/50 animate-pulse [animation-delay:0.2s]" />
          <div className="absolute top-[68%] right-[12%] h-1.5 w-1.5 rounded-full bg-primary animate-pulse [animation-delay:0.9s]" />
        </div>

        {/* 中央内容 */}
        <div className="relative z-20 flex flex-col items-center max-w-sm px-12 text-center">
          <div className="mb-8 p-5 rounded-[2rem] bg-background border border-border shadow-2xl ring-1 ring-primary/10">
            <Activity className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight mb-3">Check CX</h2>
          <p className="text-muted-foreground text-lg mb-12">
            AI Services Monitoring Dashboard
          </p>

          {/* System Health 装饰卡片 */}
          <div className="w-full rounded-2xl border border-border bg-background/60 backdrop-blur-xl p-5 shadow-sm text-left">
            <div className="flex items-center justify-between mb-5">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">System Health</span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Live</span>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-medium">30d Uptime</span>
                <div className="text-3xl font-mono font-bold leading-none tabular-nums">99.99%</div>
              </div>
              <div className="h-8 w-20 flex items-end gap-[3px]">
                {[40, 65, 55, 80, 70, 90, 100].map((h, i) => (
                  <div key={i} className={`flex-1 rounded-t-sm ${i === 6 ? "bg-primary" : "bg-primary/25"}`} style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧登录表单 */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-background">
        <div className="absolute top-6 left-6 z-30">
          <Link
            href="/"
            className="group flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="p-1.5 rounded-full border border-border group-hover:bg-muted transition-colors">
              <ArrowLeft className="h-3 w-3" />
            </div>
            返回首页
          </Link>
        </div>

        <div className="w-full max-w-[380px] space-y-8">
          <div className="space-y-2">
            <div className="lg:hidden flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 mb-5">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">管理后台</h1>
            <p className="text-sm text-muted-foreground">Check CX · Admin Panel</p>
          </div>

          <form action={signIn} className="space-y-5">
            {error && (
              <div className="p-3.5 rounded-xl border border-destructive/20 bg-destructive/5 text-xs text-destructive flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="h-4 w-4 shrink-0 mt-px" />
                <p className="leading-relaxed">{decodeURIComponent(error)}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium">邮箱</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="admin@example.com"
                  className="w-full h-11 rounded-xl border border-input bg-transparent px-4 text-sm transition-all outline-none placeholder:text-muted-foreground/40 focus:border-primary/60 focus:ring-4 focus:ring-primary/10"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium">密码</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full h-11 rounded-xl border border-input bg-transparent px-4 text-sm transition-all outline-none placeholder:text-muted-foreground/40 focus:border-primary/60 focus:ring-4 focus:ring-primary/10"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
            >
              <span>登录</span>
              <Activity className="h-4 w-4 group-hover:animate-pulse" />
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground/50">
            Check CX · AI Services Monitoring
          </p>
        </div>
      </div>
    </div>
  );
}
