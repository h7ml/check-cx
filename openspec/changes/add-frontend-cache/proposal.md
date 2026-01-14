# Change: 双层缓存 - 前端内存 + Cloudflare CDN

## Why

当前每次轮询都发起网络请求，但数据变化频率远低于轮询频率：

- **轮询间隔**: 60 秒
- **数据变化周期**: ~5 分钟
- **结果**: 大部分请求获取的是重复数据

需要双层缓存减少无效请求：
1. **前端缓存**: 用户本地，响应最快，页面切换/操作时即时返回
2. **CDN 缓存**: 边缘节点，多用户共享，减少回源

## What Changes

- 新增前端内存缓存模块
- API 添加 Cloudflare 缓存头
- 使用 ETag 支持条件请求（304 Not Modified）
- 前端移除 `cache: "no-store"`

## Impact

- Affected specs: 新增 `specs/caching/spec.md`
- Affected code:
  - `lib/core/frontend-cache.ts`（新增）
  - `app/api/dashboard/route.ts`（添加缓存头 + ETag）
  - `components/dashboard-view.tsx`（使用前端缓存）
