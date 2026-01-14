## Context

Check CX 监控面板的数据变化特性：
- **稳定期**: 数据约 5 分钟变化一次
- **变动期**: 变化发生时持续 1-10 分钟
- **轮询间隔**: 60 秒（可配置 15-600 秒）

这意味着大部分轮询请求获取的是相同数据，双层缓存可以显著减少无效请求。

## Goals / Non-Goals

**Goals**:
- 减少重复的网络请求和数据传输
- 页面切换时即时显示缓存数据
- 利用 Cloudflare CDN 减轻服务器负载
- 数据变化时及时更新 UI

**Non-Goals**:
- 不实现离线缓存（Service Worker）
- 不引入状态管理库

## Decisions

### Decision 1: 双层缓存架构

```
用户请求
    ↓
L1: 前端内存缓存 ──HIT──→ 立即返回，后台刷新
    │ MISS/STALE
    ↓
L2: Cloudflare CDN ──HIT──→ 返回缓存
    │ MISS
    ↓
L3: 源服务器 → 返回数据 + ETag
```

**理由**:
- L1 前端缓存：用户本地最快，页面切换无延迟
- L2 CDN 缓存：多用户共享，减少回源
- ETag：数据未变时返回 304，减少传输

### Decision 2: 缓存时间策略

| 缓存层 | 缓存时间 | 理由 |
|--------|----------|------|
| 前端内存 | 2 分钟 | 短于数据变化周期（5分钟），保证较新 |
| CDN | 轮询间隔 | 与后端轮询同步 |
| stale-while-revalidate | 5 分钟 | 匹配数据变化周期 |

**前端缓存策略**:
```typescript
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 分钟

interface CacheEntry {
  data: DashboardData;
  timestamp: number;
  etag?: string;
}

// 缓存有效：直接返回
// 缓存过期但存在：返回旧数据 + 后台刷新（SWR 模式）
// 无缓存：发起请求
```

### Decision 3: ETag 条件请求

**选择**: 基于数据内容的 ETag

**实现**:
```typescript
// 后端生成 ETag
const etag = `"${generateHash(JSON.stringify(data))}"`;
response.headers.set('ETag', etag);

// 前端条件请求
fetch('/api/dashboard', {
  headers: {
    'If-None-Match': cachedEtag
  }
});

// 后端处理
if (request.headers.get('If-None-Match') === currentEtag) {
  return new Response(null, { status: 304 });
}
```

**优势**:
- 数据未变时只传输响应头（几百字节 vs 几十 KB）
- 前端可以继续使用缓存数据

### Decision 4: SWR 模式

**选择**: Stale-While-Revalidate

```typescript
async function fetchWithCache(): Promise<DashboardData> {
  const cached = getCache();

  if (cached && !isExpired(cached)) {
    // 缓存有效，直接返回
    return cached.data;
  }

  if (cached) {
    // 缓存过期但存在，先返回旧数据
    revalidateInBackground(cached.etag);
    return cached.data;
  }

  // 无缓存，等待请求
  return await fetchFresh();
}
```

**理由**:
- 用户立即看到数据（即使是旧的）
- 后台静默刷新，刷新完成后更新 UI
- 体验流畅，无加载闪烁

### Decision 5: Cloudflare 缓存头

```typescript
const pollIntervalSeconds = Math.floor(pollIntervalMs / 1000);
const staleSeconds = 5 * 60; // 5 分钟，匹配数据变化周期

const headers = {
  'Cache-Control': 'public, no-cache',  // 浏览器每次验证
  'CDN-Cache-Control': `max-age=${pollIntervalSeconds}`,
  'Cloudflare-CDN-Cache-Control': `max-age=${pollIntervalSeconds}, stale-while-revalidate=${staleSeconds}`,
  'ETag': etag,
};
```

## Risks / Trade-offs

| 风险 | 评估 | 缓解措施 |
|------|------|----------|
| 用户看到过期数据 | 最多延迟 2 分钟 | SWR 模式后台刷新 |
| 缓存不一致 | 低风险 | ETag 确保数据正确性 |
| 内存占用 | 极小，单条缓存 | 页面卸载自动清理 |

## Migration Plan

1. 新增 `lib/core/frontend-cache.ts`
2. 修改 `app/api/dashboard/route.ts` 添加缓存头 + ETag
3. 修改 `components/dashboard-view.tsx` 使用前端缓存
4. 部署后验证缓存命中率

**回滚**: 移除前端缓存模块，恢复 `cache: "no-store"`

## Open Questions

无。
