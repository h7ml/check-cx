/**
 * Anthropic 官方状态检查器
 * 状态 API: https://status.claude.com/api/v2/status.json
 */

import type { OfficialStatusResult, OfficialHealthStatus } from "../types";
import { logError } from "../utils/error-handler";

const ANTHROPIC_STATUS_URL = "https://status.claude.com/api/v2/status.json";
const TIMEOUT_MS = 15000; // 15 秒超时

/**
 * Anthropic 状态 API 响应接口
 */
interface AnthropicStatusResponse {
  page: {
    id: string;
    name: string;
    url: string;
    updated_at: string;
  };
  status: {
    indicator: string; // 'none' | 'minor' | 'major' | 'critical'
    description: string; // 'All Systems Operational' | ...
  };
}

/**
 * 检查 Anthropic 官方服务状态
 */
export async function checkAnthropicStatus(): Promise<OfficialStatusResult> {
  const checkedAt = new Date().toISOString();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(ANTHROPIC_STATUS_URL, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        status: "unknown",
        message: `HTTP ${response.status}`,
        checkedAt,
      };
    }

    const data = (await response.json()) as AnthropicStatusResponse;
    return parseAnthropicStatus(data, checkedAt);
  } catch (error) {
    logError("checkAnthropicStatus", error);

    if ((error as Error).name === "AbortError") {
      return {
        status: "unknown",
        message: "检查超时",
        checkedAt,
      };
    }

    return {
      status: "unknown",
      message: "检查失败",
      checkedAt,
    };
  }
}

/**
 * 解析 Anthropic 状态响应
 *
 * indicator 值映射:
 * - 'none': 所有系统正常
 * - 'minor': 轻微问题/性能降级
 * - 'major': 重大问题/部分服务不可用
 * - 'critical': 严重故障/服务中断
 */
function parseAnthropicStatus(
  data: AnthropicStatusResponse,
  checkedAt: string
): OfficialStatusResult {
  const indicator = data.status.indicator.toLowerCase();
  const description = data.status.description;

  let status: OfficialHealthStatus;

  switch (indicator) {
    case "none":
      status = "operational";
      break;

    case "minor":
      status = "degraded";
      break;

    case "major":
    case "critical":
      status = "down";
      break;

    default:
      status = "unknown";
  }

  return {
    status,
    message: description || "未知状态",
    checkedAt,
  };
}
