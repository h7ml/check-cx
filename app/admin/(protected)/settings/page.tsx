"use client";

import { useState, useEffect } from "react";
import { SlidersHorizontal } from "lucide-react";
import { SiteConfigForm } from "@/components/admin/site-config-form";

export default function SettingsPage() {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);

  // 加载配置
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/admin/site-config");
        if (res.ok) {
          const data = await res.json();
          const config: Record<string, string> = {};
          for (const item of data) {
            config[item.key] = item.value || "";
          }
          setFormData(config);
        }
      } catch (error) {
        console.error("加载配置失败", error);
        setMessage("加载配置失败");
      }
    }
    loadSettings();
  }, []);

  async function handleSubmit() {
    setLoading(true);
    setMessage("");
    setSaved(false);

    try {
      const keysToUpdate = [
        "site.title",
        "site.description",
        "site.logo_url",
        "site.favicon_url",
      ];

      // 逐个更新配置项
      for (const key of keysToUpdate) {
        const res = await fetch("/api/admin/site-config", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key,
            value: formData[key] || "",
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          setMessage(`更新失败：${error.error}`);
          setLoading(false);
          return;
        }
      }

      setMessage("配置已保存");
      setSaved(true);
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("保存失败", error);
      setMessage("保存失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* 页面头 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">系统设置</h1>
        </div>
        <p className="text-muted-foreground">
          配置前台页面的标题、描述和图标
        </p>
      </div>

      {/* 配置卡片 */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-6 text-lg font-semibold">前台页面配置</h2>

        <SiteConfigForm
          data={formData}
          onChange={(key, value) => setFormData((prev) => ({ ...prev, [key]: value }))}
        />

        {/* 消息和按钮 */}
        <div className="mt-8 flex items-center justify-between">
          {message && (
            <div
              className={`text-sm ${saved ? "text-emerald-600" : "text-destructive"}`}
            >
              {message}
            </div>
          )}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="ml-auto inline-flex h-9 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "保存中..." : "保存配置"}
          </button>
        </div>
      </div>

      {/* 提示信息 */}
      <div className="mt-6 rounded-lg border border-border/50 bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">
          <strong>提示：</strong>修改后会立即生效，前台页面会自动更新为新配置的标题和描述。
        </p>
      </div>
    </div>
  );
}
