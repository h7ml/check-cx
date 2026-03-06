[根目录](../../CLAUDE.md) > [lib](../) > **core**

# lib/core - 核心业务逻辑模块

## 模块职责

核心业务逻辑层，负责协调整个系统的运行：
- 后台轮询器：自动化健康检查调度
- 数据聚合：Dashboard 和分组数据的统一加载
- 告警引擎：规则评估与通知分发
- 全局状态：轮询器状态与缓存管理
- 官方状态：OpenAI/Anthropic 官方状态轮询

## 入口与启动

### 自动启动入口
- `poller.ts` - 模块加载时自动初始化轮询器，使用递归 setTimeout 实现动态间隔调度
- `official-status-poller.ts` - 由 poller.ts 启动，独立轮询官方状态 API

### 数据加载入口
- `dashboard-data.ts:loadDashboardData()` - Dashboard 数据聚合入口
- `group-data.ts:loadGroupData()` - 分组详情数据加载
- `health-snapshot-service.ts:loadSnapshotForScope()` - 历史快照统一读取

## 对外接口

### 轮询控制
```typescript
// poller.ts
async function tick(): Promise<void>
// 执行一次完整的轮询检查：加载配置 → 执行检查 → 写入历史 → 评估告警
```

### 数据聚合
```typescript
// dashboard-data.ts
export async function loadDashboardData(options?: {
  refreshMode?: RefreshMode;  // "always" | "missing" | "never"
  trendPeriod?: AvailabilityPeriod;  // "7d" | "15d" | "30d"
}): Promise<DashboardData>

export async function loadDashboardDataWithEtag(options?: {
  refreshMode?: RefreshMode;
  trendPeriod?: AvailabilityPeriod;
}): Promise<DashboardLoadResult>  // 包含 ETag 用于 HTTP 缓存
```

### 告警评估
```typescript
// alert-engine.ts
export async function evaluateAlerts(
  configId: string,
  configName: string,
  newStatus: HealthStatus,
  latencyMs: number | null
): Promise<void>
// 根据规则条件判断是否触发告警，支持冷却时间和多通道分发
```

### 全局状态
```typescript
// global-state.ts
export function getPollerTimer(): ReturnType<typeof setInterval> | null
export function setPollerTimer(timer: ReturnType<typeof setInterval>): void
export function getLastPingStartedAt(): number | null
export function setLastPingStartedAt(timestamp: number): void
```

## 关键依赖与配置

### 内部依赖
- `lib/database/config-loader` - 加载 Provider 配置
- `lib/database/history` - 历史记录读写
- `lib/providers` - 执行健康检查
- `lib/alerts/*` - 告警通道实现

### 外部依赖
- `@supabase/supabase-js` - 数据库操作
- `ai` (Vercel AI SDK) - 间接依赖（通过 providers）

### 环境变量
- `CHECK_POLL_INTERVAL_SECONDS` - 轮询间隔（15-600 秒，默认 60）
- `CHECK_NODE_ID` - 节点标识，用于多节点选主（默认 "local"）
- `CHECK_CONCURRENCY` - 并发检查数（默认 5）

## 数据模型

### DashboardData
```typescript
interface DashboardData {
  providerTimelines: ProviderTimeline[];  // 按 Provider 聚合的时间线
  groupInfos: GroupInfoSummary[];  // 分组元信息
  lastUpdated: string | null;  // 最后更新时间
  total: number;  // Provider 总数
  pollIntervalLabel: string;  // 轮询间隔标签（如 "60s"）
  pollIntervalMs: number;  // 轮询间隔毫秒数
  availabilityStats: AvailabilityStatsMap;  // 可用性统计
  trendPeriod: AvailabilityPeriod;  // 趋势周期
  generatedAt: number;  // 生成时间戳
}
```

### ProviderTimeline
```typescript
interface ProviderTimeline {
  id: string;  // config_id
  name: string;
  type: ProviderType;
  endpoint: string;
  model: string;
  groupName: string | null;
  latest: CheckResult;  // 最新检查结果
  history: TimelineItem[];  // 历史时间线（最多 60 条）
}
```

## 测试与质量

### 测试策略
- 当前无自动化测试
- 建议：单元测试轮询逻辑、数据聚合、告警条件判断
- 集成测试：模拟完整轮询周期

### 日志输出
- 轮询开始/结束时间
- 每个配置的检测结果（状态、延迟、消息）
- 历史记录写入结果
- 告警触发与发送状态
- 下次预计执行时间

## 常见问题 (FAQ)

### Q: 轮询器如何避免重复执行？
A: 使用全局标志位 `globalThis.__checkCxPollerRunning` 防止重叠执行，配合 `poller-leadership.ts` 的数据库租约实现多节点选主。

### Q: 如何调整轮询间隔？
A: 设置环境变量 `CHECK_POLL_INTERVAL_SECONDS`（15-600 秒），轮询器使用递归 setTimeout 动态读取配置。

### Q: Dashboard 数据如何缓存？
A: 三层缓存：
1. 后端快照缓存（health-snapshot-service）：基于轮询间隔 TTL
2. Dashboard 数据缓存（dashboard-data）：ETag + 轮询间隔 TTL
3. 前端 SWR 缓存（frontend-cache）：配合 ETag 实现条件请求

### Q: 告警如何避免频繁触发？
A: 规则支持 `cooldown_seconds` 冷却时间，在冷却期内相同规则+通道+配置的组合不会重复发送。

## 相关文件清单

### 核心文件
- `poller.ts` - 后台轮询器主逻辑
- `dashboard-data.ts` - Dashboard 数据聚合
- `group-data.ts` - 分组数据聚合
- `alert-engine.ts` - 告警引擎
- `health-snapshot-service.ts` - 历史快照服务
- `official-status-poller.ts` - 官方状态轮询器

### 配置与状态
- `polling-config.ts` - 轮询配置读取
- `global-state.ts` - 全局状态管理
- `poller-leadership.ts` - 多节点选主
- `status.ts` - 状态元数据（标签、颜色）

### 缓存管理
- `frontend-cache.ts` - 前端缓存工具
- `group-frontend-cache.ts` - 分组缓存工具

### 汇总推送
- `poll-summary.ts` - 轮询结果汇总推送

## 变更记录 (Changelog)

### 2026-03-06
- 初始化模块文档，覆盖核心业务逻辑层的完整接口与数据流
