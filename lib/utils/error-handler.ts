/**
 * 错误处理工具
 */

/**
 * 敏感字段的正则匹配模式
 */
const SENSITIVE_PATTERNS =
  /api[_-]?key|secret|token|password|authorization|bearer|credential/i;

/**
 * 对可能包含敏感信息的值进行脱敏处理
 * @param value 待脱敏的值
 */
function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    // 短字符串直接返回
    if (value.length <= 8) {
      return value;
    }
    // 长字符串部分隐藏（保留前4位和后4位）
    return `${value.slice(0, 4)}***${value.slice(-4)}`;
  }
  return value;
}

/**
 * 递归过滤错误对象中的敏感信息
 * @param error 错误对象或数据
 */
function sanitizeError(error: unknown): unknown {
  // 处理 null 和 undefined
  if (error === null || error === undefined) {
    return error;
  }

  // 处理原始类型
  if (typeof error !== "object") {
    return error;
  }

  // 处理数组
  if (Array.isArray(error)) {
    return error.map((item) => sanitizeError(item));
  }

  // 处理 Error 对象
  if (error instanceof Error) {
    const sanitized: Record<string, unknown> = {
      name: error.name,
      message: error.message,
    };
    if (error.stack) {
      sanitized.stack = error.stack;
    }
    // 递归处理 Error 对象的其他属性
    const errorObj = error as unknown as Record<string, unknown>;
    for (const key in error) {
      if (
        Object.prototype.hasOwnProperty.call(error, key) &&
        !["name", "message", "stack"].includes(key)
      ) {
        const value = errorObj[key];
        if (SENSITIVE_PATTERNS.test(key)) {
          sanitized[key] = sanitizeValue(value);
        } else {
          sanitized[key] = sanitizeError(value);
        }
      }
    }
    return sanitized;
  }

  // 处理普通对象
  const sanitized: Record<string, unknown> = {};
  for (const key in error) {
    if (Object.prototype.hasOwnProperty.call(error, key)) {
      const value = (error as Record<string, unknown>)[key];
      // 匹配敏感字段名称
      if (SENSITIVE_PATTERNS.test(key)) {
        sanitized[key] = sanitizeValue(value);
      } else {
        sanitized[key] = sanitizeError(value);
      }
    }
  }
  return sanitized;
}

/**
 * 统一的错误日志记录
 * @param context 错误上下文
 * @param error 错误对象
 */
export function logError(context: string, error: unknown): void {
  const sanitized = sanitizeError(error);
  console.error(`[check-cx] ${context}:`, sanitized);
}

/**
 * 安全地提取错误消息
 * @param error 错误对象
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "未知错误";
}
