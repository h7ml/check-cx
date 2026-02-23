"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [spinning, setSpinning] = useState(false);

  function handleRefresh() {
    setSpinning(true);
    startTransition(() => {
      router.refresh();
    });
    setTimeout(() => setSpinning(false), 800);
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={isPending}
      className="flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
      title="刷新数据"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${spinning ? "animate-spin" : ""}`} />
      刷新
    </button>
  );
}
