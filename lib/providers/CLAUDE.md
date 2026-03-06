[根目录](../../CLAUDE.md) > [lib](../) > **providers**

# lib/providers - AI Provider 健康检查适配器

## 模块职责

实现多种 AI Provider 的健康检查逻辑，统一使用 Vercel AI SDK 进行流式检查：
- 支持 OpenAI（Chat Completions + Responses API）
- 支持 Anthropic（Claude 系列）
- 支持 Gemini（原生 API + OpenAI 兼容模式）
- 支持 Grok（OpenAI 兼容模式）
- 数学挑战验证：防止假站点用固定回复绕过检测
- 端点 Ping 延迟测量

## 入口与启动

### 统一入口
```typescript
// index.ts
export async function runProviderChecks(
  configs: ProviderConfig[]
): Promise<CheckResult[]>
// 批量执行健康检查，使用 p-limit 控制并发数
```

### 核心检查函数
```typescript
// ai-sdk-check.ts
export async function checkWithAiSdk(
  config: ProviderConfig
): Promise<CheckResult>
// 统一的 AI SDK 健康检查实现，支持所有 Provider 类型
```

## 对外接口

### 批量检查
```typescript
// index.ts
export async function runProviderChecks(
  configs: ProviderConfig[]
): Promise<CheckResult[]>
// 返回按名称排序的检查结果列表
```

### 单个检查
```typescript
// ai-sdk-check.ts
export async function checkWithAiSdk(
  config: ProviderConfig
): Promise<CheckResult>

// 返回结构
interface CheckResult {
  id: string;  // config_id
  name: string;
  type: ProviderType;
  endpoint: string;
  model: string;
  status: HealthStatus;  // "operational" | "degraded" | "failed" | "validation_failed" | "error"
  latencyMs: number | null;  // 首 token 延迟
  pingLatencyMs: number | null;  // 端点 Ping 延迟
  checkedAt: string;  // ISO 8601 时间戳
  message: string;  // 状态消息或错误信息
}
```

### 数学挑战
```typescript
// challenge.ts
export function generateChallenge(): {
  prompt: string;
  expectedAnswer: string;
}

export function validateResponse(
  response: string,
  expectedAnswer: string
): { valid: boolean; extractedNumbers: string[] | null }
```

### 端点 Ping
```typescript
// endpoint-ping.ts
export async function measureEndpointPing(
  endpoint: string
): Promise<number | null>
// 返回 Ping 延迟（毫秒），失败返回 null
```

## 关键依赖与配置

### 外部依赖
- `ai` (Vercel AI SDK) - 统一的 AI 模型接口
- `@ai-sdk/openai` - OpenAI Provider
- `@ai-sdk/anthropic` - Anthropic Provider
- `@ai-sdk/google` - Google Gemini Provider
- `@ai-sdk/openai-compatible` - OpenAI 兼容 Provider
- `p-limit` - 并发控制

### 配置参数
- `DEFAULT_TIMEOUT_MS` - 默认超时 45 秒
- `degraded_threshold_ms` - 性能降级阈值（默认 6000ms，可通过 site_settings 配置）
- `CHECK_CONCURRENCY` - 并发检查数（默认 5）

### 推理模型支持
- 自动识别推理模型（o1/o3/deepseek-r1/qwq）
- 支持 `reasoning_effort` 参数（low/medium/high）
- 模型名称指令：`model@effort` 或 `model#effort`

## 数据模型

### ProviderConfig
```typescript
interface ProviderConfig {
  id: string;
  name: string;
  type: ProviderType;  // "openai" | "gemini" | "anthropic" | "grok"
  endpoint: string;
  model: string;
  apiKey: string;
  is_maintenance: boolean;
  requestHeaders: Record<string, string> | null;  // 自定义请求头
  metadata: Record<string, unknown> | null;  // 自定义请求参数
  groupName: string | null;
}
```

### CheckResult
```typescript
interface CheckResult {
  id: string;
  name: string;
  type: ProviderType;
  endpoint: string;
  model: string;
  status: HealthStatus;
  latencyMs: number | null;
  pingLatencyMs: number | null;
  checkedAt: string;
  message: string;
  groupName?: string | null;
}
```

## 测试与质量

### 测试策略
- 当前无自动化测试
- 建议：
  - 单元测试：数学挑战生成与验证
  - 集成测试：使用 mock 端点测试各 Provider 适配器
  - 性能测试：验证并发控制与超时机制

### 错误处理
- 超时错误：AbortController 触发，返回 "请求超时"
- 网络错误：捕获并提取 statusCode + responseBody
- 验证失败：返回 "validation_failed" 状态
- 请求中止重试：最多重试 2 次（针对 "request was aborted" 错误）

## 常见问题 (FAQ)

### Q: 如何添加新的 AI Provider？
A:
1. 在 `lib/types/provider.ts` 添加 `ProviderType`
2. 在 `ai-sdk-check.ts` 的 `createModel()` 函数中添加 switch 分支
3. 使用 `createOpenAICompatible` 或对应的 SDK 创建 Provider 实例
4. 更新 `lib/core/status.ts` 的 `PROVIDER_LABEL`
5. 在 `components/provider-icon.tsx` 添加图标

### Q: 为什么使用数学挑战而不是固定 prompt？
A: 防止假站点用固定回复绕过检测。每次生成随机数学题（如 "3 + 5 = ?"），验证回复中是否包含正确答案。

### Q: 如何自定义请求头和参数？
A:
- 请求头：在数据库 `check_configs.request_header` 字段配置 JSON 对象
- 请求参数：在 `check_configs.metadata` 字段配置 JSONB 对象，会合并到请求体

### Q: 推理模型如何指定推理强度？
A: 在模型名称后使用 `@` 或 `#` 指定：
- `o1@high` - 使用 high 推理强度
- `o1#low` - 使用 low 推理强度
- `o1` - 推理模型默认使用 medium

### Q: 如何处理 Gemini 的两种 API 格式？
A: 自动检测：
- 原生 Gemini API（包含 `/models/` 和 `:generateContent`）：使用 `@ai-sdk/google`
- OpenAI 兼容格式：使用 `@ai-sdk/openai-compatible`

## 相关文件清单

### 核心文件
- `index.ts` - 统一入口，批量执行检查
- `ai-sdk-check.ts` - 统一的 AI SDK 健康检查实现（570 行）
- `challenge.ts` - 数学挑战生成与验证
- `endpoint-ping.ts` - 端点 Ping 延迟测量

### 工具函数
- URL 处理：`deriveBaseURL()`, `isResponsesEndpoint()`, `isGoogleGenerativeEndpoint()`
- 模型解析：`parseModelDirective()` - 解析推理强度指令
- 错误处理：`getErrorMessage()`, `isTimeoutError()`
- 自定义 Fetch：`createCustomFetch()` - 注入请求头和 metadata

## 变更记录 (Changelog)

### 2026-03-06
- 初始化模块文档，覆盖所有 Provider 适配器的完整接口与实现细节
