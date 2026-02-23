CREATE TABLE IF NOT EXISTS public.site_settings (
  key          TEXT PRIMARY KEY,
  value        TEXT,
  description  TEXT,
  editable     BOOLEAN NOT NULL DEFAULT true,
  value_type   TEXT NOT NULL DEFAULT 'string'
);

INSERT INTO public.site_settings (key, value, description, editable, value_type) VALUES
  ('check_poll_interval_seconds', '60',   '检测轮询间隔（秒），重启后生效', true,  'number'),
  ('degraded_threshold_ms',       '6000', '延迟超过此值判定为降级（毫秒）', true,  'number'),
  ('max_concurrency',             '5',    '并发检测任务上限（1–20）',        true,  'number'),
  ('history_retention_count',     '60',   '每个配置最多保留历史条数',        true,  'number')
ON CONFLICT (key) DO NOTHING;
