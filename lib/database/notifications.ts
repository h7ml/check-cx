import { createAdminClient } from "@/lib/supabase/admin";
import { SystemNotificationRow } from "@/lib/types/database";

/**
 * 服务端获取所有活跃的系统通知
 */
export async function getActiveSystemNotifications(): Promise<SystemNotificationRow[]> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("system_notifications")
    .select("*")
    .eq("is_active", true)
    .or(`scope.eq.public,scope.eq.both`)
    .or(`start_time.is.null,start_time.lte.${now}`)
    .or(`end_time.is.null,end_time.gte.${now}`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch system notifications:", error);
    return [];
  }

  return data as SystemNotificationRow[];
}
