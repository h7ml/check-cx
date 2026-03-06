[根目录](../../CLAUDE.md) > [lib](../) > **database**

# lib/database - 数据库操作层

## 模块职责

封装所有 Supabase 数据库操作，提供类型安全的数据访问接口：
- 配置加载：从数据库读取 Provider 配置
- 历史记录：检查结果的读写与清理
- 可用性统计：7/15/30 天可用性数据聚合
- 分组信息：分组元数据管理
- 通知管理：系统通知的 CRUD
- 轮询器租约：多节点选主的数据库锁

## 入口与启动

### 配置加载
```typescript
// config-loader.ts
export async function loadProviderConfigsFromDB(options?: {
  forceRefresh?: boolean;
}): Promise<ProviderConfig[]>
// 从 check_configs 表读取已启用的配置，带 TTL 缓存
```

### 历史记录
```typescript
// history.ts
export const historySnapshotStore: SnapshotStore
// 统一的历史记录存储接口

historySnapshotStore.fetch(options?: HistoryQueryOptions): Promise<HistorySnapshot>
historySnapshotStore.append(results: CheckResult[]): Promise<void>
historySnapshotStore.prune(retentionDays?: number): Promise<void>
```

## 对外接口

### 配置管理
```typescript
// config-loader.ts
export async function loadProviderConfigsFromDB(options?: {
  forceRefresh?: boolean;
}): Promise<ProviderConfig[]>

export function getConfigCacheMetrics(): ConfigCacheMetrics
export function resetConfigCacheMetrics(): void
```

### 历史记录
```typescript
// history.ts
export async function loadHistory(
  options?: HistoryQueryOptions
): Promise<HistorySnapshot>

export async function appendHistory(
  results: CheckResult[]
): Promise<HistorySnapshot>

interface HistoryQueryOptions {
  allowedIds?: Iterable<string> | null;  // 过滤指定配置 ID
  limitPerConfig?: number;  // 每个配置最多返回条数（默认 60）
}
```

### 可用性统计
```typescript
// availability.ts
export async function getAvailabilityStats(
  configIds: string[]
): Promise<AvailabilityStatsMap>

// 返回结构
type AvailabilityStatsMap = Record<string, {
  "7d": number;   // 7 天可用性百分比
  "15d": number;  // 15 天可用性百分比
  "30d": number;  // 30 天可用性百分比
}>
```

### 分组信息
```typescript
// group-info.ts
export async function loadGroupInfos(): Promise<GroupInfoRow[]>

interface GroupInfoRow {
  id: string;
  group_name: string;
  display_name: string | null;
  description: string | null;
  website_url: string | null;
  icon_url: string | null;
  tags: string;  // 逗号分隔的标签列表
  created_at: string;
  updated_at: string;
}
```

### 通知管理
```typescript
// notifications.ts
export async function getActiveNotifications(
  scope?: "public" | "admin" | "both"
): Promise<SystemNotificationRow[]>
```

### 轮询器租约
```typescript
// poller-lease.ts
export async function acquirePollerLease(
  nodeId: string,
  leaseDurationMs: number
): Promise<boolean>

export async function renewPollerLease(
  nodeId: string,
  leaseDurationMs: number
): Promise<boolean>
```

## 关键依赖与配置

### 内部依赖
- `lib/supabase/admin` - 管理员客户端（绕过 RLS）
- `lib/types/database` - 数据库表类型定义
- `lib/utils/error-handler` - 统一错误日志

### 外部依赖
- `@supabase/supabase-js` - Supabase 客户端 SDK

### 环境变量
- `SUPABASE_URL` - Supabase 项目 URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service Role Key（管理员权限）
- `DB_SCHEMA` - 数据库 Schema（默认 "public"）
- `HISTORY_RETENTION_DAYS` - 历史记录保留天数（7-365 天，默认 30）

## 数据模型

### ProviderConfig
```typescript
interface ProviderConfig {
  id: string;
  name: string;
  type: ProviderType;
  endpoint: string;
  model: string;
  apiKey: string;
  is_maintenance: boolean;
  requestHeaders: Record<string, string> | null;
  metadata: Record<string, unknown> | null;
  groupName: string | null;
}
```

### HistorySnapshot
```typescript
type HistorySnapshot = Record<string, CheckResult[]>
// Key: config_id, Value: 按时间倒序的检查结果列表（最多 60 条）
```

### CheckConfigRow
```typescript
interface CheckConfigRow {
  id: string;
  name: string;
  type: string;
  model: string;
  endpoint: string;
  api_key: string;
  enabled: boolean;
  is_maintenance: boolean;
  request_header: Record<string, string> | null;
  metadata: Record<string, unknown> | null;
  group_name: string | null;
  created_at: string;
  updated_at: string;
}
```

### CheckHistoryRow
```typescript
interface CheckHistoryRow {
  id: number;
  config_id: string;
  status: string;
  latency_ms: number | null;
  ping_latency_ms: number | null;
  checked_at: string;
  message: string | null;
  created_at: string;
}
```

## 测试与质量

### 测试策略
- 当前无自动化测试
- 建议：
  - 单元测试：配置缓存逻辑、历史记录分页
  - 集成测试：使用测试数据库验证 RPC 函数
  - 性能测试：大量历史记录的查询与清理性能

### 错误处理
- 数据库操作失败时记录日志并返回空数据
- RPC 函数缺失时自动降级到 fallback 实现
- 配置加载失败时返回空数组，不影响应用启动

## 常见问题 (FAQ)

### Q: 配置缓存的 TTL 是多少？
A: 与轮询间隔一致（`CHECK_POLL_INTERVAL_SECONDS`），默认 60 秒。可通过 `forceRefresh: true` 强制刷新。

### Q: 历史记录如何清理？
A: 自动调用 `prune_check_history` RPC，保留策略：
- 每个配置最多保留 60 条记录
- 超过 `HISTORY_RETENTION_DAYS` 的记录自动删除（默认 30 天）

### Q: 如何处理 RPC 函数缺失？
A: 使用 fallback 机制：
- `get_recent_check_history` 缺失时，使用 JOIN 查询 + 客户端分页
- `prune_check_history` 缺失时，使用 DELETE + WHERE 条件

### Q: 多节点部署如何避免重复轮询？
A: 使用 `check_poller_leases` 表实现数据库锁：
- 每个节点尝试获取租约（`acquirePollerLease`）
- 租约持有者定期续约（`renewPollerLease`）
- 租约过期后其他节点可接管

### Q: 可用性统计如何计算？
A: 使用 `availability_stats` 视图：
- 统计 7/15/30 天内 `operational` 状态的记录占比
- 排除 `maintenance` 状态的记录
- 返回百分比（0-100）

## 相关文件清单

### 核心文件
- `config-loader.ts` - 配置加载与缓存
- `history.ts` - 历史记录管理（SnapshotStore 实现）
- `availability.ts` - 可用性统计查询
- `group-info.ts` - 分组信息管理
- `notifications.ts` - 系统通知查询
- `poller-lease.ts` - 轮询器租约管理

### 数据库表
- `check_configs` - Provider 配置表
- `check_history` - 历史记录表
- `group_info` - 分组信息表
- `system_notifications` - 系统通知表
- `check_poller_leases` - 轮询器租约表（单行表）

### RPC 函数
- `get_recent_check_history(limit_per_config, target_config_ids)` - 获取最近历史
- `prune_check_history(retention_days)` - 清理历史记录

### 视图
- `availability_stats` - 可用性统计视图

## 变更记录 (Changelog)

### 2026-03-06
- 初始化模块文档，覆盖所有数据库操作接口与数据模型
