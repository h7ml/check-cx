"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100, 200, 500, 1000];

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;

  const start = Math.min((page - 1) * pageSize + 1, total);
  const end   = Math.min(page * pageSize, total);

  // 生成最多 5 个页码按钮，居中于当前页
  const pageNums: number[] = [];
  const half = 2;
  let lo = Math.max(1, page - half);
  let hi = Math.min(totalPages, page + half);
  if (hi - lo < 4) {
    if (lo === 1) hi = Math.min(totalPages, lo + 4);
    else          lo = Math.max(1, hi - 4);
  }
  for (let i = lo; i <= hi; i++) pageNums.push(i);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>每页</span>
        <select
          value={pageSize}
          onChange={(e) => { onPageSizeChange(Number(e.target.value)); onPageChange(1); }}
          className="h-7 rounded-md border border-input bg-background px-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <span>条，第 {start}–{end} / 共 {total.toLocaleString()} 条</span>
      </div>

      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(1)}
          className="flex h-7 items-center justify-center rounded-md border border-input px-2 text-xs text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
        >
          首页
        </button>
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-input text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pageNums.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`flex h-7 w-7 items-center justify-center rounded-md text-xs border transition-colors ${
              p === page
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input text-muted-foreground hover:bg-muted"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-input text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(totalPages)}
          className="flex h-7 items-center justify-center rounded-md border border-input px-2 text-xs text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
        >
          末页
        </button>
      </div>
    </div>
  );
}
