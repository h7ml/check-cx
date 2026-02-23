"use client";

import { useEffect, useState } from "react";
import { X, Info, AlertTriangle, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface AdminNotification {
  id: string;
  message: string;
  level: "info" | "warning" | "error";
  scope: string;
}

const LEVEL_STYLES: Record<string, { bar: string; icon: React.ComponentType<{ className?: string }> }> = {
  info:    { bar: "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400",    icon: Info },
  warning: { bar: "bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-400", icon: AlertTriangle },
  error:   { bar: "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400",        icon: AlertCircle },
};

export function AdminNoticeBanner() {
  const [notices, setNotices] = useState<AdminNotification[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/admin/notifications/active")
      .then((r) => r.ok ? r.json() : [])
      .then(setNotices)
      .catch(() => {});
  }, []);

  const visible = notices.filter((n) => !dismissed.has(n.id));
  if (!visible.length) return null;

  return (
    <div className="space-y-1 border-b border-border">
      {visible.map((n) => {
        const { bar, icon: Icon } = LEVEL_STYLES[n.level] ?? LEVEL_STYLES.info;
        return (
          <div key={n.id} className={`flex items-start gap-2 border-b px-4 py-2 text-xs ${bar}`}>
            <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <div className="flex-1 prose prose-xs dark:prose-invert max-w-none [&_p]:m-0 [&_p]:leading-5">
              <ReactMarkdown>{n.message}</ReactMarkdown>
            </div>
            <button
              onClick={() => setDismissed((s) => new Set([...s, n.id]))}
              className="ml-1 shrink-0 rounded p-0.5 opacity-60 hover:opacity-100 transition-opacity"
              aria-label="关闭"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
