"use client";

import { useState, useEffect, useCallback } from "react";
import { History, Filter, RefreshCw } from "lucide-react";
import { Pagination } from "@/components/admin/pagination";

interface HistoryRow {
  id: string | number;
  config_id: string;
  status: string;
  latency_ms: number | null;
  ping_latency_ms: number | null;
  checked_at: string;
  message: string | null;
  check_configs: { name: string; type: string } | null;
}

interface ConfigOption {
  id: string;
  name: string;
}

const STATUS_STYLES: Record<string, string> = {
  operational:       "bg-green-500/10 text-green-600",
  degraded:          "bg-yellow-500/10 text-yellow-600",
  failed:            "bg-red-500/10 text-red-600",
  validation_failed: "bg-orange-500/10 text-orange-600",
  error:             "bg-red-500/10 text-red-600",
};

const STATUS_LABELS: Record<string, string> = {
  operational:       "正常",
  degraded:          "降级",
  failed:            "失败",
  validation_failed: "验证失败",
  error:             "错误",
};

export default function HistoryPage() {
  const [rows, setRows]         = useState<HistoryRow[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [configs, setConfigs]   = useState<ConfigOption[]>([]);
  const [configId, setConfigId] = useState("");
  const [status, setStatus]     = useState("");
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    fetch("/api/admin/configs")
      .then((r) => r.ok ? r.json() : [])
      .then((data: { id: string; name: string }[]) => setConfigs(data.map((c) => ({ id: c.id, name: c.name }))))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (configId) params.set("config_id", configId);
    if (status)   params.set("status", status);
    const res = await fetch(`/api/admin/history?${params}`);
    if (res.ok) {
      const json = await res.json();
      setRows(json.data ?? []);
      setTotal(json.total ?? 0);
    }
    setLoading(false);
  }, [page, pageSize, configId, status]);

  useEffect(() => { load(); }, [load]);

  function applyFilter(newConfigId: string, newStatus: string) {
    setConfigId(newConfigId);
    setStatus(newStatus);
    setPage(1);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold">检测历史</h1>
          {total > 0 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              共 {total.toLocaleString()} 条
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={load} disabled={loading} className="flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            刷新
          </button>
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />          <select
            value={configId}
            onChange={(e) => applyFilter(e.target.value, status)}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">全部配置</option>
            {configs.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => applyFilter(configId, e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">全部状态</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">配置</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">状态</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">首 Token</th>
                <th className="hidden sm:table-cell px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Ping</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">检测时间</th>
                <th className="hidden md:table-cell px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">消息</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">加载中…</td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <History className="mx-auto h-10 w-10 text-muted-foreground/30" />
                    <p className="mt-3 text-sm font-medium">暂无检测记录</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {configId || status ? "当前筛选条件下没有匹配的记录" : "轮询器运行后将自动写入检测数据"}
                    </p>
                  </td>
                </tr>
              )}
              {!loading && rows.map((row) => (
                <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2 font-medium text-xs max-w-[140px] truncate">
                    {row.check_configs?.name ?? row.config_id.slice(0, 8)}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[row.status] ?? "bg-muted text-muted-foreground"}`}>
                      {STATUS_LABELS[row.status] ?? row.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs tabular-nums">
                    {row.latency_ms != null ? `${row.latency_ms} ms` : "—"}
                  </td>
                  <td className="hidden sm:table-cell px-3 py-2 text-xs tabular-nums text-muted-foreground">
                    {row.ping_latency_ms != null ? `${Math.round(row.ping_latency_ms)} ms` : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(row.checked_at).toLocaleString("zh-CN")}
                  </td>
                  <td className="hidden md:table-cell px-3 py-2 text-xs text-muted-foreground max-w-[240px]">
                    <p className="truncate" title={row.message ?? ""}>{row.message ?? "—"}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
      />
    </div>
  );
}
