"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SiteConfigFormProps {
  data: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

export function SiteConfigForm({ data, onChange }: SiteConfigFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="site-title">页面标题</Label>
        <Input
          id="site-title"
          placeholder="如：Check CX - AI 模型健康监控"
          value={data["site.title"] || ""}
          onChange={(e) => onChange("site.title", e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          显示在浏览器标签页和搜索结果中
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="site-description">页面描述</Label>
        <Input
          id="site-description"
          placeholder="如：实时检测 OpenAI / Gemini / Anthropic 对话接口的可用性与延迟"
          value={data["site.description"] || ""}
          onChange={(e) => onChange("site.description", e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          用于 SEO meta description
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="site-logo-url">Logo URL</Label>
        <Input
          id="site-logo-url"
          placeholder="如：/favicon.png"
          value={data["site.logo_url"] || ""}
          onChange={(e) => onChange("site.logo_url", e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Logo 图片路径或完整 URL
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="site-favicon-url">Favicon URL</Label>
        <Input
          id="site-favicon-url"
          placeholder="如：/favicon.png"
          value={data["site.favicon_url"] || ""}
          onChange={(e) => onChange("site.favicon_url", e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          网站图标路径或完整 URL
        </p>
      </div>
    </div>
  );
}
