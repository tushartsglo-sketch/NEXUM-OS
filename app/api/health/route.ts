import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const checks = {
    database: false,
    openai: Boolean(process.env.OPENAI_API_KEY),
    vapid: Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT),
    cronSecret: Boolean(process.env.NEXUM_CRON_SECRET),
    accessToken: Boolean(process.env.NEXUM_ACCESS_TOKEN)
  };

  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch {
    checks.database = false;
  }

  const healthy = checks.database && checks.accessToken;
  return NextResponse.json({
    status: healthy ? "ok" : "degraded",
    checkedAt: new Date().toISOString(),
    checks,
    notes: {
      database: checks.database ? "Database is reachable." : "Database is not reachable.",
      openai: checks.openai ? "AI features are configured." : "AI features will use non-AI fallbacks.",
      vapid: checks.vapid ? "Push notification credentials are configured." : "Background push is not configured.",
      cronSecret: checks.cronSecret ? "Cron endpoint is protected by a secret." : "Cron secret is not configured.",
      accessToken: checks.accessToken ? "Private access token is configured." : "Private access is not configured."
    }
  }, { status: healthy ? 200 : 503 });
}
