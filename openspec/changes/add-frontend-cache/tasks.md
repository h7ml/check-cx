## 1. 前端缓存模块

- [x] 1.1 创建 `lib/core/frontend-cache.ts`
- [x] 1.2 实现 `CacheEntry` 接口（data, timestamp, etag）
- [x] 1.3 实现 `getCache()` / `setCache()` 函数
- [x] 1.4 实现 `isExpired()` 检查（2 分钟 TTL）
- [x] 1.5 实现 `fetchWithCache()` SWR 模式

## 2. API 缓存头 + ETag

- [x] 2.1 修改 `app/api/dashboard/route.ts`
- [x] 2.2 生成 ETag（基于数据哈希，djb2 算法）
- [x] 2.3 处理 `If-None-Match` 条件请求，返回 304
- [x] 2.4 添加 `CDN-Cache-Control` 头
- [x] 2.5 添加 `Cloudflare-CDN-Cache-Control` 头（stale-while-revalidate）

## 3. 前端集成

- [x] 3.1 修改 `dashboard-view.tsx` 使用 `fetchWithCache()`
- [x] 3.2 移除 `cache: "no-store"`
- [x] 3.3 移除 `lockRef` 刷新锁（SWR 模式自带防抖）
- [x] 3.4 处理 304 响应，使用缓存数据
- [x] 3.5 后台刷新完成后更新 UI
- [x] 3.6 初始化时将服务端数据放入前端缓存

## 4. 类型定义

- [x] 4.1 类型定义内联在 `frontend-cache.ts` 中（无需单独文件）

## 5. 验证

- [x] 5.1 TypeScript 编译通过
- [ ] 5.2 验证前端缓存命中（页面切换无延迟）
- [ ] 5.3 验证 304 响应（数据未变时）
- [ ] 5.4 验证 CDN 缓存（`CF-Cache-Status: HIT`）
- [ ] 5.5 验证 SWR 模式（先显示旧数据，后台刷新）
