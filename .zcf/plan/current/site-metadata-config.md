# 前台页面 Metadata 动态配置

**创建时间**：2026-03-04 10:40:56
**完成时间**：2026-03-04 10:45:00
**任务**：通过后台 `/admin/settings` 动态配置前台页面的 title、description、icons

---

## 执行进度

### 阶段 1：数据库迁移 ✅ 完成
- [x] 检查 `site_settings` 表是否存在 → 已存在
- [x] 创建迁移文件添加前台配置项
- [x] 初始化配置项：`site.title`, `site.description`, `site.logo_url`, `site.favicon_url`

**新建文件**：
- `supabase/migrations/20260304104000_add_site_metadata_config.sql`

### 阶段 2：后端 API 层 ✅ 完成
- [x] 完善 `lib/core/site-settings.ts` 缓存逻辑
- [x] 创建 `app/api/site-config/route.ts`（公开 GET）
- [x] 创建 `app/api/admin/site-config/route.ts`（管理 POST/PUT）

**修改/新建文件**：
- `lib/core/site-settings.ts` → 增加 `getAllSiteSettings()` 方法
- `app/api/site-config/route.ts` → 新建
- `app/api/admin/site-config/route.ts` → 新建

### 阶段 3：管理后台 UI ✅ 完成
- [x] 创建 `app/admin/(protected)/settings/page.tsx`
- [x] 创建 `components/admin/site-config-form.tsx`

**新建文件**：
- `app/admin/(protected)/settings/page.tsx` → 管理页面
- `components/admin/site-config-form.tsx` → 表单组件

### 阶段 4：前台集成 ✅ 完成
- [x] 修改 `app/layout.tsx` 使用动态配置
- [x] 修改 `app/group/[groupName]/page.tsx` 支持动态 meta

**修改文件**：
- `app/layout.tsx` → 改为 generateMetadata，动态读取配置
- `app/group/[groupName]/page.tsx` → 增强 generateMetadata，读取分组信息

### 阶段 5：缓存与优化 ✅ 完成
- [x] 创建前端缓存工具 `lib/utils/site-config-cache.ts`
- [x] 在 Dashboard Bootstrap 中集成配置刷新

**新建/修改文件**：
- `lib/utils/site-config-cache.ts` → 新建前端缓存
- `components/dashboard-bootstrap.tsx` → 增加配置刷新

---

## 交付文件清单

### 新建文件（6 个）
```
app/api/site-config/route.ts
app/api/admin/site-config/route.ts
app/admin/(protected)/settings/page.tsx
components/admin/site-config-form.tsx
lib/utils/site-config-cache.ts
supabase/migrations/20260304104000_add_site_metadata_config.sql
```

### 修改文件（3 个）
```
lib/core/site-settings.ts
app/layout.tsx
app/group/[groupName]/page.tsx
components/dashboard-bootstrap.tsx
```

---

## 工作流总结

1. **数据库**：从现有 `site_settings` 表扩展，添加前台页面相关配置
2. **后端**：提供两个 API 端点（公开获取、管理员编辑）
3. **管理后台**：新增 `/admin/settings` 页面，提供 UI 编辑配置
4. **前台集成**：
   - `app/layout.tsx` 从数据库动态读取 title、description、favicon
   - `app/group/[groupName]/page.tsx` 支持分组级别 meta 配置
5. **缓存优化**：
   - 后端缓存 30 秒
   - 前端缓存 5 分钟
   - 首屏加载时刷新配置

---

## 使用说明

### 管理员操作
1. 访问 `/admin/settings`
2. 编辑页面标题、描述、Logo URL、Favicon URL
3. 点击"保存配置"

### 效果验证
- 页面标题会立即在浏览器标签页显示新内容
- SEO meta description 会更新
- 分组页 title/description 会基于分组信息和全局配置动态生成

---

## 代码质量

- ✅ 代码 lint 检查通过（新增代码无错误）
- ✅ 遵循 SOLID 单一职责原则
- ✅ 类型安全：完整的 TypeScript 类型定义
- ✅ 缓存策略：后端 30s + 前端 5min，优化性能
- ✅ 错误处理：API 降级到默认值

