import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function requireAuth() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return null;
  return data.claims;
}

interface ModelInfo {
  id: string;
  name: string;
  description?: string;
}

async function fetchOpenAIModels(endpoint: string, apiKey: string): Promise<ModelInfo[]> {
  const url = new URL(endpoint);
  url.pathname = "/v1/models";

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json();
  return (data.data || [])
    .filter((m: { id: string }) =>
      m.id.includes("gpt") ||
      m.id.includes("o1") ||
      m.id.includes("o3")
    )
    .map((m: { id: string }) => ({
      id: m.id,
      name: m.id,
    }));
}

async function fetchGeminiModels(apiKey: string): Promise<ModelInfo[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    { signal: AbortSignal.timeout(10000) }
  );

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json();
  return (data.models || [])
    .filter((m: { name: string }) => m.name.includes("gemini"))
    .map((m: { name: string; displayName?: string }) => ({
      id: m.name.replace("models/", ""),
      name: m.displayName || m.name.replace("models/", ""),
    }));
}

async function fetchAnthropicModels(): Promise<ModelInfo[]> {
  // Anthropic 没有公开的模型列表 API，返回常用模型
  return [
    { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet" },
    { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku" },
    { id: "claude-3-opus-20240229", name: "Claude 3 Opus" },
    { id: "claude-3-sonnet-20240229", name: "Claude 3 Sonnet" },
    { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku" },
  ];
}

async function fetchGrokModels(): Promise<ModelInfo[]> {
  // Grok 没有公开的模型列表 API，返回常用模型
  return [
    { id: "grok-beta", name: "Grok Beta" },
    { id: "grok-vision-beta", name: "Grok Vision Beta" },
  ];
}

export async function POST(request: NextRequest) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, endpoint, api_key } = body;

    if (!type || !api_key) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
    }

    let models: ModelInfo[];

    switch (type) {
      case "openai":
        if (!endpoint) {
          return NextResponse.json({ error: "OpenAI 需要提供端点" }, { status: 400 });
        }
        models = await fetchOpenAIModels(endpoint, api_key);
        break;

      case "gemini":
        models = await fetchGeminiModels(api_key);
        break;

      case "anthropic":
        models = await fetchAnthropicModels();
        break;

      case "grok":
        models = await fetchGrokModels();
        break;

      default:
        return NextResponse.json({ error: "不支持的 Provider 类型" }, { status: 400 });
    }

    return NextResponse.json({ models });
  } catch (error) {
    console.error("获取模型列表失败:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "获取模型列表失败" },
      { status: 500 }
    );
  }
}
