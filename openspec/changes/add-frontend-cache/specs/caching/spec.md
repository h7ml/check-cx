## ADDED Requirements

### Requirement: Frontend Memory Cache

前端 SHALL 实现内存缓存层，避免重复请求相同数据。

#### Scenario: 缓存有效时立即返回

- **WHEN** 用户请求数据
- **AND** 前端缓存存在且未过期（< 2 分钟）
- **THEN** 立即返回缓存数据
- **AND** 不发起网络请求

#### Scenario: 缓存过期时 SWR 模式

- **WHEN** 用户请求数据
- **AND** 前端缓存存在但已过期（≥ 2 分钟）
- **THEN** 立即返回缓存数据
- **AND** 在后台发起刷新请求
- **AND** 刷新完成后更新 UI

#### Scenario: 无缓存时等待请求

- **WHEN** 用户请求数据
- **AND** 前端无缓存
- **THEN** 发起网络请求
- **AND** 请求完成后返回数据并更新缓存

### Requirement: ETag Conditional Request

API SHALL 支持 ETag 条件请求，数据未变时返回 304。

#### Scenario: 生成 ETag

- **WHEN** API 返回数据
- **THEN** 响应 SHALL 包含 `ETag` 头
- **AND** ETag SHALL 基于数据内容生成

#### Scenario: 条件请求命中

- **WHEN** 请求包含 `If-None-Match` 头
- **AND** 头值与当前 ETag 匹配
- **THEN** 返回 304 Not Modified
- **AND** 响应体 SHALL 为空

#### Scenario: 条件请求未命中

- **WHEN** 请求包含 `If-None-Match` 头
- **AND** 头值与当前 ETag 不匹配
- **THEN** 返回 200 OK
- **AND** 响应体 SHALL 包含完整数据

### Requirement: Cloudflare CDN Cache

API 响应 SHALL 包含 Cloudflare CDN 缓存控制头。

#### Scenario: CDN 缓存头

- **WHEN** API 返回响应
- **THEN** 响应 SHALL 包含 `CDN-Cache-Control` 头
- **AND** `max-age` SHALL 等于轮询间隔秒数

#### Scenario: Stale-While-Revalidate

- **WHEN** API 返回响应
- **THEN** 响应 SHALL 包含 `Cloudflare-CDN-Cache-Control` 头
- **AND** `stale-while-revalidate` SHALL 设置为 5 分钟（匹配数据变化周期）

#### Scenario: 浏览器不缓存

- **WHEN** API 返回响应
- **THEN** `Cache-Control` SHALL 设置为 `public, no-cache`
- **AND** 浏览器 SHALL 每次向 CDN 验证

### Requirement: Frontend Fetch Integration

前端数据获取 SHALL 集成缓存模块和条件请求。

#### Scenario: 携带 ETag 请求

- **WHEN** 前端发起刷新请求
- **AND** 缓存中存在 ETag
- **THEN** 请求 SHALL 包含 `If-None-Match` 头

#### Scenario: 处理 304 响应

- **WHEN** 服务器返回 304
- **THEN** 前端 SHALL 继续使用缓存数据
- **AND** SHALL 更新缓存时间戳

#### Scenario: 移除 no-store

- **WHEN** 前端发起 fetch 请求
- **THEN** fetch 选项 SHALL 不包含 `cache: "no-store"`
