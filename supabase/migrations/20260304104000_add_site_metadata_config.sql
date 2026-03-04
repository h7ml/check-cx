-- 添加前台 metadata 相关配置项到 site_settings 表
INSERT INTO public.site_settings (key, value, description, editable, value_type) VALUES
  ('site.title',       'LINUX DO - 模型中转状态检测', '页面 HTML title 标签', true, 'string'),
  ('site.description', '实时检测 OpenAI / Gemini / Anthropic 对话接口的可用性与延迟', '页面 meta description', true, 'string'),
  ('site.logo_url',    '/favicon.png', 'Logo 图片 URL', true, 'string'),
  ('site.favicon_url', '/favicon.png', 'Favicon URL', true, 'string')
ON CONFLICT (key) DO NOTHING;
