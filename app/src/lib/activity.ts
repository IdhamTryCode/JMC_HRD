import { db } from "./db";

type LogParams = {
  userId: number | null;
  action: string;
  module: string;
  description?: string;
  ipAddress?: string;
};

export async function logActivity(params: LogParams): Promise<void> {
  try {
    await db("activity_logs").insert({
      user_id: params.userId,
      action: params.action,
      module: params.module,
      description: params.description ?? null,
      ip_address: params.ipAddress ?? null,
    });
  } catch {
    // log gagal tidak boleh crash request
  }
}
